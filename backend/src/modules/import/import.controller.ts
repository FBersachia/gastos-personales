import { Request, Response } from 'express';
import { ImportService } from './import.service';
import { CsvFilters } from './csv-parser.service';

export class ImportController {
  private importService: ImportService;

  constructor() {
    this.importService = new ImportService();
  }

  /**
   * POST /import/pdf
   * Upload and preview PDF file
   */
  previewPdf = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const userId = req.user?.id;
      const result = await this.importService.previewPdf(req.file.buffer, userId);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('PDF preview error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to preview PDF'
      });
    }
  };

  /**
   * POST /import/pdf/confirm
   * Confirm and execute PDF import
   */
  confirmPdfImport = async (req: Request, res: Response) => {
    console.log('[PDF IMPORT CONFIRM] Request received at:', new Date().toISOString());
    console.log('[PDF IMPORT CONFIRM] User ID:', req.user?.id);
    console.log('[PDF IMPORT CONFIRM] Body present:', !!req.body);
    console.log('[PDF IMPORT CONFIRM] Transactions count:', req.body?.transactions?.length || 0);

    try {
      const userId = req.user?.id;

      if (!userId) {
        console.error('[PDF IMPORT CONFIRM] No user ID found');
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      console.log('[PDF IMPORT CONFIRM] Starting import process...');
      const result = await this.importService.confirmPdfImport(req.body, userId);
      console.log('[PDF IMPORT CONFIRM] Import completed:', result);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[PDF IMPORT CONFIRM] Error:', error.message);
      console.error('[PDF IMPORT CONFIRM] Stack:', error.stack);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to import PDF'
      });
    }
  };

  /**
   * POST /import/csv
   * Upload and preview CSV file
   */
  previewCsv = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Parse filters from request body if provided
      let filters: CsvFilters | undefined;
      if (req.body.filters) {
        try {
          filters = typeof req.body.filters === 'string'
            ? JSON.parse(req.body.filters)
            : req.body.filters;
        } catch (error) {
          return res.status(400).json({
            success: false,
            error: 'Invalid filters format'
          });
        }
      }

      const userId = req.user?.id;
      const result = await this.importService.previewCsv(
        req.file.buffer,
        filters,
        userId
      );

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('CSV preview error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to preview CSV'
      });
    }
  };

  /**
   * POST /import/csv/confirm
   * Confirm and execute CSV import
   */
  confirmCsvImport = async (req: Request, res: Response) => {
    console.log('[IMPORT CONFIRM] Request received at:', new Date().toISOString());
    console.log('[IMPORT CONFIRM] User ID:', req.user?.id);
    console.log('[IMPORT CONFIRM] Body present:', !!req.body);
    console.log('[IMPORT CONFIRM] Transactions count:', req.body?.transactions?.length || 0);

    try {
      const userId = req.user?.id;

      if (!userId) {
        console.error('[IMPORT CONFIRM] No user ID found');
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      console.log('[IMPORT CONFIRM] Starting import process...');
      const result = await this.importService.confirmImport(req.body, userId);
      console.log('[IMPORT CONFIRM] Import completed:', result);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[IMPORT CONFIRM] Error:', error.message);
      console.error('[IMPORT CONFIRM] Stack:', error.stack);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to import CSV'
      });
    }
  };
}
