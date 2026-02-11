import express from 'express';
import multer from 'multer';
import { analyzeReceipt, analyzeReceiptFromText } from '../services/receiptService';

const router = express.Router();

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/receipt/scan
router.post('/scan', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No receipt image provided' });
    }

    console.log('Processing receipt scan...');

    // Analyze the receipt image using AI
    const receiptItems = await analyzeReceipt(req.file.buffer);

    console.log(`Receipt analysis complete: ${receiptItems.length} items found`);

    res.json({
      success: true,
      items: receiptItems,
      total: receiptItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
      itemCount: receiptItems.length,
    });

  } catch (error) {
    console.error('Receipt scanning error:', error);
    res.status(500).json({
      error: 'Failed to scan receipt',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/receipt/scan-text (fallback for when image upload fails)
router.post('/scan-text', async (req, res) => {
  try {
    const { receiptText } = req.body;

    if (!receiptText) {
      return res.status(400).json({ error: 'No receipt text provided' });
    }

    console.log('Processing receipt text analysis...');

    // Analyze receipt text using AI
    const receiptItems = await analyzeReceiptFromText(receiptText);

    console.log(`Receipt text analysis complete: ${receiptItems.length} items found`);

    res.json({
      success: true,
      items: receiptItems,
      total: receiptItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
      itemCount: receiptItems.length,
    });

  } catch (error) {
    console.error('Receipt text analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze receipt text',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
