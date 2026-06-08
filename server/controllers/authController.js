const { db } = require('../config/db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

const registerAdmin = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    const emailExists = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const usernameExists = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = db.prepare(
      'INSERT INTO admins (username, email, password) VALUES (?, ?, ?)'
    ).run(username, email, hashedPassword);

    if (result.lastInsertRowid) {
      const adminId = result.lastInsertRowid;
      res.status(201).json({
        _id: adminId,
        username,
        email,
        token: generateToken(adminId),
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (err) {
    next(err);
  }
};

const authAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);

    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        _id: admin.id,
        username: admin.username,
        email: admin.email,
        token: generateToken(admin.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
      return res.status(404).json({ message: 'Email is not registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; 

    db.prepare('UPDATE admins SET resetPasswordOTP = ?, resetPasswordExpires = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?')
      .run(otp, expires, admin.id);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'બાપા સીતારામ મંડળ - પાસવર્ડ રીસેટ OTP (OTP for Password Reset)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">પાસવર્ડ રીસેટ કરવા માટેનો OTP</h2>
          <p>નમસ્તે,</p>
          <p>તમે તમારા એકાઉન્ટનો પાસવર્ડ રીસેટ કરવા માટે વિનંતી કરી છે. તમારો 6-આંકડાનો OTP નીચે મુજબ છે:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; border: 2px dashed #4f46e5; padding: 10px 20px; border-radius: 5px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="color: #ef4444; font-weight: bold;">આ OTP આગામી ૧૫ મિનિટ માટે જ માન્ય રહેશે.</p>
          <p>જો તમે આ વિનંતી નથી કરી, તો કૃપા કરીને આ ઇમેઇલને અવગણો.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">બાપા સીતારામ મંડળ મેનેજમેન્ટ સિસ્ટમ</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: 'OTP sent successfully to your email!' });
    } catch (mailErr) {
      console.error('Nodemailer error:', mailErr.message);
      console.log('\n======================================');
      console.log(`🔑 PASSWORD RESET OTP FOR ${email}: ${otp}`);
      console.log('======================================\n');
      
      res.status(500).json({ 
        message: 'Failed to send OTP email. Please check server SMTP configuration.'
      });
    }
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (
      !admin.resetPasswordOTP ||
      admin.resetPasswordOTP !== otp ||
      admin.resetPasswordExpires < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    db.prepare(
      'UPDATE admins SET password = ?, resetPasswordOTP = NULL, resetPasswordExpires = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(hashedPassword, admin.id);

    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerAdmin, authAdmin, forgotPassword, resetPassword };
