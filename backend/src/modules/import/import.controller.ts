import { Request, Response } from 'express';
import { ImportService } from './import.service';
import { CsvFilters } from './csv-parser.service';

export class ImportController {
  private importService: ImportService;

  constructor() {
    this.importService = new ImportService();
  }

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
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const result = await this.importService.confirmImport(req.body, userId);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('CSV import error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Failed to import CSV'
      });
    }
  };
}
