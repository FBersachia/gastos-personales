import Papa from 'papaparse';
import { z } from 'zod';

// CSV row schema based on the expected format
const csvRowSchema = z.object({
  Fecha: z.string(),
  'Ingresos/Gastos': z.string(),
  'Categoría': z.string(),
  'Memorándum': z.string(),
  Importe: z.string()
});

export interface ParsedCsvRow {
  date: Date;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  detectedPaymentMethod: string;
  installments: string | null;
  originalRow: number;
}

export interface CsvFilters {
  dateFrom?: string;
  dateTo?: string;
  paymentMethods?: string[];
}

export interface CsvParseResult {
  rows: ParsedCsvRow[];
  totalRecords: number;
  filteredRecords: number;
  warnings: string[];
}

export class CsvParserService {
  /**
   * Parse CSV file buffer
   */
  async parse(fileBuffer: Buffer): Promise<ParsedCsvRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(fileBuffer.toString('utf-8'), {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsed = results.data.map((row: any, index: number) => {
              // Validate row schema
              const validatedRow = csvRowSchema.parse(row);

              const csvType = validatedRow['Ingresos/Gastos'].toLowerCase().includes('ingreso')
                ? 'INCOME' as const
                : 'EXPENSE' as const;

              // Auto-detect income based on keywords in description
              const description = validatedRow['Memorándum'].trim();
              const type = this.detectTransactionType(description, csvType);

              return {
                date: this.parseDate(validatedRow.Fecha),
                type,
                category: validatedRow['Categoría'].trim(),
                description,
                amount: Math.abs(this.parseAmount(validatedRow.Importe)),
                detectedPaymentMethod: this.detectPaymentMethod(
                  validatedRow['Memorándum'],
                  type
                ),
                installments: this.detectInstallments(
                  validatedRow['Memorándum']
                ),
                originalRow: index + 2 // +2 because of header and 1-based indexing
              };
            });

            resolve(parsed);
          } catch (error: any) {
            reject(new Error(`Invalid CSV format: ${error.message}`));
          }
        },
        error: (error: any) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Detect transaction type based on description keywords
   * Auto-detects income if description contains salary-related keywords
   */
  private detectTransactionType(description: string, csvType: 'INCOME' | 'EXPENSE'): 'INCOME' | 'EXPENSE' {
    const desc = description.toLowerCase();

    // Income keywords - if found, override to INCOME
    const incomeKeywords = [
      /\bsueldo\b/i,           // salary
      /\bsalario\b/i,          // salary
      /\bingreso\b/i,          // income
      /\bpago\s+de\s+sueldo\b/i, // salary payment
      /\bhonorarios\b/i,       // fees
      /\bpaga\b/i,             // pay
      /\bremuneracion\b/i,     // remuneration
      /\bnomina\b/i            // payroll
    ];

    for (const keyword of incomeKeywords) {
      if (keyword.test(desc)) {
        return 'INCOME';
      }
    }

    // Otherwise use CSV type
    return csvType;
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date {
    // Try common date formats: DD/MM/YYYY, YYYY-MM-DD, etc.
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
      /^(\d{2})-(\d{2})-(\d{4})$/    // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0] || format === formats[2]) {
          // DD/MM/YYYY or DD-MM-YYYY
          const [, day, month, year] = match;
          return new Date(`${year}-${month}-${day}`);
        } else {
          // YYYY-MM-DD
          return new Date(dateStr);
        }
      }
    }

    // Fallback to Date constructor
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    return date;
  }

  /**
   * Parse amount from string (handle commas, dots, etc.)
   */
  private parseAmount(amountStr: string): number {
    // Remove currency symbols and spaces
    const cleaned = amountStr.replace(/[^\d.,-]/g, '');

    // Handle different decimal separators
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    let normalized = cleaned;

    // Count occurrences of dots and commas
    const dotCount = (cleaned.match(/\./g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;

    if (lastComma > lastDot) {
      // Comma is after dot, so comma is decimal separator
      // Example: 1.234,56 → 1234.56
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
      // Dot is after comma, so dot is decimal separator
      // BUT: check if dot is thousands separator (e.g., 7.000 should be 7000, not 7.0)

      // If there's only one dot and it's followed by exactly 3 digits and no more, it's a thousands separator
      const afterDot = cleaned.substring(lastDot + 1);
      const hasThreeDigitsAfterDot = /^-?\d*\.?\d{3}$/.test(cleaned.substring(cleaned.indexOf(cleaned.match(/\d/) as any)));

      if (dotCount === 1 && commaCount === 0 && afterDot.length === 3 && !/\./.test(afterDot)) {
        // This is a thousands separator: 7.000 → 7000
        normalized = cleaned.replace(/\./g, '');
      } else {
        // This is a decimal separator: 7.50 → 7.50
        normalized = cleaned.replace(/,/g, '');
      }
    } else if (dotCount > 1) {
      // Multiple dots = thousands separators (e.g., 1.234.567)
      normalized = cleaned.replace(/\./g, '');
    } else if (commaCount > 1) {
      // Multiple commas = thousands separators (e.g., 1,234,567)
      normalized = cleaned.replace(/,/g, '');
    }

    const amount = parseFloat(normalized);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount format: ${amountStr}`);
    }
    return amount;
  }

  /**
   * Detect payment method from description/memorandum
   * Looks for common patterns like card names, bank names, etc.
   */
  detectPaymentMethod(description: string, type: 'INCOME' | 'EXPENSE'): string {
    // Rule 1: If it's an income, always return "ingreso"
    if (type === 'INCOME') {
      return 'ingreso';
    }

    const desc = description.toLowerCase();

    // Specific combination patterns - check these first for exact matches
    const specificPatterns: Record<string, RegExp> = {
      'Visa Santander': /visa\s+s(?:\s|$)/i,
      'Visa Galicia': /visa\s+g(?:\s|$)/i,
      'Amex Galicia': /amex\s+g(?:\s|$)/i,
      'Amex Santander': /amex\s+s(?:\s|$)/i,
      'Mastercard Carrefour': /master\s+c(?:\s|$)/i
    };

    // Check specific patterns first
    for (const [paymentMethod, regex] of Object.entries(specificPatterns)) {
      if (regex.test(desc)) {
        return paymentMethod;
      }
    }

    // Check for card keywords BEFORE other patterns (to avoid "Efectivo Carla amex" matching "Efectivo")
    // Rule 2: If "visa" is found anywhere → default to "Visa Galicia"
    if (/visa/i.test(desc)) {
      return 'Visa Galicia';
    }

    // Rule 3: If "amex" is found anywhere → default to "Amex Galicia"
    if (/amex/i.test(desc) || /american express/i.test(desc)) {
      return 'Amex Galicia';
    }

    // Generic payment method patterns (check after card patterns)
    const patterns: Record<string, RegExp[]> = {
      'Mastercard': [/mastercard/i, /master/i],
      'Transferencia': [/transferencia/i, /transfer/i],
      'Débito': [/debito/i, /debit/i],
      'Santander': [/santander/i],
      'Galicia': [/galicia/i],
      'BBVA': [/bbva/i],
      'Mercado Pago': [/mercado\s*pago/i, /mp/i],
      'Brubank': [/brubank/i],
      'Ualá': [/uala/i, /ualá/i],
      'Efectivo': [/efectivo/i, /cash/i]
    };

    for (const [paymentMethod, regexps] of Object.entries(patterns)) {
      for (const regex of regexps) {
        if (regex.test(desc)) {
          return paymentMethod;
        }
      }
    }

    // Rule 4: Default to "Efectivo" if no patterns match
    return 'Efectivo';
  }

  /**
   * Detect installments pattern from description
   * Looks for patterns like "3/12", "cuota 5 de 10", etc.
   */
  detectInstallments(description: string): string | null {
    const patterns = [
      /(\d+)\/(\d+)/,                    // 3/12
      /cuota\s+(\d+)\s+de\s+(\d+)/i,     // cuota 3 de 12
      /installment\s+(\d+)\s+of\s+(\d+)/i // installment 3 of 12
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
   * Apply filters to parsed CSV rows
   */
  applyFilters(rows: ParsedCsvRow[], filters: CsvFilters): ParsedCsvRow[] {
    let filtered = rows;

    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      filtered = filtered.filter(row => row.date >= dateFrom);
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      filtered = filtered.filter(row => row.date <= dateTo);
    }

    if (filters.paymentMethods && filters.paymentMethods.length > 0) {
      // Convert filter values to lowercase for case-insensitive comparison
      const lowerCaseFilters = filters.paymentMethods.map(pm => pm.toLowerCase());
      filtered = filtered.filter(row =>
        row.detectedPaymentMethod &&
        lowerCaseFilters.includes(row.detectedPaymentMethod.toLowerCase())
      );
    }

    return filtered;
  }

  /**
   * Generate warnings for the parsed data
   */
  generateWarnings(rows: ParsedCsvRow[]): string[] {
    const warnings: string[] = [];

    // Count payment methods that defaulted to "Efectivo" (might need manual review)
    const defaultedToEfectivo = rows.filter(r => r.detectedPaymentMethod === 'Efectivo').length;
    if (defaultedToEfectivo > 0) {
      warnings.push(`${defaultedToEfectivo} records defaulted to 'Efectivo' - please review`);
    }

    const withoutCategory = rows.filter(r => !r.category || r.category === '').length;
    if (withoutCategory > 0) {
      warnings.push(`${withoutCategory} records without category`);
    }

    return warnings;
  }

  /**
   * Full parse with filters and warnings
   */
  async parseWithFilters(
    fileBuffer: Buffer,
    filters?: CsvFilters
  ): Promise<CsvParseResult> {
    const allRows = await this.parse(fileBuffer);
    const filteredRows = filters ? this.applyFilters(allRows, filters) : allRows;
    const warnings = this.generateWarnings(filteredRows);

    return {
      rows: filteredRows,
      totalRecords: allRows.length,
      filteredRecords: filteredRows.length,
      warnings
    };
  }
}
