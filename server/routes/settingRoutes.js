const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const upload = multer({ dest: os.tmpdir() });

const { getSettings, updateSettings, exportDatabase, importDatabase } = require('../controllers/settingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSettings)
  .put(protect, updateSettings);

router.get('/backup/export', protect, exportDatabase);
router.post('/backup/import', protect, upload.single('file'), importDatabase);

module.exports = router;
