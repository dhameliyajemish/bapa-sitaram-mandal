const express = require('express');
const router = express.Router();
const { sendMonthlyReportEmail, sendAllMonthlyReports } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send', protect, sendMonthlyReportEmail);
router.post('/send-all', protect, sendAllMonthlyReports);

module.exports = router;
