import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MdDashboard, MdPeople, MdPayments, MdAccountBalance, MdBarChart, MdMenu, MdClose, MdSettings } from 'react-icons/md';

const navItems = [
  { to: '/', icon: <MdDashboard size={20} />, label: 'ડૅશબોર્ડ', sublabel: 'Dashboard', end: true },
  { to: '/members', icon: <MdPeople size={20} />, label: 'સભ્યો', sublabel: 'Members' },
  { to: '/entries', icon: <MdPayments size={20} />, label: 'માસિક એન્ટ્રી', sublabel: 'Monthly Entry' },
  { to: '/reports', icon: <MdBarChart size={20} />, label: 'રિપોર્ટ', sublabel: 'Reports' },
  { to: '/settings', icon: <MdSettings size={20} />, label: 'સેટિંગ્સ', sublabel: 'Settings' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay toggle */}
      <button
        className="btn btn-sm btn-outline-primary d-md-none position-fixed top-0 start-0 m-2 z-3"
        style={{ zIndex: 1050 }}
        onClick={() => setCollapsed(c => !c)}
      >
        {collapsed ? <MdClose /> : <MdMenu />}
      </button>

      <div
        className={`sidebar d-flex flex-column ${collapsed ? 'sidebar-collapsed' : ''}`}
        style={{
          width: collapsed ? '0' : '220px',
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div className="px-3 py-4 text-white text-center border-bottom border-indigo-700" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: '1.8rem' }}>🏦</div>
          <div className="fw-bold" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>બાપા સીતારામ</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>મંડળ Management v2</div>
        </div>

        {/* Nav Items */}
        <nav className="flex-grow-1 py-3">
          <ul className="list-unstyled m-0">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `d-flex align-items-center gap-3 px-3 py-3 text-decoration-none rounded mx-2 mb-1 transition-all ${
                      isActive
                        ? 'text-white fw-bold'
                        : 'text-white-50'
                    }`
                  }
                  style={({ isActive }) => ({
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                    fontSize: '0.9rem',
                  })}
                >
                  {item.icon}
                  <span>{item.label}<br /><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{item.sublabel}</span></span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-3 py-2 text-center" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
          મંડળ નં. 36 · v2.0
        </div>
      </div>
    </>
  );
};

export default Sidebar;
