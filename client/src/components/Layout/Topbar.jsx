import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleDarkMode } from '../../redux/slices/uiSlice';

const Topbar = ({ darkMode, onToggleDark, onLogout }) => {
  return (
    <nav className="navbar navbar-expand px-4 border-bottom" style={{ minHeight: '60px', background: 'var(--bs-body-bg)' }}>
      <span className="navbar-brand fw-bold text-primary d-flex align-items-center gap-2">
        <span style={{ fontSize: '1.4rem' }}>🏦</span>
        <span className="d-none d-md-inline">બાપા સીતારામ મંડળ</span>
      </span>
      <div className="ms-auto d-flex align-items-center gap-2">
        <button className="btn btn-sm btn-outline-secondary" onClick={onToggleDark} title="Toggle Theme">
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button className="btn btn-sm btn-outline-danger" onClick={onLogout}>
          ⬅ Logout
        </button>
      </div>
    </nav>
  );
};

export default Topbar;
