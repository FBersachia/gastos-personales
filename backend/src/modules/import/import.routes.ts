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

export default router;
