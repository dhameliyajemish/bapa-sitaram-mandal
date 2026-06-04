import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../redux/slices/authSlice';
import { toast } from 'react-hot-toast';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector(s => s.auth);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    mandalName: 'Bapa Sitaram Mandal',
    mandalNo: '36',
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const res = await dispatch(register({
      username: form.username,
      email: form.email,
      password: form.password,
    }));

    if (!res.error) {
      toast.success('✅ Account created! Please login.');
      navigate('/login');
    } else {
      setError(res.payload);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)' }}
    >
      <div className="card border-0 shadow-lg" style={{ width: '100%', maxWidth: '480px', borderRadius: '20px' }}>
        <div className="card-body p-5">

          {/* Header */}
          <div className="text-center mb-4">
            <div style={{ fontSize: '3rem' }}>🏦</div>
            <h2 className="fw-bold" style={{ color: '#4f46e5', fontFamily: 'Hind Vadodara, sans-serif' }}>
              નવું એકાઉન્ટ બનાવો
            </h2>
            <p className="text-muted small">Create Admin Account · Mandal Management v2.0</p>
          </div>

          {error && <div className="alert alert-danger py-2 small">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Username */}
              <div className="col-12">
                <label className="form-label fw-semibold">👤 Admin Name (યુઝરનેમ)</label>
                <input
                  type="text" name="username" className="form-control form-control-lg"
                  placeholder="e.g. Mukeshbhai"
                  required value={form.username} onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div className="col-12">
                <label className="form-label fw-semibold">📧 Email</label>
                <input
                  type="email" name="email" className="form-control form-control-lg"
                  placeholder="admin@mandal.com"
                  required value={form.email} onChange={handleChange}
                />
              </div>

              {/* Mandal Info */}
              <div className="col-md-8">
                <label className="form-label fw-semibold">🏦 મંડળ નામ (Mandal Name)</label>
                <input
                  type="text" name="mandalName" className="form-control"
                  value={form.mandalName} onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">મંડળ નં.</label>
                <input
                  type="text" name="mandalNo" className="form-control"
                  value={form.mandalNo} onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="col-12">
                <label className="form-label fw-semibold">🔒 Password</label>
                <div className="input-group">
                  <input
                    type={showPass ? 'text' : 'password'} name="password"
                    className="form-control form-control-lg"
                    placeholder="Minimum 6 characters"
                    required value={form.password} onChange={handleChange}
                  />
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="col-12">
                <label className="form-label fw-semibold">🔒 Confirm Password</label>
                <input
                  type={showPass ? 'text' : 'password'} name="confirmPassword"
                  className="form-control form-control-lg"
                  placeholder="Re-enter password"
                  required value={form.confirmPassword} onChange={handleChange}
                />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <div className="text-danger small mt-1">⚠️ Passwords do not match</div>
                )}
                {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                  <div className="text-success small mt-1">✅ Passwords match</div>
                )}
              </div>

              {/* Submit */}
              <div className="col-12 mt-2">
                <button
                  type="submit" className="btn btn-primary btn-lg w-100 fw-bold"
                  disabled={loading}
                  style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '10px' }}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Creating Account...</>
                    : '🚀 Register'}
                </button>
              </div>
            </div>
          </form>

          {/* Footer link */}
          <div className="text-center mt-4">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="text-primary fw-semibold text-decoration-none">Login →</Link>
          </div>

          <div className="text-center mt-3 text-muted" style={{ fontSize: '0.7rem' }}>
            Bapa Sitaram Mandal · Mandal No. 36
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
