import { Router } from 'express';
import multer from 'multer';
import { ImportController } from './import.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const importController = new ImportController();

// Configure multer for CSV files
const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Configure multer for PDF files
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size for PDFs
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// All import routes require authentication
router.use(authenticate);

/**
 * POST /import/pdf
 * Upload and preview PDF file
 */
router.post('/pdf', uploadPdf.single('file'), importController.previewPdf);

/**
 * POST /import/pdf/confirm
 * Confirm and execute PDF import
 */
router.post('/pdf/confirm', importController.confirmPdfImport);

/**
 * POST /import/csv
 * Upload and preview CSV file
 */
router.post('/csv', uploadCsv.single('file'), importController.previewCsv);

/**
 * POST /import/csv/confirm
 * Confirm and execute CSV import
 */
router.post('/csv/confirm', importController.confirmCsvImport);

/**
 * POST /import/test
 * Test endpoint to verify large payloads work
 */
router.post('/test', (req, res) => {
  console.log('[IMPORT TEST] Request received');
  console.log('[IMPORT TEST] Body size:', JSON.stringify(req.body).length);
  console.log('[IMPORT TEST] Transactions count:', req.body?.transactions?.length || 0);

  res.json({
    success: true,
    message: 'Test endpoint reached successfully',
    receivedTransactions: req.body?.transactions?.length || 0,
    bodySize: JSON.stringify(req.body).length
  });
});

export default router;
