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
  detectedPaymentMethod: string | null;
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

              return {
                date: this.parseDate(validatedRow.Fecha),
                type: validatedRow['Ingresos/Gastos'].toLowerCase().includes('ingreso')
                  ? 'INCOME' as const
                  : 'EXPENSE' as const,
                category: validatedRow['Categoría'].trim(),
                description: validatedRow['Memorándum'].trim(),
                amount: Math.abs(this.parseAmount(validatedRow.Importe)),
                detectedPaymentMethod: this.detectPaymentMethod(
                  validatedRow['Memorándum']
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
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
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
    // If there's a comma after a dot, or comma is the last separator, it's decimal
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    let normalized = cleaned;
    if (lastComma > lastDot) {
      // Comma is decimal separator
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal separator
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
  detectPaymentMethod(description: string): string | null {
    const desc = description.toLowerCase();

    // Payment method patterns (customize based on your needs)
    const patterns: Record<string, RegExp[]> = {
      'Visa': [/visa/i, /tarjeta visa/i],
      'Mastercard': [/mastercard/i, /master/i],
      'American Express': [/amex/i, /american express/i],
      'Efectivo': [/efectivo/i, /cash/i],
      'Transferencia': [/transferencia/i, /transfer/i],
      'Débito': [/debito/i, /debit/i],
      'Santander': [/santander/i],
      'Galicia': [/galicia/i],
      'BBVA': [/bbva/i],
      'Mercado Pago': [/mercado\s*pago/i, /mp/i],
      'Brubank': [/brubank/i],
      'Ualá': [/uala/i, /ualá/i]
    };

    for (const [paymentMethod, regexps] of Object.entries(patterns)) {
      for (const regex of regexps) {
        if (regex.test(desc)) {
          return paymentMethod;
        }
      }
    }

    return null;
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
      filtered = filtered.filter(row =>
        row.detectedPaymentMethod &&
        filters.paymentMethods!.includes(row.detectedPaymentMethod)
      );
    }

    return filtered;
  }

  /**
   * Generate warnings for the parsed data
   */
  generateWarnings(rows: ParsedCsvRow[]): string[] {
    const warnings: string[] = [];

    const withoutPaymentMethod = rows.filter(r => !r.detectedPaymentMethod).length;
    if (withoutPaymentMethod > 0) {
      warnings.push(`${withoutPaymentMethod} records without detected payment method`);
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
