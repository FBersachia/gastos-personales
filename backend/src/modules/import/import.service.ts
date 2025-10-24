import { CsvParserService, ParsedCsvRow, CsvFilters } from './csv-parser.service';
import { prisma } from '../../config/database';
import { TransactionType } from '@prisma/client';

export interface ImportPreviewRequest {
  filters?: CsvFilters;
}

export interface ImportConfirmRequest {
  transactions: Array<{
    date: string;
    type: TransactionType;
    description: string;
    amount: number;
    categoryId: string;
    paymentMethodId: string;
    installments?: string;
    recurringSeriesId?: string;
  }>;
  createMissingCategories?: boolean;
}

export interface ImportSummary {
  imported: number;
  failed: number;
  newCategoriesCreated: number;
  errors: Array<{ row: number; message: string }>;
}

export class ImportService {
  private csvParser: CsvParserService;

  constructor() {
    this.csvParser = new CsvParserService();
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

    const categories = await prisma.category.findMany({
      include: { macroCategory: true }
    });

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
      suggestedPaymentMethodId: this.findMatchingPaymentMethod(
        row.detectedPaymentMethod,
        paymentMethods
      ),
      // Suggest matching category
      suggestedCategoryId: this.findMatchingCategory(row.category, categories)
    }));

    return {
      preview,
      summary: {
        totalRecords: result.totalRecords,
        filteredRecords: result.filteredRecords,
        willImport: result.filteredRecords
      },
      warnings: result.warnings,
      availablePaymentMethods: paymentMethods.map(pm => ({
        id: pm.id,
        name: pm.name
      })),
      availableCategories: categories.map(c => ({
        id: c.id,
        name: c.name,
        macroCategory: c.macroCategory.name
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
    const summary: ImportSummary = {
      imported: 0,
      failed: 0,
      newCategoriesCreated: 0,
      errors: []
    };

    const categoryCache = new Map<string, string>(); // name -> id

    // Pre-load existing categories
    const existingCategories = await prisma.category.findMany();
    existingCategories.forEach(c => categoryCache.set(c.name.toLowerCase(), c.id));

    for (let i = 0; i < data.transactions.length; i++) {
      const txn = data.transactions[i];

      try {
        // Validate payment method belongs to user
        const paymentMethod = await prisma.paymentMethod.findFirst({
          where: { id: txn.paymentMethodId, userId }
        });

        if (!paymentMethod) {
          throw new Error('Invalid payment method');
        }

        // Validate or create category
        let categoryId = txn.categoryId;
        if (!categoryId && data.createMissingCategories) {
          // Try to create missing category (this would need a default macro category)
          const defaultMacroCategory = await prisma.macroCategory.findFirst();
          if (defaultMacroCategory) {
            const newCategory = await prisma.category.create({
              data: {
                name: txn.description.substring(0, 50), // Use description as category name
                macroCategoryId: defaultMacroCategory.id
              }
            });
            categoryId = newCategory.id;
            summary.newCategoriesCreated++;
          }
        }

        if (!categoryId) {
          throw new Error('Category is required');
        }

        // Validate category exists
        const category = await prisma.category.findUnique({
          where: { id: categoryId }
        });

        if (!category) {
          throw new Error('Invalid category');
        }

        // Validate installments format if provided
        if (txn.installments) {
          const installmentsRegex = /^\d+\/\d+$/;
          if (!installmentsRegex.test(txn.installments)) {
            throw new Error('Invalid installments format. Expected: n1/n2');
          }
        }

        // Create transaction
        await prisma.transaction.create({
          data: {
            date: new Date(txn.date),
            type: txn.type,
            description: txn.description,
            amount: txn.amount,
            categoryId,
            paymentMethodId: txn.paymentMethodId,
            installments: txn.installments,
            recurringSeriesId: txn.recurringSeriesId,
            userId
          }
        });

        summary.imported++;
      } catch (error: any) {
        summary.failed++;
        summary.errors.push({
          row: i + 1,
          message: error.message
        });
      }
    }

    return summary;
  }

  /**
   * Find matching payment method by name
   */
  private findMatchingPaymentMethod(
    detectedName: string | null,
    paymentMethods: Array<{ id: string; name: string }>
  ): string | null {
    if (!detectedName) return null;

    const match = paymentMethods.find(pm =>
      pm.name.toLowerCase().includes(detectedName.toLowerCase()) ||
      detectedName.toLowerCase().includes(pm.name.toLowerCase())
    );

    return match?.id || null;
  }

  /**
   * Find matching category by name
   */
  private findMatchingCategory(
    categoryName: string,
    categories: Array<{ id: string; name: string }>
  ): string | null {
    if (!categoryName) return null;

    const match = categories.find(c =>
      c.name.toLowerCase() === categoryName.toLowerCase()
    );

    return match?.id || null;
  }
}
