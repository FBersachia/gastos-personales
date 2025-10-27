import pdf from 'pdf-parse';

export type BankType = 'SANTANDER' | 'GALICIA' | 'AMEX' | 'UNKNOWN';

export interface ParsedPdfTransaction {
  date: Date;
  description: string;
  amount: number;
  installments: string | null;
  originalLine: number;
}

export interface PdfParseResult {
  bank: BankType;
  transactions: ParsedPdfTransaction[];
  totalRecords: number;
  warnings: string[];
  rawText?: string; // For debugging
  statementPeriod?: {
    month: number; // 1-12
    year: number;
  };
}

export class PdfParserService {
  /**
   * Parse PDF file buffer
   */
  async parse(fileBuffer: Buffer): Promise<PdfParseResult> {
    try {
      // Extract text from PDF
      const pdfData = await pdf(fileBuffer);
      const text = pdfData.text;

      // Detect bank type
      const bank = this.detectBank(text);

      if (bank === 'UNKNOWN') {
        return {
          bank,
          transactions: [],
          totalRecords: 0,
          warnings: ['Could not detect bank type from PDF. Supported banks: Santander, Galicia, Amex'],
          rawText: text
        };
      }

      // Parse transactions based on bank
      let transactions: ParsedPdfTransaction[] = [];
      const warnings: string[] = [];

      try {
        switch (bank) {
          case 'SANTANDER':
            transactions = this.parseSantander(text);
            break;
          case 'GALICIA':
            transactions = this.parseGalicia(text);
            break;
          case 'AMEX':
            transactions = this.parseAmex(text);
            break;
        }
      } catch (error: any) {
        warnings.push(`Error parsing ${bank} transactions: ${error.message}`);
      }

      // Generate warnings
      const parseWarnings = this.generateWarnings(transactions);
      warnings.push(...parseWarnings);

      // Extract statement period
      const statementPeriod = this.extractStatementPeriod(text, transactions);

      return {
        bank,
        transactions,
        totalRecords: transactions.length,
        warnings,
        rawText: text,
        statementPeriod
      };
    } catch (error: any) {
      throw new Error(`PDF parsing error: ${error.message}`);
    }
  }

  /**
   * Detect bank type from PDF text content
   * Priority is given to issuing bank (Galicia vs Santander) since format is bank-specific
   */
  private detectBank(text: string): BankType {
    const lowerText = text.toLowerCase();

    // Santander detection (works for both Visa Santander and Amex Santander)
    if (
      lowerText.includes('banco santander') ||
      lowerText.includes('santander río') ||
      lowerText.includes('santander argentina')
    ) {
      return 'SANTANDER';
    }

    // Galicia detection (works for both Visa Galicia and Amex Galicia)
    if (
      lowerText.includes('banco galicia') ||
      lowerText.includes('banco de galicia') ||
      lowerText.includes('galicia homebanking') ||
      lowerText.includes('bancogalicia') ||
      lowerText.includes('tarjetas galicia') ||
      lowerText.includes('cuit banco: 30-50000173-5') // Galicia's CUIT
    ) {
      return 'GALICIA';
    }

    // Generic Amex (if no specific bank detected - fallback to Amex parser)
    if (
      lowerText.includes('american express') ||
      lowerText.includes('amex argentina') ||
      lowerText.includes('tarjeta american express')
    ) {
      return 'AMEX';
    }

    return 'UNKNOWN';
  }

