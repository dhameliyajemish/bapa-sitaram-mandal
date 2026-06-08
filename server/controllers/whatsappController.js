const axios = require('axios');


const sendWhatsAppMessage = async (req, res) => {
  const { mobile, memberName, month, hapto, upad, vyaj, dand, total } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: 'Mobile number is required' });
  }

  const messageText = `નમસ્તે ${memberName},\nતમારો ${month} નો રીપોર્ટ નીચે મુજબ છે:\nહપ્તો: ₹${hapto}\nઉપાડ: ₹${upad}\nવ્યાજ: ₹${vyaj}\nદંડ: ₹${dand}\nકુલ જમા રકમ: ₹${total}\n\nઆભાર,\nબાપા સીતારામ મંડળ`;

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (token && phoneNumberId) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: `91${mobile}`,
          type: 'text',
          text: { body: messageText }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return res.json({ message: 'WhatsApp message sent successfully!', data: response.data });
    } catch (error) {
      console.error('WhatsApp API Error:', error.response?.data || error.message);
      return res.status(500).json({ message: 'WhatsApp Business API failed', error: error.response?.data || error.message });
    }
  } else {
    console.log(`[WhatsApp Broadcast Simulated] To: +91${mobile}\nMessage:\n${messageText}`);
    return res.json({ message: 'WhatsApp simulated successfully (Credentials not set in .env)', simulated: true });
  }
};


const sendAllWhatsAppMessages = async (req, res) => {
  const { reports } = req.body; 

  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    return res.status(400).json({ message: 'No reports provided' });
  }

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  let successCount = 0;
  let failCount = 0;

  for (const report of reports) {
    if (!report.mobile) {
      failCount++;
      continue;
    }

    const messageText = `નમસ્તે ${report.memberName},\nતમારો ${report.month} નો રીપોર્ટ નીચે મુજબ છે:\nહપ્તો: ₹${report.hapto}\nઉપાડ: ₹${report.upad}\nવ્યાજ: ₹${report.vyaj}\nદંડ: ₹${report.dand}\nકુલ જમા રકમ: ₹${report.total}\n\nઆભાર,\nબાપા સીતારામ મંડળ`;

    if (token && phoneNumberId) {
      try {
        await axios.post(
          `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
          {
            messaging_product: 'whatsapp',
            to: `91${report.mobile}`,
            type: 'text',
            text: { body: messageText }
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        successCount++;
      } catch (error) {
        console.error(`WhatsApp fail for ${report.mobile}:`, error.response?.data || error.message);
        failCount++;
      }
    } else {
      console.log(`[WhatsApp Broadcast Simulated] To: +91${report.mobile}\nMessage:\n${messageText}`);
      successCount++;
    }
  }

  res.json({
    message: token && phoneNumberId ? 'WhatsApp broadcast completed' : 'WhatsApp broadcast simulated (No credentials in .env)',
    successCount,
    failCount,
    simulated: !(token && phoneNumberId)
  });
};

module.exports = { sendWhatsAppMessage, sendAllWhatsAppMessages };
