const express = require('express');
const router = express.Router();
const {
  getLoans, createLoan, updateLoan, deleteLoan, getLoanStats
} = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getLoans)
  .post(protect, createLoan);

router.get('/stats/summary', protect, getLoanStats);

router.route('/:id')
  .put(protect, updateLoan)
  .delete(protect, deleteLoan);

module.exports = router;
