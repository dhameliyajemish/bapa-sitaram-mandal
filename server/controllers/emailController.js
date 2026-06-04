const nodemailer = require('nodemailer');
const Member = require('../models/Member');

const sendMonthlyReportEmail = async (req, res) => {
  const { email, memberName, month, hapto, upad, vyaj, dand, total } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlTemplate = `
    <div style="font-family: 'Hind Vadodara', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">બાપા સીતારામ મંડળ</h2>
        <p style="margin: 5px 0 0 0;">માસિક અહેવાલ (Monthly Report) - ${month}</p>
      </div>
      <div style="padding: 20px; color: #334155;">
        <p>આદરણીય સભ્યશ્રી <strong>${memberName}</strong>,</p>
        <p>બાપા સીતારામ મંડળ તરફથી આપનો ચાલુ મહિનાનો વિગતવાર હિસાબ નીચે મુજબ મોકલવામાં આવેલ છે:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">વિગત</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: right;">રકમ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">માસિક હપ્તો (કલેક્શન)</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: right; color: #10b981; font-weight: bold;">₹${hapto}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">ઉપાડ રકમ</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: right; color: #ef4444; font-weight: bold;">₹${upad}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">વ્યાજ</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: right; color: #f59e0b; font-weight: bold;">₹${vyaj}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">દંડ</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: right; color: #f59e0b; font-weight: bold;">₹${dand}</td>
            </tr>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td style="border: 1px solid #e2e8f0; padding: 12px;">કુલ જમા રકમ</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px; text-align: right; color: #4f46e5;">₹${total}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 20px;">જો આપને હિસાબ અંગે કોઈ પ્રશ્ન હોય, તો મંડળના સંચાલકશ્રીનો સંપર્ક કરવા વિનંતી.</p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #64748b; text-align: center;">
          આ ઈમેલ મંડળ મેનેજમેન્ટ સોફ્ટવેર દ્વારા મોકલવામાં આવ્યો છે.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `બાપા સીતારામ મંડળ - માસિક અહેવાલ (${month})`,
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Mail sending error:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
};

const sendAllMonthlyReports = async (req, res) => {
  const { reports } = req.body;

  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    return res.status(400).json({ message: 'No reports provided' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const month = reports[0].month;

  // Build rows for all members
  let grandHapto = 0, grandUpad = 0, grandVyaj = 0, grandDand = 0, grandTotal = 0;
  const rowsHtml = reports.map(r => {
    grandHapto += Number(r.hapto || 0);
    grandUpad += Number(r.upad || 0);
    grandVyaj += Number(r.vyaj || 0);
    grandDand += Number(r.dand || 0);
    grandTotal += Number(r.total || 0);

    return `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${r.fataNo || '-'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">${r.memberName}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #10b981;">₹${r.hapto}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #ef4444;">₹${r.upad}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #f59e0b;">₹${r.vyaj}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #f59e0b;">₹${r.dand}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #4f46e5; font-weight: bold;">₹${r.total}</td>
      </tr>
    `;
  }).join('');

  const htmlTemplate = `
    <div style="font-family: 'Hind Vadodara', Arial, sans-serif; max-width: 800px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">બાપા સીતારામ મંડળ</h2>
        <p style="margin: 5px 0 0 0;">આખા મંડળનો માસિક અહેવાલ (Full Mandal Report) - ${month}</p>
      </div>
      <div style="padding: 20px; color: #334155;">
        <p>આદરણીય સભ્યશ્રી,</p>
        <p>બાપા સીતારામ મંડળ તરફથી આપને જાણ કરવામાં આવે છે કે <strong>${month}</strong> મહિનાનો સંપૂર્ણ હિસાબ નીચે મુજબ છે:</p>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">ખાતા નં.</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">સભ્યનું નામ</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">હપ્તો</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">ઉપાડ</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">વ્યાજ</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">દંડ</th>
                <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">ચોખ્ખો</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;" colspan="2">કુલ (Grand Total)</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #10b981;">₹${grandHapto.toFixed(2)}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #ef4444;">₹${grandUpad.toFixed(2)}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #f59e0b;">₹${grandVyaj.toFixed(2)}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #f59e0b;">₹${grandDand.toFixed(2)}</td>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #4f46e5;">₹${grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p style="margin-top: 20px;">જો આપને હિસાબ અંગે કોઈ પ્રશ્ન હોય, તો મંડળના સંચાલકશ્રીનો સંપર્ક કરવા વિનંતી.</p>
        <p style="margin-top: 30px; font-size: 0.9em; color: #64748b; text-align: center;">
          આ ઈમેલ મંડળ મેનેજમેન્ટ સોફ્ટવેર દ્વારા મોકલવામાં આવ્યો છે.
        </p>
      </div>
    </div>
  `;

  let successCount = 0;
  let failCount = 0;

  for (const report of reports) {
    if (!report.email) {
      continue;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: report.email,
      subject: `બાપા સીતારામ મંડળ - સંપૂર્ણ હિસાબ (${month})`,
      html: htmlTemplate,
    };

    try {
      await transporter.sendMail(mailOptions);
      successCount++;
    } catch (error) {
      console.error(`Error sending email to ${report.email}:`, error);
      failCount++;
    }
  }

  res.json({
    message: 'Broadcast completed',
    successCount,
    failCount,
  });
};

module.exports = { sendMonthlyReportEmail, sendAllMonthlyReports };
