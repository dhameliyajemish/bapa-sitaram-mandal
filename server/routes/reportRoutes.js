const express = require('express');
const router = express.Router();
const {
  getMonthlyReport, getYearlyReport, getMemberLedger,
  getDashboardStats, getMonthlyTrend
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/monthly',          protect, getMonthlyReport);
router.get('/yearly',           protect, getYearlyReport);
router.get('/member/:memberId', protect, getMemberLedger);
router.get('/dashboard-stats',  protect, getDashboardStats);
router.get('/monthly-trend',    protect, getMonthlyTrend);

module.exports = router;
