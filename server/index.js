const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// -- Routes --------------------------------------------------------------
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/members',    require('./routes/memberRoutes'));
app.use('/api/entries',    require('./routes/entryRoutes'));
app.use('/api/loans',      require('./routes/loanRoutes'));
app.use('/api/email',      require('./routes/emailRoutes'));
app.use('/api/admin',      require('./routes/adminRoutes'));
app.use('/api/whatsapp',   require('./routes/whatsappRoutes'));
app.use('/api/reports',    require('./routes/reportRoutes'));
app.use('/api/settings',   require('./routes/settingRoutes'));
// -------------------------------------------------------------------------
const errorHandler = require('./middleware/errorHandler');

app.get('/', (req, res) => {
  res.json({ message: 'Mandal Management API is running', version: '2.0.0' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT + ' in ' + (process.env.NODE_ENV || 'development') + ' mode');
});
