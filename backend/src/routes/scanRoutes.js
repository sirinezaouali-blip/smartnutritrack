const express = require('express');
const {
  scanBarcode,
  scanImage,
  recognizeDish,
  getScanHistory
} = require('../controllers/scanController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.post('/barcode', scanBarcode);
router.post('/image', scanImage);
router.post('/dish', recognizeDish);
router.get('/history', getScanHistory);

module.exports = router;