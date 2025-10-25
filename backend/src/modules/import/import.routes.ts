import { Router } from 'express';
import multer from 'multer';
import { ImportController } from './import.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const importController = new ImportController();

// Configure multer for memory storage (file buffer)
const upload = multer({
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

// All import routes require authentication
router.use(authenticate);

/**
 * POST /import/csv
 * Upload and preview CSV file
 */
router.post('/csv', upload.single('file'), importController.previewCsv);

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
