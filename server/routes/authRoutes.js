const express = require('express');
const router = express.Router();
const { registerAdmin, authAdmin, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', registerAdmin);
router.post('/login', authAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
