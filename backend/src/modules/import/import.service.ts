import { CsvParserService, ParsedCsvRow, CsvFilters } from './csv-parser.service';
import { PdfParserService } from './pdf-parser.service';
import { prisma } from '../../config/database';

export interface ImportPreviewRequest {
  filters?: CsvFilters;
}

export interface ImportConfirmRequest {
  transactions: Array<{
    date: string;
    type: 'INCOME' | 'EXPENSE';
    description: string;
    amount: number;
    categoryId: string;
    paymentMethodId: string;
    installments?: string;
    recurringSeriesId?: string;
  }>;
  createMissingCategories?: boolean;
}

export interface PdfImportConfirmRequest {
  bank: string;
  paymentMethodId: string;
  statementPeriod?: {
    month: number;
    year: number;
  };
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    currency?: string;
    categoryId?: string;
    installments?: string;
  }>;
}

export interface ImportSummary {
  imported: number;
  failed: number;
  newCategoriesCreated: number;
  errors: Array<{ row: number; message: string }>;
}

export class ImportService {
  private csvParser: CsvParserService;
  private pdfParser: PdfParserService;

  // Hardcoded payment method ID mappings (keys are lowercase for case-insensitive lookup)
  private readonly PAYMENT_METHOD_IDS: Record<string, string> = {
    'ingreso': 'c398157b-1cf2-4b05-b574-ae6f5f550fd6',
    'amex galicia': 'cb91b600-4c13-477a-88ba-15aeea7d2095',
    'amex santander': 'ed5141fa-863c-4ae4-aaa8-a84256d0c432',
    'efectivo': '9fa37e03-b502-4b2a-91df-a1f82f039004',
    'visa galicia': 'c5c71f96-7643-4b4b-a9e6-7be867a0227a',
    'visa santander': 'e03810f7-9d46-4b71-abf8-8cb0a6104aed'
  };

  constructor() {
    this.csvParser = new CsvParserService();
    this.pdfParser = new PdfParserService();
  }

  /**
   * Preview PDF import
   */
  async previewPdf(fileBuffer: Buffer, userId?: string) {
    const result = await this.pdfParser.parse(fileBuffer);

    // Get user's payment methods and categories for mapping
    const paymentMethods = userId
      ? await prisma.paymentMethod.findMany({ where: { userId } })
      : [];

    const categories = userId
      ? await prisma.category.findMany({
          where: { userId },
          include: { macroCategory: true }
        })
      : [];

    // Auto-detect payment method ID from detected payment method name
    let detectedPaymentMethodId: string | null = null;

    if (result.detectedPaymentMethod && result.detectedPaymentMethod !== 'Unknown') {
      // First try hardcoded mapping (case-insensitive)
      const hardcodedId = this.PAYMENT_METHOD_IDS[result.detectedPaymentMethod.toLowerCase()];

      if (hardcodedId) {
        // Verify it exists in user's payment methods
        const exists = paymentMethods.find(pm => pm.id === hardcodedId);
        if (exists) {
          detectedPaymentMethodId = hardcodedId;
        }
      } else {
        // Fallback: find by name match
        const matchedPm = paymentMethods.find(
          pm => pm.name.toLowerCase() === result.detectedPaymentMethod.toLowerCase()
        );
        if (matchedPm) {
          detectedPaymentMethodId = matchedPm.id;
        }
      }
    }

    // Default category ID for PDF imports
    const DEFAULT_PDF_CATEGORY_ID = 'c621681b-4fd5-46ad-a476-dd88d4adea57';

    // Map parsed transactions to preview format
    const preview = result.transactions.map(txn => ({
      date: txn.date.toISOString(),
      description: txn.description,
      amount: txn.amount,
      currency: txn.currency,
      installments: txn.installments,
      originalLine: txn.originalLine,
      // Set default category for PDF imports
      suggestedCategoryId: DEFAULT_PDF_CATEGORY_ID
    }));

    return {
      bank: result.bank,
      detectedPaymentMethod: result.detectedPaymentMethod,
      detectedPaymentMethodId,
      preview,
      summary: {
        totalRecords: result.totalRecords,
        willImport: result.totalRecords
      },
      warnings: result.warnings,
      statementPeriod: result.statementPeriod,
      availablePaymentMethods: paymentMethods.map(pm => ({
        id: pm.id,
        name: pm.name
      })),
      availableCategories: categories.map(c => ({
        id: c.id,
        name: c.name,
        macroCategory: c.macroCategory?.name || null
      }))
    };
  }

