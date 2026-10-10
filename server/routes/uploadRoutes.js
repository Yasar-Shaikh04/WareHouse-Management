const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

router.post(
  '/product-image',
  requireAuth,
  requireRole('Admin', 'Warehouse Manager'),
  uploadImage.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file rejected.',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      imageUrl: fileUrl,
      fileName: req.file.filename,
    });
  }
);

module.exports = router;
