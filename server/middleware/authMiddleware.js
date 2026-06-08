const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      const admin = db.prepare('SELECT id, username, email, role, resetPasswordOTP, resetPasswordExpires, createdAt, updatedAt FROM admins WHERE id = ?').get(decoded.id);

      if (!admin) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      req.admin = {
        ...admin,
        _id: admin.id
      };

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
  }
};

module.exports = { protect };