  /**
   * Confirm and execute PDF import
   */
  async confirmPdfImport(
    data: PdfImportConfirmRequest,
    userId: string
  ): Promise<ImportSummary> {
    console.log('[PDF Import Service] Starting import for', data.transactions.length, 'transactions');

    const summary: ImportSummary = {
      imported: 0,
      failed: 0,
      newCategoriesCreated: 0,
      errors: []
    };

    // Validate payment method belongs to user
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: data.paymentMethodId,
        userId
      }
    });

    if (!paymentMethod) {
      throw new Error('Invalid payment method');
    }

    // Log transaction dates that seem unusual (for monitoring, not blocking)
    // Note: Credit card statements can include transactions from various dates
    // This is just informational and won't block the import
    if (data.statementPeriod) {
      const { month, year } = data.statementPeriod;
      console.log(`[PDF Import] Statement period: ${month}/${year}`);

      // Calculate previous month
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      let unusualDates = 0;
      for (let i = 0; i < data.transactions.length; i++) {
        const txn = data.transactions[i];
        const txnDate = new Date(txn.date);
        const txnMonth = txnDate.getMonth() + 1;
        const txnYear = txnDate.getFullYear();

        const isCurrentMonth = txnMonth === month && txnYear === year;
        const isPreviousMonth = txnMonth === prevMonth && txnYear === prevYear;
        const isInstallment = !!txn.installments;

        if (!isCurrentMonth && !isPreviousMonth && !isInstallment) {
          unusualDates++;
        }
      }

      if (unusualDates > 0) {
        console.log(`[PDF Import] Note: ${unusualDates} transactions with dates outside statement period (this is normal for installments)`);
      }
    }

    // Get all valid category IDs
    const categoryIds = data.transactions
      .map(t => t.categoryId)
      .filter((id): id is string => !!id);

    const validCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    });
    const validCategoryIds = new Set(validCategories.map(c => c.id));

    console.log('[PDF Import Service] Found', validCategoryIds.size, 'valid categories');

    // Prepare transactions for batch insert
    const validTransactions = [];
    const installmentsRegex = /^\d+\/\d+$/;

    for (let i = 0; i < data.transactions.length; i++) {
      const txn = data.transactions[i];

      try {
        // Skip if no category
        if (!txn.categoryId) {
          throw new Error('Category is required');
        }

        // Validate category
        if (!validCategoryIds.has(txn.categoryId)) {
          throw new Error('Invalid category');
        }

        // Validate installments format if provided
        if (txn.installments && !installmentsRegex.test(txn.installments)) {
          throw new Error('Invalid installments format. Expected: n1/n2');
        }

        // All PDF transactions are expenses by default (bank statements)
        const formato = txn.installments ? 'cuotas' : 'contado';

        validTransactions.push({
          date: new Date(txn.date),
          type: 'EXPENSE',
          description: txn.description,
          amount: txn.amount,
          currency: txn.currency || 'ARS',
          categoryId: txn.categoryId,
          paymentId: data.paymentMethodId,
          installments: txn.installments || null,
          formato,
          source: 'pdf',
          seriesId: null,
          userId
        });
      } catch (error: any) {
        summary.failed++;
        summary.errors.push({
          row: i + 1,
          message: error.message
        });
      }
    }

    console.log('[PDF Import Service] Validated', validTransactions.length, 'transactions, inserting into database...');

    // Batch insert all valid transactions
    if (validTransactions.length > 0) {
      try {
        const result = await prisma.transaction.createMany({
          data: validTransactions,
          skipDuplicates: false
        });
        summary.imported = result.count;
        console.log('[PDF Import Service] Successfully inserted', result.count, 'transactions');
      } catch (error: any) {
        console.error('[PDF Import Service] Batch insert failed:', error.message);
        // If batch insert fails, fall back to individual inserts
        console.log('[PDF Import Service] Falling back to individual inserts...');
        for (let i = 0; i < validTransactions.length; i++) {
          try {
            await prisma.transaction.create({
              data: validTransactions[i]
            });
            summary.imported++;
          } catch (individualError: any) {
            summary.failed++;
            summary.errors.push({
              row: i + 1,
              message: individualError.message
            });
          }
        }
      }
    }

    console.log('[PDF Import Service] Import completed:', summary);
    return summary;
  }

  /**
   * Try to find category based on description keywords
   */
  private findCategoryByDescription(
    description: string,
    categories: Array<{ id: string; name: string }>
  ): string | null {
    if (!description || !categories || categories.length === 0) {
      return null;
    }

    const descLower = description.toLowerCase();

    // Try to find category by matching keywords
    for (const category of categories) {
      const categoryLower = category.name.toLowerCase();
      if (descLower.includes(categoryLower) || categoryLower.includes(descLower)) {
        console.log(`[PDF Import] Category auto-match: "${description}" -> "${category.name}"`);
        return category.id;
      }
    }

    return null;
  }

  /**
   * Preview CSV import with filters
   */
  async previewCsv(fileBuffer: Buffer, filters?: CsvFilters, userId?: string) {
    const result = await this.csvParser.parseWithFilters(fileBuffer, filters);

    // Get user's payment methods and categories for mapping
    const paymentMethods = userId
      ? await prisma.paymentMethod.findMany({ where: { userId } })
      : [];

    const categories = userId
      ? await prisma.category.findMany({
          where: { userId },
          include: { macroCategory: true }
        })
      : [];

    // Map parsed rows to preview format
    const preview = result.rows.map(row => ({
      date: row.date.toISOString(),
      type: row.type,
      description: row.description,
      amount: row.amount,
      category: row.category,
      detectedPaymentMethod: row.detectedPaymentMethod,
      installments: row.installments,
      originalRow: row.originalRow,
      // Suggest matching payment method
      // Use hardcoded mapping if available, otherwise try dynamic matching
      suggestedPaymentMethodId: this.getPaymentMethodId(row.detectedPaymentMethod, paymentMethods),
      // Suggest matching category
      suggestedCategoryId: this.findMatchingCategory(row.category, categories)
    }));

    // Get all unique detected payment methods from CSV
    const detectedPaymentMethods = [...new Set(result.rows.map(row => row.detectedPaymentMethod))];

    // Combine database payment methods with detected ones (for filtering purposes)
    // Use lowercase keys to avoid case sensitivity issues
    const allPaymentMethodsForFilter = new Map<string, { id: string; name: string }>();

    // Add database payment methods (use lowercase keys)
    paymentMethods.forEach(pm => {
      allPaymentMethodsForFilter.set(pm.name.toLowerCase(), { id: pm.id, name: pm.name });
    });

    // Add detected payment methods that aren't in the database (use lowercase keys for comparison)
    detectedPaymentMethods.forEach(name => {
      const lowerName = name.toLowerCase();
      if (!allPaymentMethodsForFilter.has(lowerName)) {
        allPaymentMethodsForFilter.set(lowerName, { id: `detected_${name}`, name });
      }
    });

    return {
      preview,
      summary: {
        totalRecords: result.totalRecords,
        filteredRecords: result.filteredRecords,
        willImport: result.filteredRecords
      },
      warnings: result.warnings,
      availablePaymentMethods: Array.from(allPaymentMethodsForFilter.values()),
      availableCategories: categories.map(c => ({
        id: c.id,
        name: c.name,
        macroCategory: c.macroCategory?.name || null
      }))
    };
  }

  /**
   * Confirm and execute import
   */
  async confirmImport(
    data: ImportConfirmRequest,
    userId: string
  ): Promise<ImportSummary> {
    console.log('[Import Service] Starting import for', data.transactions.length, 'transactions');

    const summary: ImportSummary = {
      imported: 0,
      failed: 0,
      newCategoriesCreated: 0,
      errors: []
    };

    // Pre-validate all payment methods and categories in batches
    const paymentMethodIds = [...new Set(data.transactions.map(t => t.paymentMethodId))];
    const categoryIds = [...new Set(data.transactions.map(t => t.categoryId))];

    console.log('[Import Service] Validating', paymentMethodIds.length, 'payment methods and', categoryIds.length, 'categories');

    // Validate all payment methods belong to user
    const validPaymentMethods = await prisma.paymentMethod.findMany({
      where: {
        id: { in: paymentMethodIds },
        userId
      }
    });
    const validPaymentMethodIds = new Set(validPaymentMethods.map(pm => pm.id));

    // Validate all categories exist
    const validCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    });
    const validCategoryIds = new Set(validCategories.map(c => c.id));

    console.log('[Import Service] Found', validPaymentMethodIds.size, 'valid payment methods and', validCategoryIds.size, 'valid categories');

    // Prepare transactions for batch insert
    const validTransactions = [];
    const installmentsRegex = /^\d+\/\d+$/;

    for (let i = 0; i < data.transactions.length; i++) {
      const txn = data.transactions[i];

      try {
        // Validate payment method
        if (!validPaymentMethodIds.has(txn.paymentMethodId)) {
          throw new Error('Invalid payment method');
        }

        // Validate category
        if (!validCategoryIds.has(txn.categoryId)) {
          throw new Error('Invalid category');
        }

        // Validate installments format if provided
        if (txn.installments && !installmentsRegex.test(txn.installments)) {
          throw new Error('Invalid installments format. Expected: n1/n2');
        }

        // Calculate formato based on installments
        const formato = txn.installments ? 'cuotas' : 'contado';

        // Add to valid transactions
        validTransactions.push({
          date: new Date(txn.date),
          type: txn.type,
          description: txn.description,
          amount: txn.amount,
          categoryId: txn.categoryId,
          paymentId: txn.paymentMethodId, // Schema uses 'paymentId'
          installments: txn.installments || null,
          formato,
          source: 'csv',
          seriesId: txn.recurringSeriesId || null, // Schema uses 'seriesId'
          userId
        });
      } catch (error: any) {
        summary.failed++;
        summary.errors.push({
          row: i + 1,
          message: error.message
        });
      }
    }

    console.log('[Import Service] Validated', validTransactions.length, 'transactions, inserting into database...');

    // Batch insert all valid transactions
    if (validTransactions.length > 0) {
      try {
        const result = await prisma.transaction.createMany({
          data: validTransactions,
          skipDuplicates: false
        });
        summary.imported = result.count;
        console.log('[Import Service] Successfully inserted', result.count, 'transactions');
      } catch (error: any) {
        console.error('[Import Service] Batch insert failed:', error.message);
        // If batch insert fails, fall back to individual inserts
        console.log('[Import Service] Falling back to individual inserts...');
        for (let i = 0; i < validTransactions.length; i++) {
          try {
            await prisma.transaction.create({
              data: validTransactions[i]
            });
            summary.imported++;
          } catch (individualError: any) {
            summary.failed++;
            summary.errors.push({
              row: i + 1,
              message: individualError.message
            });
          }
        }
      }
    }

    console.log('[Import Service] Import completed:', summary);
    return summary;
  }

  /**
   * Get payment method ID from hardcoded mapping or dynamic matching
   * First checks hardcoded IDs, then falls back to dynamic matching
   */
  private getPaymentMethodId(
    detectedName: string,
    paymentMethods: Array<{ id: string; name: string }>
  ): string | null {
    // Check hardcoded mapping first (case-insensitive)
    const hardcodedId = this.PAYMENT_METHOD_IDS[detectedName.toLowerCase()];
    if (hardcodedId) {
      console.log(`[CSV Import] Hardcoded mapping: "${detectedName}" -> ${hardcodedId}`);
      return hardcodedId;
    }

    // Fall back to dynamic matching
    return this.findMatchingPaymentMethod(detectedName, paymentMethods);
  }

  /**
   * Find matching payment method by name
   * Returns the ID of the best matching payment method
   */
  private findMatchingPaymentMethod(
    detectedName: string,
    paymentMethods: Array<{ id: string; name: string }>
  ): string | null {
    if (!paymentMethods || paymentMethods.length === 0) {
      return null;
    }

    const detectedLower = detectedName.toLowerCase().trim();

    // 1. Try exact match first (case-insensitive)
    let match = paymentMethods.find(pm =>
      pm.name.toLowerCase().trim() === detectedLower
    );
    if (match) {
      console.log(`[CSV Import] Exact match: "${detectedName}" -> "${match.name}" (${match.id})`);
      return match.id;
    }

    // 2. Try exact match ignoring extra spaces
    const normalizedDetected = detectedLower.replace(/\s+/g, ' ');
    match = paymentMethods.find(pm =>
      pm.name.toLowerCase().trim().replace(/\s+/g, ' ') === normalizedDetected
    );
    if (match) {
      console.log(`[CSV Import] Normalized match: "${detectedName}" -> "${match.name}" (${match.id})`);
      return match.id;
    }

    // 3. Try partial match (either contains or is contained)
    match = paymentMethods.find(pm =>
      pm.name.toLowerCase().includes(detectedLower) ||
      detectedLower.includes(pm.name.toLowerCase())
    );
    if (match) {
      console.log(`[CSV Import] Partial match: "${detectedName}" -> "${match.name}" (${match.id})`);
      return match.id;
    }

    // 4. Try matching all words in detected name (e.g., "Visa Galicia" matches payment method containing both "visa" and "galicia")
    const words = detectedLower.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 1) {
      match = paymentMethods.find(pm => {
        const pmLower = pm.name.toLowerCase();
        return words.every(word => pmLower.includes(word));
      });
      if (match) {
        console.log(`[CSV Import] All-words match: "${detectedName}" -> "${match.name}" (${match.id})`);
        return match.id;
      }
    }

    // 5. Try matching any significant word (ignore common words)
    const significantWords = words.filter(w => w.length > 2); // Words with 3+ chars
    if (significantWords.length > 0) {
      match = paymentMethods.find(pm => {
        const pmLower = pm.name.toLowerCase();
        return significantWords.some(word =>
          pmLower.includes(word) && word.length >= 3
        );
      });
      if (match) {
        console.log(`[CSV Import] Significant-word match: "${detectedName}" -> "${match.name}" (${match.id})`);
        return match.id;
      }
    }

    console.log(`[CSV Import] No match found for: "${detectedName}"`);
    return null;
  }

  /**
   * Find matching category by name
   * Uses progressive matching strategies from exact to fuzzy matching
   */
  private findMatchingCategory(
    categoryName: string,
    categories: Array<{ id: string; name: string }>
  ): string | null {
    if (!categoryName || !categories || categories.length === 0) {
      return null;
    }

    const categoryLower = categoryName.toLowerCase().trim();

    // 1. Try exact match first (case-insensitive)
    let match = categories.find(c =>
      c.name.toLowerCase().trim() === categoryLower
    );
    if (match) {
      console.log(`[CSV Import] Category exact match: "${categoryName}" -> "${match.name}" (${match.id})`);
      return match.id;
    }

    // 2. Try exact match ignoring extra spaces
    const normalizedCategory = categoryLower.replace(/\s+/g, ' ');
    match = categories.find(c =>
      c.name.toLowerCase().trim().replace(/\s+/g, ' ') === normalizedCategory
    );
    if (match) {
      console.log(`[CSV Import] Category normalized match: "${categoryName}" -> "${match.name}" (${match.id})`);
      return match.id;
    }

    // 3. Try partial match (either contains or is contained)
    match = categories.find(c =>
      c.name.toLowerCase().includes(categoryLower) ||
      categoryLower.includes(c.name.toLowerCase())
    );
    if (match) {
      console.log(`[CSV Import] Category partial match: "${categoryName}" -> "${match.name}" (${match.id})`);
      return match.id;
    }

    // 4. Try matching all words in category name
    const words = categoryLower.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 1) {
      match = categories.find(c => {
        const cLower = c.name.toLowerCase();
        return words.every(word => cLower.includes(word));
      });
      if (match) {
        console.log(`[CSV Import] Category all-words match: "${categoryName}" -> "${match.name}" (${match.id})`);
        return match.id;
      }
    }

    // 5. Try matching any significant word (ignore short words)
    const significantWords = words.filter(w => w.length > 2);
    if (significantWords.length > 0) {
      match = categories.find(c => {
        const cLower = c.name.toLowerCase();
        return significantWords.some(word =>
          cLower.includes(word) && word.length >= 3
        );
      });
      if (match) {
        console.log(`[CSV Import] Category significant-word match: "${categoryName}" -> "${match.name}" (${match.id})`);
        return match.id;
      }
    }

    console.log(`[CSV Import] No category match found for: "${categoryName}"`);
    return null;
  }
}
