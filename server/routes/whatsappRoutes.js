const express = require('express');
const router = express.Router();
const { sendWhatsAppMessage, sendAllWhatsAppMessages } = require('../controllers/whatsappController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send', protect, sendWhatsAppMessage);
router.post('/send-all', protect, sendAllWhatsAppMessages);

module.exports = router;
