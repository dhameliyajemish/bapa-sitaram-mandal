import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const DashboardLayout = () => {
  const [time, setTime] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const admin = useSelector(s => s.auth.admin);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: 'bi-speedometer2', label: 'ડેશબોર્ડ' },
    { to: '/members', icon: 'bi-people', label: 'સભ્યો' },
    { to: '/transactions', icon: 'bi-receipt', label: 'એન્ટ્રી' },
    { to: '/reports', icon: 'bi-graph-up', label: 'રિપોર્ટ્સ' },
    { to: '/settings', icon: 'bi-gear', label: 'સેટિંગ્સ' },
  ];

  return (
    <div className="app-container">
      <style>{`
        .sidebar { width: var(--sidebar-width); background: linear-gradient(180deg,#1e1b4b 0%,#312e81 100%); flex-shrink:0; }
        .sidebar-brand-icon { width:38px;height:38px;border-radius:10px;background:rgba(99,102,241,.5);display:flex;align-items:center;justify-content:center;color:#fff; }
        .sidebar-brand-sub   { font-size:.7rem;color:#a5b4fc; }
        .sidebar-badge { font-size:.7rem;color:#818cf8; }
        .nav-link-custom { color:#a5b4fc;padding:10px 16px;margin:3px 8px;border-radius:50px;text-decoration:none;font-size:.9rem;display:flex;align-items:center;gap:10px;transition:all .18s;cursor:pointer; }
        .nav-link-custom:hover  { background:rgba(99,102,241,.35)!important;color:#fff!important; }
        .nav-link-custom.active { background:#4f46e5!important;color:#fff!important;font-weight:600; }
        .nav-link-custom .nav-icon { font-size:1.2rem; }
        .topbar { background-color: #fff; transition: background-color 0.2s, border-color 0.2s; }
        .topbar-clock { font-size:.85rem;color:#64748b;font-weight:500;font-family:monospace; }
        .topbar-user  { font-weight:600;font-size:.88rem; }
        [data-theme="dark"] .topbar { background-color: #1e1b4b !important; border-color: #312e81 !important; color: #e2e8f0; }
        [data-theme="dark"] .topbar-clock { color: #a5b4fc; }
        [data-theme="dark"] .topbar-user { color: #e2e8f0; }
      `}</style>

      <nav className="sidebar d-flex flex-column h-100">
        <div className="p-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="sidebar-brand-icon"><i className="bi bi-bank"></i></div>
            <div>
              <div className="text-white fw-bold small" style={{ fontFamily: "'Hind Vadodara',sans-serif" }}>બાપા સીતારામ મંડળ</div>
              <div className="sidebar-brand-sub">મેનેજમેન્ટ સિસ્ટમ</div>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 py-3 overflow-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `nav-link-custom${isActive ? ' active' : ''}`}
            >
              <i className={`bi ${item.icon} nav-icon`}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
          <button onClick={handleLogout} className="btn btn-sm btn-outline-light w-100">Logout</button>
        </div>
      </nav>

      <div className="main-content d-flex flex-column" style={{ minWidth: 0 }}>
        <header className="topbar border-bottom px-4 py-2 d-flex justify-content-between align-items-center">
          <div className="topbar-clock">{time}</div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-sm btn-outline-secondary" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <span className="topbar-user">{admin?.username || 'Admin'}</span>
            <button onClick={handleLogout} className="btn btn-sm btn-outline-danger">Logout</button>
          </div>
        </header>
        <main className="p-4 flex-grow-1 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
};

export default DashboardLayout;