  /**
   * Parse Santander PDF statement
   * Real format from Santander Río:
   * "25 Agosto  17 005903 *  SUR GAS                                                   63.000,00"
   * or just: "           17 146455 *  MERPAGO*TIN                                               18.000,00"
   */
  private parseSantander(text: string): ParsedPdfTransaction[] {
    const transactions: ParsedPdfTransaction[] = [];
    const lines = text.split('\n');

    // Month mapping for Spanish month names
    const monthMap: Record<string, number> = {
      'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
      'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
      'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };

    let currentMonth = new Date().getMonth() + 1; // Default to current month
    let currentYear = new Date().getFullYear();

    // Pattern for month header: "25 Agosto" or "Agosto 25"
    const monthPattern = /(\d{2,4})?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i;

    // Pattern for transaction lines:
    // "           17 146455 *  MERPAGO*TIN                                               18.000,00"
    // or with month: "25 Agosto  17 005903 *  SUR GAS                                                   63.000,00"
    const transactionPattern = /^\s*(?:\d{2,4}\s+\w+\s+)?(\d{1,2})\s+\d+\s+[*K]\s+(.+?)\s+([\d.,]+)\s*$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Check for month header
      const monthMatch = line.match(monthPattern);
      if (monthMatch) {
        const [, yearStr, monthName] = monthMatch;
        currentMonth = monthMap[monthName.toLowerCase()];

        // If year is in format "25" (2025), convert to full year
        if (yearStr) {
          if (yearStr.length === 2) {
            currentYear = 2000 + parseInt(yearStr);
          } else if (yearStr.length === 4) {
            currentYear = parseInt(yearStr);
          }
        }
      }

      // Check for transaction
      const txnMatch = line.match(transactionPattern);
      if (txnMatch) {
        try {
          const [, dayStr, description, amountStr] = txnMatch;

          const day = parseInt(dayStr);
          const date = new Date(currentYear, currentMonth - 1, day);
          const amount = this.parseAmount(amountStr);
          const cleanDescription = description.trim();
          const installments = this.detectInstallments(cleanDescription);

          transactions.push({
            date,
            description: cleanDescription,
            amount,
            installments,
            originalLine: i + 1
          });
        } catch (error) {
          console.warn(`Skipping invalid line ${i + 1}: ${line}`);
        }
      }
    }

    return transactions;
  }

  /**
   * Parse Galicia PDF statement
   * Real format from Banco Galicia (works for both Visa and Amex):
   * Multi-line format (most common):
   *   "24-08-24*SER BAZARES BERAZATEGUI 12/12"
   *   "003495"
   *   "1.249,16"
   * Single-line format:
   *   "01-07-25 GOOGLE *GSUITE_i P1covLLC USD 11,52 58768111,52"
   */
  private parseGalicia(text: string): ParsedPdfTransaction[] {
    const transactions: ParsedPdfTransaction[] = [];
    const lines = text.split('\n');

    // Single-line pattern: "DD-MM-YY [*|K|Q] DESCRIPTION AMOUNT REFERENCE"
    const singleLinePattern = /^(\d{2}-\d{2}-\d{2})\s*[*KQ]?\s*(.+?)\s+([\d.,]+)\s+\d+\s*$/;

    // Multi-line first line pattern: "DD-MM-YY[*|K]DESCRIPTION n/n"
    const multiLineStartPattern = /^(\d{2}-\d{2}-\d{2})\s*[*K](.+)$/;

    // Amount pattern for third line: just a number in Argentine format
    const amountPattern = /^([\d.,]+)\s*$/;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();

      if (!line) {
        i++;
        continue;
      }

      // Try single-line format first
      const singleMatch = line.match(singleLinePattern);
      if (singleMatch) {
        try {
          const [, dateStr, description, amountStr] = singleMatch;
          const date = this.parseDateDDMMYY(dateStr);
          const amount = this.parseAmount(amountStr);
          const installments = this.detectInstallments(description);

          transactions.push({
            date,
            description: description.trim(),
            amount,
            installments,
            originalLine: i + 1
          });
        } catch (error) {
          console.warn(`Skipping invalid single-line ${i + 1}: ${line}`);
        }
        i++;
        continue;
      }

      // Try multi-line format
      const multiMatch = line.match(multiLineStartPattern);
      if (multiMatch && i + 2 < lines.length) {
        try {
          const [, dateStr, description] = multiMatch;
          const referenceLine = lines[i + 1].trim();
          const amountLine = lines[i + 2].trim();

          const amountMatch = amountLine.match(amountPattern);
          if (amountMatch && referenceLine.match(/^\d+$/)) {
            const date = this.parseDateDDMMYY(dateStr);
            const amount = this.parseAmount(amountMatch[1]);
            const installments = this.detectInstallments(description);

            transactions.push({
              date,
              description: description.trim(),
              amount,
              installments,
              originalLine: i + 1
            });

            i += 3; // Skip the next 2 lines (reference and amount)
            continue;
          }
        } catch (error) {
          console.warn(`Skipping invalid multi-line starting at ${i + 1}`);
        }
      }

      i++;
    }

