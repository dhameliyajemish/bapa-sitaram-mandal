const express = require('express');
const router = express.Router();
const { getTransactions, addTransaction, deleteTransaction, getSummary, getMemberLedger } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/summary', getSummary);
router.get('/ledger/:memberId', getMemberLedger);
router.get('/', getTransactions);
router.post('/', addTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
