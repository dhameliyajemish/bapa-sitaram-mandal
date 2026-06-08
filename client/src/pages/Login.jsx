import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError, forgotPassword, resetPassword } from '../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useSelector(s => s.auth);
  
  
  const [view, setView] = useState('login');
  
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  
  const [forgotEmail, setForgotEmail] = useState('');

  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, view]);

  
  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(form)).unwrap();
      toast.success('Logged in successfully!');
    } catch (err) {
      toast.error(err || 'Invalid email or password');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await dispatch(forgotPassword({ email: forgotEmail })).unwrap();
      toast.success(res?.message || 'OTP sent successfully to your email!');
      setView('reset');
    } catch (err) {
      toast.error(err || 'Failed to send OTP. Please check your email.');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await dispatch(resetPassword({ email: forgotEmail, otp, newPassword })).unwrap();
      toast.success(res?.message || 'Password reset successfully!');
      setView('login');
      
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setForgotEmail('');
    } catch (err) {
      toast.error(err || 'Failed to reset password. Please verify the OTP.');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)' }}>
      <div className="card border-0 shadow-lg" style={{ width: '100%', maxWidth: '440px', borderRadius: '20px' }}>
        <div className="card-body p-5">
          {}
          <div className="text-center mb-4">
            <div style={{ fontSize: '3rem' }}>🏦</div>
            <h2 className="fw-bold" style={{ color: '#4f46e5', fontFamily: 'Hind Vadodara, sans-serif' }}>
              {view === 'login' && 'બાપા સીતારામ મંડળ'}
              {view === 'forgot' && 'પાસવર્ડ ભૂલી ગયા?'}
              {view === 'reset' && 'પાસવર્ડ રીસેટ કરો'}
            </h2>
            <p className="text-muted small">
              {view === 'login' && 'Admin Management System v2.0'}
              {view === 'forgot' && 'Forgot Password Recovery'}
              {view === 'reset' && 'Create New Password'}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small">⚠️ {error}</div>
          )}

          {}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">📧 Email</label>
                <input
                  type="email" className="form-control form-control-lg" required
                  placeholder="admin@mandal.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold mb-0">🔒 Password</label>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-primary fw-semibold small"
                    style={{ fontSize: '0.82rem' }}
                    onClick={() => setView('forgot')}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="input-group">
                  <input
                    type={showPass ? 'text' : 'password'} className="form-control form-control-lg" required
                    placeholder="••••••••"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button
                type="submit" className="btn btn-primary btn-lg w-100 fw-bold"
                disabled={loading}
                style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '10px' }}
              >
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Loading...</> : '🔐 Login'}
              </button>
            </form>
          )}

          {}
          {view === 'forgot' && (
            <form onSubmit={handleForgotSubmit}>
              <p className="text-muted small mb-4 text-center">
                તમારા રજીસ્ટર્ડ ઈમેઈલ પર ૬-આંકડાનો OTP મોકલવામાં આવશે.
                <br />
                We will send a 6-digit OTP to your registered email address.
              </p>
              <div className="mb-4">
                <label className="form-label fw-semibold">📧 Registered Email</label>
                <input
                  type="email" className="form-control form-control-lg" required
                  placeholder="admin@mandal.com"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                />
              </div>
              <button
                type="submit" className="btn btn-primary btn-lg w-100 fw-bold mb-3"
                disabled={loading}
                style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '10px' }}
              >
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Sending OTP...</> : '✉️ Send OTP'}
              </button>
              <div className="text-center">
                <button
                  type="button" className="btn btn-link text-decoration-none fw-semibold text-muted small"
                  onClick={() => setView('login')}
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {}
          {view === 'reset' && (
            <form onSubmit={handleResetSubmit}>
              <p className="text-muted small mb-4 text-center">
                તમારા ઈમેઈલ પર આવેલો OTP અને નવો પાસવર્ડ દાખલ કરો.
                <br />
                Enter the OTP received on your email and choose a new password.
              </p>
              <div className="mb-3">
                <label className="form-label fw-semibold">🔑 OTP (6-Digit)</label>
                <input
                  type="text" className="form-control form-control-lg text-center" required
                  maxLength={6} placeholder="123456" style={{ letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 'bold' }}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">🔒 New Password</label>
                <input
                  type="password" className="form-control form-control-lg" required
                  placeholder="Minimum 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">🔒 Confirm New Password</label>
                <input
                  type="password" className="form-control form-control-lg" required
                  placeholder="Re-enter new password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <div className="text-danger small mt-1">⚠️ Passwords do not match</div>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <div className="text-success small mt-1">✅ Passwords match</div>
                )}
              </div>
              <button
                type="submit" className="btn btn-primary btn-lg w-100 fw-bold mb-3"
                disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '10px' }}
              >
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Resetting...</> : '🛡️ Reset Password'}
              </button>
              <div className="text-center d-flex justify-content-between">
                <button
                  type="button" className="btn btn-link p-0 text-decoration-none fw-semibold text-muted small"
                  onClick={() => setView('forgot')}
                >
                  ← Resend OTP
                </button>
                <button
                  type="button" className="btn btn-link p-0 text-decoration-none fw-semibold text-muted small"
                  onClick={() => setView('login')}
                >
                  Back to Login →
                </button>
              </div>
            </form>
          )}

          {}
          {view === 'login' && (
            <div className="text-center mt-4">
              <span className="text-muted small">Don't have an account? </span>
              <Link to="/register" className="text-primary fw-semibold text-decoration-none">Register →</Link>
            </div>
          )}

          <div className="text-center mt-3 text-muted" style={{ fontSize: '0.75rem' }}>
            Bapa Sitaram Mandal · Mandal No. 36
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
