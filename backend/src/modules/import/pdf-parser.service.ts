export type BankType = 'SANTANDER' | 'GALICIA' | 'AMEX' | 'UNKNOWN';

export interface ParsedPdfTransaction {
  date: Date;
  description: string;
  amount: number;
  currency: 'ARS' | 'USD';
  installments: string | null;
  originalLine: number;
}

export interface PdfParseResult {
  bank: BankType;
  detectedPaymentMethod: string; // e.g., "Visa Galicia", "Amex Santander"
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
      console.log('[PDF PARSER] Starting PDF parse, buffer size:', fileBuffer.length);
      // Import pdf-parse (CommonJS module) - tsx supports require
      const pdfParse = require('pdf-parse');

      // Extract text from PDF
      const pdfData = await pdfParse(fileBuffer);
      const text = pdfData.text;
      console.log('[PDF PARSER] Extracted text, length:', text.length);

      // Detect bank type
      const bank = this.detectBank(text);
      console.log('[PDF PARSER] Detected bank:', bank);

      // Detect payment method (e.g., "Visa Galicia", "Amex Santander")
      const detectedPaymentMethod = this.detectPaymentMethod(text, bank);

      if (bank === 'UNKNOWN') {
        return {
          bank,
          detectedPaymentMethod: 'Unknown',
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
        detectedPaymentMethod,
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
   * Detect payment method from PDF text (e.g., "Visa Galicia", "Amex Santander")
   * Detects both bank and card type
   */
  private detectPaymentMethod(text: string, bank: BankType): string {
    const lowerText = text.toLowerCase();

    // Detect card type
    let cardType = '';

    // Check for Visa
    if (
      lowerText.includes('visa') ||
      lowerText.includes('tarjeta visa') ||
      lowerText.includes('resumen visa')
    ) {
      cardType = 'Visa';
    }
    // Check for American Express / Amex
    else if (
      lowerText.includes('american express') ||
      lowerText.includes('amex') ||
      lowerText.includes('tarjeta american express')
    ) {
      cardType = 'Amex';
    }

    // Combine card type + bank
    if (bank === 'SANTANDER' && cardType === 'Visa') {
      return 'Visa Santander';
    } else if (bank === 'SANTANDER' && cardType === 'Amex') {
      return 'Amex Santander';
    } else if (bank === 'GALICIA' && cardType === 'Visa') {
      return 'Visa Galicia';
    } else if (bank === 'GALICIA' && cardType === 'Amex') {
      return 'Amex Galicia';
    } else if (bank === 'AMEX') {
      // Generic Amex when bank isn't specified
      return 'Amex';
    }

    // Default fallback
    return 'Unknown';
  }

  /**
   * Detect currency from description
   * Looks for USD indicators in the description
   */
  private detectCurrency(description: string): 'ARS' | 'USD' {
    const lowerDesc = description.toLowerCase();

    // USD indicators
    const usdIndicators = [
      'usd',
      'us$',
      'dolar',
      'dollar',
      '_usd',
      'nt_rrt', // Common in Galicia for USD transactions
      'nt_usd',
    ];

    for (const indicator of usdIndicators) {
      if (lowerDesc.includes(indicator)) {
        return 'USD';
      }
    }

    return 'ARS';
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

    // Pattern 1: Full format with optional month header
    // "25 Agosto  17 005903 *  SUR GAS                                                   63.000,00"
    // "           17 146455 *  MERPAGO*TIN                                               18.000,00"
    const fullPattern = /^\s*(?:\d{2,4}\s+\w+\s+)?(\d{1,2})\s+\d+\s+[*K]\s+(.+?)\s+([\d.,]+)\s*$/;

    // Pattern 2: Continuation lines (no date, just comprobante)
    // " 750064 * PAX ASSISTANCE 99999 C.01/12 18.939,43"
    // " 110079 * PROVINCIA SEGUROS S 0410600157 111.158,11"
    // " 928445 TACO BELL- AIPC TERM B USD 10,00"
    const continuationPattern = /^\s+(\d{6})\s+[*K]?\s*(.+?)\s+([\d.,]+)\s*$/;

    // Pattern 3: Lines without asterisk (some Amex formats)
    const noAsteriskPattern = /^\s+(\d{6})\s+(.+?)\s+(?:USD\s+)?([\d.,]+)\s*$/;

    // Pattern 4: Foreign currency with USD column (Visa Santander format)
    // "              860453    ROGERS PEARSON T3         CAD       28,25                                        20,68          "
    // "25 Abril   25 370216    TICKETMASTER CANADA HOST  CAD      158,65                                       116,16          "
    // Format: [optional: day month_name] [optional: day] comprobante description currency foreign_amount (40+ spaces) usd_amount
    // The USD amount is in the far right column, separated by many spaces
    const foreignCurrencyPattern = /^\s*(?:(\d{1,2})\s+\w+\s+)?(\d{1,2})?\s*(\d{6})\s+(.+?)\s+(CAD|USD|EUR|GBP|CHF|JPY|AUD|NZD|BRL|CLP|MXN|COP|PEN|UYU)\s+([\d.,]+)\s{20,}([\d.,]+)\s*$/;

    let lastDay = 1; // Keep track of last parsed day for continuation lines

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      let txnMatch; // Declare variable for pattern matching

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

      // Try Pattern 4 FIRST: Foreign currency with USD column
      // This pattern is more specific so we check it before the generic patterns
      txnMatch = line.match(foreignCurrencyPattern);
      if (txnMatch) {
        try {
          // Groups: [full, headerDay?, day?, comprobante, description, currency, foreignAmount, usdAmount]
          const headerDay = txnMatch[1]; // Day from header like "25 Abril"
          const dayStr = txnMatch[2]; // Day number
          const comprobante = txnMatch[3];
          const description = txnMatch[4];
          const foreignCurrency = txnMatch[5];
          const foreignAmount = txnMatch[6];
          const usdAmountStr = txnMatch[7];

          // Use day from header if present, otherwise day from line, otherwise last day
          const day = headerDay ? parseInt(headerDay) : (dayStr ? parseInt(dayStr) : lastDay);
          if (dayStr) lastDay = parseInt(dayStr);
          if (headerDay) lastDay = parseInt(headerDay);

          const date = new Date(currentYear, currentMonth - 1, day);
          const amount = this.parseAmount(usdAmountStr); // Use the USD amount from the last column
          const cleanDescription = description.trim();
          const installments = this.detectInstallments(cleanDescription);

          transactions.push({
            date,
            description: cleanDescription,
            amount,
            currency: 'USD', // Foreign currency transactions are in USD
            installments,
            originalLine: i + 1
          });
        } catch (error) {
          console.warn(`[SANTANDER PARSER] Skipping invalid foreign currency line ${i + 1}: ${error}`);
        }
        continue;
      }

      // Try Pattern 1: Full format with day
      txnMatch = line.match(fullPattern);
      if (txnMatch) {
        try {
          const [, dayStr, description, amountStr] = txnMatch;

          const day = parseInt(dayStr);
          lastDay = day; // Remember this day for continuation lines
          const date = new Date(currentYear, currentMonth - 1, day);
          const amount = this.parseAmount(amountStr);
          const cleanDescription = description.trim();
          const installments = this.detectInstallments(cleanDescription);
          const currency = this.detectCurrency(cleanDescription);

          transactions.push({
            date,
            description: cleanDescription,
            amount,
            currency,
            installments,
            originalLine: i + 1
          });
        } catch (error) {
          console.warn(`[SANTANDER PARSER] Skipping invalid line ${i + 1}: ${error}`);
        }
        continue;
      }

      // Try Pattern 2: Continuation pattern (with asterisk)
      txnMatch = line.match(continuationPattern);
      if (txnMatch) {
        try {
          const [, , description, amountStr] = txnMatch;

          // Use the last parsed day (same day as the header transaction)
          const date = new Date(currentYear, currentMonth - 1, lastDay);
          const amount = this.parseAmount(amountStr);
          const cleanDescription = description.trim();
          const installments = this.detectInstallments(cleanDescription);
          const currency = this.detectCurrency(cleanDescription);

          transactions.push({
            date,
            description: cleanDescription,
            amount,
            currency,
            installments,
            originalLine: i + 1
          });
        } catch (error) {
          console.warn(`[SANTANDER PARSER] Skipping invalid line ${i + 1}: ${error}`);
        }
        continue;
      }

      // Try Pattern 3: No asterisk pattern (USD transactions)
      txnMatch = line.match(noAsteriskPattern);
      if (txnMatch) {
        try {
          const [, , description, amountStr] = txnMatch;

          // Use the last parsed day
          const date = new Date(currentYear, currentMonth - 1, lastDay);
          const amount = this.parseAmount(amountStr);
          const cleanDescription = description.trim();
          const installments = this.detectInstallments(cleanDescription);
          const currency = this.detectCurrency(cleanDescription);

          transactions.push({
            date,
            description: cleanDescription,
            amount,
            currency,
            installments,
            originalLine: i + 1
          });
        } catch (error) {
          console.warn(`[SANTANDER PARSER] Skipping invalid line ${i + 1}: ${error}`);
        }
        continue;
      }
    }

    return transactions;
  }

  /**
   * Parse Galicia PDF statement
   * Real format from Banco Galicia (works for both Visa and Amex):
   *
   * Visa Galicia Multi-line format:
   *   "24-08-24*SER BAZARES BERAZATEGUI 12/12"
   *   "003495"
   *   "1.249,16"
   *
   * Visa Galicia Single-line format:
   *   "01-07-25 GOOGLE *GSUITE_i P1covLLC USD 11,52 58768111,52"
   *
   * Amex Galicia format (table format):
   *   "16-09-24 * DEVENTAS SA 07/18 582305 28.096,82"
   *   "28-02-25 E DIGITALOCEAN.COM NT_RRTUSD 29,18 911301 29,18"
   *   "02-03-25 * MERPAGO*THEBEST 811300 1.900,00"
   */
  private parseGalicia(text: string): ParsedPdfTransaction[] {
    console.log('[PARSE GALICIA] Starting Galicia parse, text length:', text.length);
    const transactions: ParsedPdfTransaction[] = [];
    const lines = text.split('\n');
    console.log('[PARSE GALICIA] Total lines:', lines.length);

    // Check if this is Amex Galicia format
    // Need to be more specific: both Visa and Amex Galicia PDFs contain "DETALLE DEL CONSUMO"
    // Amex has additional markers like "AMERICAN EXPRESS" or "CUIT TARJETA: 30-64140793-9"
    const hasAmexMarkers = text.includes('AMERICAN EXPRESS') || text.includes('30-64140793-9');
    const isAmexGalicia = text.includes('DETALLE DEL CONSUMO') && hasAmexMarkers;
    console.log('[PARSE GALICIA] Is Amex format?', isAmexGalicia, '(hasAmexMarkers:', hasAmexMarkers, ')');

    if (isAmexGalicia) {
      return this.parseAmexGalicia(text, lines);
    }

    // Parse Visa Galicia format (existing logic)
    // Single-line pattern with spaces: "DD-MM-YY [*|K|Q] DESCRIPTION REFERENCE AMOUNT"
    // Example: "18-03-25 * MERPAGO*NIKEARGENTINA 01/06 061987 24.833,00"
    const singleLinePatternSpaced = /^(\d{2}-\d{2}-\d{2})\s*[*KQ]?\s*(.+?)\s+(\d+)\s+([\d.,]+)\s*$/;

    // Single-line pattern concatenated: "DD-MM-YY[*|K|Q]DESCRIPTION COMPROBANTE(6 digits)AMOUNT"
    // Example: "18-03-25*MERPAGO*NIKEARGENTINA 01/0606198724.833,00"
    // where "01/06" is installments, "061987" is comprobante, "24.833,00" is amount
    // Amount format: 1-3 digits, then optional .NNN groups, then ,NN
    // Strategy: Match amount from the end, then grab exactly 6 digits before it as comprobante
    const singleLinePatternConcatenated = /^(\d{2}-\d{2}-\d{2})\s*[*KQ]?\s*(.+)(\d{6})(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/;

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

      // Debug: Log lines containing NIKEARGENTINA
      if (line.includes('NIKEARGENTINA')) {
        console.log(`\n[PARSER DEBUG] Found NIKEARGENTINA at line ${i+1}:`);
        console.log(`  Raw line: "${line}"`);
        console.log(`  Length: ${line.length}`);
      }

      // Try concatenated format with special handling for installments
      // Format: "18-03-25*MERPAGO*NIKEARGENTINA 01/0606198724.833,00"
      // Problem: The string contains DESCRIPTION + INSTALLMENTS + COMPROBANTE + AMOUNT all concatenated
      // where installments is \d+/\d+ but the second \d+ might merge with comprobante digits
      //
      // Strategy: Look for a pattern where we have:
      // 1. Date + marker
      // 2. Description ending with possible installment pattern like "text \d+/\d+"
      // 3. Then exactly 6 digits (comprobante)
      // 4. Then valid amount
      //
      // Key insight: After finding a valid amount at the end and 6-digit comprobante before it,
      // check if the description ends with a partial installment pattern and try to complete it
      // New approach: Parse from the start to find description end point
      // Format: DD-MM-YY[*|K|Q]DESCRIPTION[PARTIAL_INST]DIGITS_AMOUNT
      const dateMarkerMatch = line.match(/^(\d{2}-\d{2}-\d{2})\s*([*KQ]?)\s*/);
      if (dateMarkerMatch) {
        try {
          const dateStr = dateMarkerMatch[1];
          const afterDateMarker = line.substring(dateMarkerMatch[0].length);

          // Now we have: "DESCRIPTION[PARTIAL_INST]DIGITS_AMOUNT"
          // We need to find where DESCRIPTION ends and DIGITS_AMOUNT begins
          // Strategy: DIGITS_AMOUNT is always: 6-8 digits + valid amount
          // Match them together to avoid greedy amount matching

          // Match 6-8 digits followed by amount as a single unit
          // Strategy: Check if potential description ends with partial installment
          // If yes, use 7-8 digits; otherwise use 6 digits

          // First, try to find any valid digit+amount combination
          const tentativeMatch6 = afterDateMarker.match(/(\d{6})(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/);
          const tentativeMatch78 = afterDateMarker.match(/(\d{7,8})(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/);

          let digitsAmountMatch = null;

          // If we have a 7-8 digit match, check if the description has partial installments
          if (tentativeMatch78) {
            const desc78 = afterDateMarker.substring(0, afterDateMarker.lastIndexOf(tentativeMatch78[0])).trim();
            console.log(`[DEBUG] Line ${i+1}: Checking 7-8 digit match`);
            console.log(`[DEBUG]   afterDateMarker: "${afterDateMarker}"`);
            console.log(`[DEBUG]   tentativeMatch78: digits="${tentativeMatch78[1]}", amount="${tentativeMatch78[2]}"`);
            console.log(`[DEBUG]   desc78: "${desc78}"`);
            console.log(`[DEBUG]   Has partial installment: ${/\d+\/\d*$/.test(desc78)}`);
            if (/\d+\/\d*$/.test(desc78)) {
              // Description ends with installment pattern - use 7-8 digit match
              digitsAmountMatch = tentativeMatch78;
              console.log(`[DEBUG]   Using 7-8 digit match`);
            }
          }

          // Fall back to 6-digit match if we didn't use 7-8
          if (!digitsAmountMatch && tentativeMatch6) {
            console.log(`[DEBUG] Line ${i+1}: Using 6 digit match`);
            console.log(`[DEBUG]   tentativeMatch6: digits="${tentativeMatch6[1]}", amount="${tentativeMatch6[2]}"`);
            digitsAmountMatch = tentativeMatch6;
          }

          if (digitsAmountMatch) {
            const candidateDigits = digitsAmountMatch[1];
            const amountStr = digitsAmountMatch[2];
            const description = afterDateMarker.substring(0, afterDateMarker.lastIndexOf(digitsAmountMatch[0])).trim();
            console.log(`[DEBUG] Line ${i+1}: Final match - digits="${candidateDigits}", amount="${amountStr}", desc="${description}"`);

            // Now parse the components
            const date = this.parseDateDDMMYY(dateStr);
            const amount = this.parseAmount(amountStr);

            let cleanDescription = description;
            let installments = null;
            let comprobante = candidateDigits;

            // Handle installments with borrowing logic
            const partialInstallmentMatch = cleanDescription.match(/(\d+)\/(\d*)$/);

            if (partialInstallmentMatch) {
              const [fullMatch, first, second] = partialInstallmentMatch;

              if (second.length < 2) {
                // Incomplete installment - borrow from candidate digits
                const needed = 2 - second.length;
                const borrowed = candidateDigits.substring(0, needed);
                const completedInstallment = `${first}/${second}${borrowed}`;

                if (/^\d{1,2}\/\d{1,2}$/.test(completedInstallment)) {
                  installments = completedInstallment;
                  cleanDescription = cleanDescription.substring(0, cleanDescription.length - fullMatch.length).trim();
                  // Comprobante is the 6 digits after borrowing
                  comprobante = candidateDigits.substring(needed, needed + 6);
                }
              } else {
                // Complete installment in description
                installments = fullMatch;
                cleanDescription = cleanDescription.substring(0, cleanDescription.length - fullMatch.length).trim();
                // The last 2 digits of installment are merged with comprobante
                const instLastDigits = fullMatch.match(/(\d{2})$/)[1];
                if (candidateDigits.startsWith(instLastDigits)) {
                  comprobante = candidateDigits.substring(2, 8);
                } else {
                  comprobante = candidateDigits.substring(0, 6);
                }
              }
            } else {
              // No installments - take last 6 digits as comprobante
              comprobante = candidateDigits.substring(candidateDigits.length - 6);
            }

            const currency = this.detectCurrency(cleanDescription);

            transactions.push({
              date,
              description: cleanDescription,
              amount,
              currency,
              installments,
              originalLine: i + 1
            });

            i++;
            continue;
          }
        } catch (error) {
          console.warn(`Skipping invalid concatenated line ${i + 1}: ${line}`);
        }
      }

      // Try single-line format with spaces
      const spacedMatch = line.match(singleLinePatternSpaced);
      if (spacedMatch) {
        try {
          const [, dateStr, description, reference, amountStr] = spacedMatch;
          const date = this.parseDateDDMMYY(dateStr);
          const amount = this.parseAmount(amountStr);
          const installments = this.detectInstallments(description);
          const currency = this.detectCurrency(description);

          console.log(`[SPACED FORMAT] Line ${i+1}: date="${dateStr}", desc="${description}", ref="${reference}", amt="${amountStr}", parsed=${amount}`);

          transactions.push({
            date,
            description: description.trim(),
            amount,
            currency,
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
            const currency = this.detectCurrency(description);

            transactions.push({
              date,
              description: description.trim(),
              amount,
              currency,
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
   * Parse Amex Galicia PDF statement
   * After pdf-parse, the format can be:
   * 1. Multi-line (3 lines):
   *    "16-09-24*DEVENTAS SA 07/18"
   *    "582305"
   *    "28.096,82"
   * 2. Single-line concatenated:
   *    "02-03-25*MERPAGO*THEBEST 8113001.900,00"
   * 3. Single-line with spaces (USD transactions):
   *    "28-02-25EDIGITALOCEAN.COM    NT_RRTUSD       29,18 91130129,18"
   *
   * Important: For installment transactions, the date shown is the original purchase date.
   * We calculate the actual payment date based on the installment number:
   * Example: Original purchase "22-12-24" with installment "04/06"
   *   - 1/6 = December 2024 (original purchase date)
   *   - 2/6 = January 2025 (original + 1 month)
   *   - 3/6 = February 2025 (original + 2 months)
   *   - 4/6 = March 2025 (original + 3 months) ✅
   */
  private parseAmexGalicia(_text: string, lines: string[]): ParsedPdfTransaction[] {
    const transactions: ParsedPdfTransaction[] = [];

    let inTransactionSection = false;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Start parsing after "DETALLE DEL CONSUMO" header
      if (line.includes('DETALLE DEL CONSUMO')) {
        inTransactionSection = true;
        i++;
        continue;
      }

      // Stop parsing at the total line or next page header
      if (line.includes('Total Consumos de') || line.includes('TARJETA') && line.includes('Total Consumos')) {
        break;
      }

      // Skip header row and empty lines
      if (!inTransactionSection || !line || line.startsWith('FECHA')) {
        i++;
        continue;
      }

      // Pattern 1: Multi-line format (date + asterisk + description, possibly with cuota)
      const multiLinePattern = /^(\d{2}-\d{2}-\d{2})\s*([*EKQ])(.+)$/;
      const multiMatch = line.match(multiLinePattern);

      if (multiMatch && i + 2 < lines.length) {
        const nextLine1 = lines[i + 1].trim();
        const nextLine2 = lines[i + 2].trim();

        // Check if next two lines are comprobante (6 digits) and amount
        if (nextLine1.match(/^\d{6}$/) && nextLine2.match(/^[\d.,]+$/)) {
          try {
            const [, dateStr, , descriptionPart] = multiMatch;
            const amountStr = nextLine2;

            let description = descriptionPart.trim();
            const installments = this.detectInstallments(description);

            // Parse the original purchase date
            const originalDate = this.parseDateDDMMYY(dateStr);

            // For installment transactions, calculate the actual payment date
            // by adding (installment_number - 1) months to the original purchase date
            let date: Date;
            if (installments) {
              const [current] = installments.split('/').map(Number);
              // Calculate months to add: installment 1/6 = 0 months, 2/6 = 1 month, etc.
              const monthsToAdd = current - 1;
              date = new Date(originalDate);
              date.setMonth(date.getMonth() + monthsToAdd);
            } else {
              date = originalDate;
            }

            // Remove installment notation from description
            if (installments) {
              description = description.replace(/\s*\d+\/\d+\s*$/, '').trim();
            }

            const amount = this.parseAmount(amountStr);
            const currency = this.detectCurrency(description);

            transactions.push({
              date,
              description,
              amount,
              currency,
              installments,
              originalLine: i + 1
            });

            i += 3; // Skip the 3 lines we just processed
            continue;
          } catch (error) {
            console.warn(`Skipping invalid multi-line starting at ${i + 1}: ${line}`);
          }
        }
      }

      // Pattern 2 & 3: Single-line formats
      // Comprobante (6 digits) + Amount at the end: "2353054.200,00" or "1960716.119,18"
      // Amount uses Argentine format: dots for thousands, comma for decimals: "4.200,00" or "867,22"
      // Format: DD-MM-YY[*|E|K|Q]DESCRIPTION [LONG_REF] COMPROBANTE(6)AMOUNT [USD]
      //
      // For foreign currency transactions (USD, CAD, EUR), the format is:
      // "01-05-25 PRESTO FARE/5GP143MR5V    CAD        3,30 1233242,40"
      //   where 3,30 is the foreign currency amount, and the last part is comprobante+USD: "123324" + "2,40"
      //
      // IMPORTANT: Sometimes the comprobante and amount are concatenated without space
      // Example: "06-09-25*FRAVEGA 01/06630489133.333,35" where "630489" is comprobante and "133.333,35" is amount
      //
      // Amount pattern: 1-3 digits, then optionally (.NNN groups), then ,NN
      // Argentine format: 4.200,00 or 15.000,50 or 133.333,35 or 867,22
      // The comprobante is exactly 6 digits immediately before the amount
      const singleLinePattern = /^(\d{2}-\d{2}-\d{2})\s*([*EKQ]?)(.+?)(\d{6})(\d{1,3}(?:\.\d{3})*,\d{2})(?:\s+(\d{1,3}(?:\.\d{3})*,\d{2}))?\s*$/;
      const singleMatch = line.match(singleLinePattern);

      if (singleMatch) {
        try {
          const [, dateStr, marker, descriptionPart, , amountPesos, amountUsd] = singleMatch;

          let description = descriptionPart.trim();
          const installments = this.detectInstallments(description);

          // Parse the original purchase date
          const originalDate = this.parseDateDDMMYY(dateStr);

          // For installment transactions, calculate the actual payment date
          // by adding (installment_number - 1) months to the original purchase date
          let date: Date;
          if (installments) {
            const [current] = installments.split('/').map(Number);
            // Calculate months to add: installment 1/6 = 0 months, 2/6 = 1 month, etc.
            const monthsToAdd = current - 1;
            date = new Date(originalDate);
            date.setMonth(date.getMonth() + monthsToAdd);
          } else {
            date = originalDate;
          }

          // Remove installment notation from description
          if (installments) {
            description = description.replace(/\s*\d+\/\d+\s*$/, '').trim();
          }

          // Determine if this is a foreign currency transaction (USD, CAD, EUR, etc.)
          // Foreign currency transactions have the currency code in the description
          // and the amount field contains the USD equivalent (not pesos)
          // Example: "PRESTO FARE/5GP143MR5V CAD 3,30 1233242,40"
          //   - Description includes "CAD 3,30" (original foreign currency amount)
          //   - Amount is "2,40" (USD equivalent in the Dolares column)
          const foreignCurrencyPattern = /\b(USD|CAD|EUR|GBP|CHF|JPY|AUD|NZD|BRL|CLP|MXN|COP|PEN|UYU)\b/i;
          const foreignCurrencyMatch = description.match(foreignCurrencyPattern);

          let amount: number;
          let currency: 'ARS' | 'USD';

          if (foreignCurrencyMatch || marker === 'E') {
            // This is a foreign currency transaction
            // The amount is already in USD (from the "Dolares" column)
            amount = this.parseAmount(amountPesos); // Despite the var name, this is USD for foreign transactions
            currency = 'USD';
          } else if (amountUsd) {
            // If there's a separate USD column value, use it
            amount = this.parseAmount(amountUsd);
            currency = 'USD';
          } else {
            // Regular ARS transaction
            amount = this.parseAmount(amountPesos);
            currency = this.detectCurrency(description);
          }

          transactions.push({
            date,
            description,
            amount,
            currency,
            installments,
            originalLine: i + 1
          });

          i++;
          continue;
        } catch (error) {
          console.warn(`Skipping invalid single-line ${i + 1}: ${line}`);
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
          const currency = this.detectCurrency(description);

          transactions.push({
            date,
            description: description.trim(),
            amount,
            currency,
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
          const currency = this.detectCurrency(description);

          transactions.push({
            date,
            description: description.trim(),
            amount,
            currency,
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
    const fullYear = 2000 + parseInt(year); // Assume 20xx

    // Create date using constructor (year, month, day) to avoid timezone issues
    // Note: month is 0-indexed in JS Date constructor
    const date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
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
      const [, , endMonth, yearStr] = match1;
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
