import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { logout } from './redux/slices/authSlice.js';
import { loadMembers } from './redux/slices/memberSlice.js';
import { loadEntries } from './redux/slices/entrySlice.js';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MembersPage from './pages/MembersPage';
import TransactionsPage from './pages/TransactionsPage';
import LoansPage from './pages/Loans.jsx';
import ReportsPage from './pages/ReportsPage';

/* ── ProtectedRoute ─────────────────────────────────────────── */
const ProtectedRoute = ({ children }) => {
  const { token } = useSelector(state => state.auth);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

/* ── DashboardLayout wrapper that dispatches initial data loads ── */
const DashboardWithLoading = () => {
  const dispatch  = useDispatch();
  const { loading: authLoading } = useSelector((s) => s.auth);
  if (authLoading) return null;
  React.useEffect(() => {
    dispatch(loadMembers());
    dispatch(loadEntries());
  }, [dispatch]);
  return <Dashboard />;
};

const App = () => (
  <Router>
    <Toaster position="top-right"
      toastOptions={{ duration: 3000, style: { background: '#1e293b', color: '#fff' } }} />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index                          element={<DashboardWithLoading />} />
        <Route path="members"                 element={<MembersPage />} />
        <Route path="transactions"            element={<TransactionsPage />} />
        <Route path="loans"                   element={<LoansPage />} />
        <Route path="reports"                 element={<ReportsPage />} />
      </Route>
    </Routes>
  </Router>
);

export default App;