    return transactions;
  }

  /**
   * Parse Amex PDF statement (fallback parser)
   * This is used when we can't detect the specific issuing bank
   * Note: Most Amex cards are detected as SANTANDER or GALICIA based on issuing bank
   * This parser tries multiple formats as a fallback
   */
  private parseAmex(text: string): ParsedPdfTransaction[] {
    const transactions: ParsedPdfTransaction[] = [];
    const lines = text.split('\n');

    // Try various Amex patterns
    // Pattern 1: DD/MM or DD/MM/YY or DD/MM/YYYY with slash separator
    const slashPattern = /^(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.+?)\s+([\d.,]+)$/;

    // Pattern 2: DD-MM-YY with dash separator (Galicia style)
    const dashPattern = /^(\d{2}-\d{2}-\d{2})\s*[*KQ]?\s*(.+?)\s+([\d.,]+)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Try slash format
      let match = line.match(slashPattern);
      if (match) {
        try {
          const [, dateStr, description, amountStr] = match;
          const date = this.parseDate(dateStr);
          const amount = this.parseAmount(amountStr);
          const installments = this.detectInstallments(description);

          transactions.push({
            date,
            description: description.trim(),
            amount,
            installments,
            originalLine: i + 1
          });
          continue;
        } catch (error) {
          console.warn(`Skipping invalid line ${i + 1}: ${line}`);
        }
      }

      // Try dash format (Galicia style)
      match = line.match(dashPattern);
      if (match) {
        try {
          const [, dateStr, description, amountStr] = match;
          const date = this.parseDateDDMMYY(dateStr);
          const amount = this.parseAmount(amountStr);
          const installments = this.detectInstallments(description);

          transactions.push({
            date,
            description: description.trim(),
            amount,
            installments,
            originalLine: i + 1
          });
        } catch (error) {
          console.warn(`Skipping invalid line ${i + 1}: ${line}`);
        }
      }
    }

    return transactions;
  }

  /**
   * Parse date from DD-MM-YY format (Galicia format)
   */
  private parseDateDDMMYY(dateStr: string): Date {
    // Format: DD-MM-YY (e.g., "24-08-24" or "01-07-25")
    const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid DD-MM-YY date format: ${dateStr}`);
    }

    const [, day, month, year] = match;
    const fullYear = `20${year}`; // Assume 20xx

    const date = new Date(`${fullYear}-${month}-${day}`);
    if (!isNaN(date.getTime())) {
      return date;
    }

    throw new Error(`Invalid date: ${dateStr}`);
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date {
    // Handle different date formats: DD/MM/YYYY, DD/MM/YY, DD/MM
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/,  // DD/MM/YYYY
      /^(\d{2})\/(\d{2})\/(\d{2})$/,  // DD/MM/YY
      /^(\d{2})\/(\d{2})$/             // DD/MM (assume current year)
    ];

    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      const match = dateStr.match(format);

      if (match) {
        const [, day, month, year] = match;

        let fullYear: string;
        if (i === 0) {
          // DD/MM/YYYY
          fullYear = year;
        } else if (i === 1) {
          // DD/MM/YY - assume 20xx
          fullYear = `20${year}`;
        } else {
          // DD/MM - use current year
          fullYear = new Date().getFullYear().toString();
        }

        const date = new Date(`${fullYear}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    throw new Error(`Invalid date format: ${dateStr}`);
  }

  /**
   * Parse amount from string (handle Argentine format: 1.500,00)
   */
  private parseAmount(amountStr: string): number {
    // Remove currency symbols and spaces
    const cleaned = amountStr.replace(/[^\d.,-]/g, '');

    // Argentine format: dots for thousands, comma for decimals
    // Example: 1.500,00 or 15.000,50
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    let normalized = cleaned;

    if (lastComma > lastDot) {
      // Comma is decimal separator (Argentine format)
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > -1) {
      // Dot is decimal separator
      normalized = cleaned.replace(/,/g, '');
    }

    const amount = parseFloat(normalized);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount format: ${amountStr}`);
    }

    return Math.abs(amount);
  }

  /**
   * Detect installments pattern from description
   * Looks for patterns like "3/12", "C.03/06", "CUOTA 5 DE 10", etc.
   */
  private detectInstallments(description: string): string | null {
    const patterns = [
      /C\.(\d+)\/(\d+)/i,                      // C.03/06 (Cuota 3 de 6 - Santander format)
      /(\d+)\/(\d+)/,                          // 3/12
      /cuota\s+(\d+)\s+de\s+(\d+)/i,           // cuota 3 de 12
      /installment\s+(\d+)\s+of\s+(\d+)/i,     // installment 3 of 12
      /pago\s+(\d+)\s+de\s+(\d+)/i            // pago 3 de 12
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match) {
        const [, current, total] = match;
        return `${current}/${total}`;
      }
    }

    return null;
  }

  /**
   * Generate warnings for the parsed data
   */
  private generateWarnings(transactions: ParsedPdfTransaction[]): string[] {
    const warnings: string[] = [];

    if (transactions.length === 0) {
      warnings.push('No transactions found in PDF');
    }

    // Check for transactions with very small amounts (might be errors)
    const verySmallAmounts = transactions.filter(t => t.amount < 0.01).length;
    if (verySmallAmounts > 0) {
      warnings.push(`${verySmallAmounts} transactions with very small amounts - please review`);
    }

    // Check for future dates
    const today = new Date();
    const futureDates = transactions.filter(t => t.date > today).length;
    if (futureDates > 0) {
      warnings.push(`${futureDates} transactions with future dates - please review`);
    }

    return warnings;
  }

  /**
   * Extract statement period from PDF text and transactions
   * Tries to find period in text, otherwise uses transaction dates
   */
  private extractStatementPeriod(
    text: string,
    transactions: ParsedPdfTransaction[]
  ): { month: number; year: number } | undefined {
    // Month mapping for Spanish month names
    const monthMap: Record<string, number> = {
      'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
      'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
      'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };

    // Try to find period patterns in text
    // Pattern 1: "RESUMEN DEL 01/10 AL 31/10" or "DEL 01/10/24 AL 31/10/24"
    const periodPattern1 = /(?:resumen\s+)?del\s+\d{1,2}\/(\d{1,2})(?:\/\d{2,4})?\s+al\s+\d{1,2}\/(\d{1,2})(?:\/(\d{2,4}))?/i;
    const match1 = text.match(periodPattern1);
    if (match1) {
      const [, startMonth, endMonth, yearStr] = match1;
      const month = parseInt(endMonth); // Use end month as statement month
      const year = yearStr ? this.parseYear(yearStr) : new Date().getFullYear();
      return { month, year };
    }

    // Pattern 2: "PERIODO: OCTUBRE 2024" or "OCTUBRE 2024"
    const periodPattern2 = /(?:periodo|período|resumen)?\s*:?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/i;
    const match2 = text.match(periodPattern2);
    if (match2) {
      const [, monthName, yearStr] = match2;
      const month = monthMap[monthName.toLowerCase()];
      const year = parseInt(yearStr);
      return { month, year };
    }

    // Pattern 3: Extract from transactions if available
    if (transactions.length > 0) {
      // Find the most common month/year combination
      const monthYearCounts = new Map<string, number>();
      for (const txn of transactions) {
        const key = `${txn.date.getMonth() + 1}-${txn.date.getFullYear()}`;
        monthYearCounts.set(key, (monthYearCounts.get(key) || 0) + 1);
      }

      // Get the most frequent month/year
      let maxCount = 0;
      let mostCommon: { month: number; year: number } | undefined;
      for (const [key, count] of monthYearCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          const [month, year] = key.split('-').map(Number);
          mostCommon = { month, year };
        }
      }

      return mostCommon;
    }

    return undefined;
  }

  /**
   * Parse a year from 2 or 4 digit string
   */
  private parseYear(yearStr: string): number {
    const year = parseInt(yearStr);
    if (year < 100) {
      // 2-digit year: 00-49 -> 2000-2049, 50-99 -> 1950-1999
      return year < 50 ? 2000 + year : 1900 + year;
    }
    return year;
  }

  /**
   * Get preview of parsed transactions (limit to first N records)
   */
  getPreview(result: PdfParseResult, limit: number = 50): PdfParseResult {
    return {
      ...result,
      transactions: result.transactions.slice(0, limit),
      warnings: result.warnings.concat(
        result.totalRecords > limit
          ? [`Showing ${limit} of ${result.totalRecords} transactions in preview`]
          : []
      )
    };
  }
}
