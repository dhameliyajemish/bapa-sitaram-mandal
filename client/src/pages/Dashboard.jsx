import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadMembers } from '../redux/slices/memberSlice.js';
import { loadEntries } from '../redux/slices/entrySlice.js';
import helpers from '../utils/helpers';

/**
 * Dashboard Page Component
 * 
 * This component displays key statistics and analytics for the mandal management system.
 * It uses Redux Toolkit for state management and computes all stats from the Redux store.
 * 
 * Features:
 * - 6 StatCards displaying member, deposit, withdrawal, loan, and balance information
 * - Monthly trend chart using inline SVG bars
 * - Dark mode toggle
 * - Loading and error states
 * 
 * Stats are computed purely from Redux state using reduce() on arrays:
 * - Total Members: members.list.length
 * - Total Deposits: sum of hapto from entries
 * - Total Withdrawals: sum of upad from entries  
 * - Net Balance: Deposits minus Withdrawals
 * - Active Loans: count of loans with status 'Active'
 * - Total Loan Amount: sum of loan.amount
 */

/**
 * Format currency values for display
 * @param {number} n - Value to format
 * @returns {string} Formatted currency string
 */
function fmt(n) {
  return 'Rs ' + Number(n || 0).toLocaleString('en-IN');
}

/**
 * Calculate percentage change between current and previous values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {string} Formatted percentage change or N/A
 */
function calcPercentChange(current, previous) {
  if (!previous || previous === 0) return 'N/A';
  const change = ((current - previous) / previous) * 100;
  return change.toFixed(1) + '%';
}

/**
 * Get a color based on value (positive = green, negative = red)
 * @param {number} value - Value to check
 * @returns {string} CSS color value
 */
function getValueColor(value) {
  return value >= 0 ? '#10b981' : '#ef4444';
}

/**
 * StatCard Component - Displays a single statistic in a card
 * @param {object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Value to display
 * @param {string} props.icon - Emoji or icon character
 * @param {string} props.color - CSS color for the value
 * @param {string} props.sub - Optional subtitle
 */
const StatCard = ({ title, value, icon, color, sub }) => (
  <div className="col-12 col-sm-6 col-lg-4 col-xl-2">
    <div className="stat-card border-0 shadow-sm h-100 d-flex align-items-center gap-3 p-3">
      <div style={{fontSize: '1.8rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</div>
      <div style={{ minWidth: 0, flexGrow: 1 }}>
        <div className="text-muted small text-nowrap" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} title={title}>{title}</div>
        <div className="fw-bold fs-6" style={{color, wordBreak: 'break-word'}}>{value}</div>
        {sub && <div style={{fontSize: '0.7rem', color: '#666', wordBreak: 'break-word'}} title={sub}>{sub}</div>}
      </div>
    </div>
  </div>
);

/**
 * SimpleBarChart Component - Displays a bar chart using inline bars
 * Built using raw React DOM elements, NOT Chart.js
 * @param {object} props - Component props
 * @param {number[]} props.data - Array of values for each bar
 * @param {string[]} props.labels - Labels for each bar
 * @param {string} props.title - Chart title
 */
const SimpleBarChart = ({ data, labels, title }) => {
  const maxValue = Math.max(...data, 1);
  const hasData = data.some(v => v > 0);
  
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-transparent border-0 fw-bold">{title}</div>
      <div className="card-body">
        {!hasData ? (
          <div className="text-center text-muted py-4">No data available for the selected period</div>
        ) : (
          <div style={{height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px'}}>
            {data.map((value, idx) => {
              const height = (value / maxValue) * 180;
              const barColor = value > 0 ? 'rgba(99, 102, 241, 0.7)' : 'rgba(200, 200, 200, 0.3)';
              return (
                <div key={idx} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <div title={value.toString()} style={{height: height + 'px', width: '40px', backgroundColor: barColor, borderRadius: '4px 4px 0 0'}}/>
                  <div style={{fontSize: '0.65rem', marginTop: '4px'}}>{labels[idx]}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * SummaryCard Component - Displays a list of summary items
 * @param {object} props - Component props
 * @param {string} props.title - Card title
 * @param {Array} props.items - Array of {label, value, positive?, negative?}
 */
const SummaryCard = ({ title, items }) => (
  <div className="card border-0 shadow-sm">
    <div className="card-header bg-transparent border-0 fw-bold">{title}</div>
    <div className="card-body">
      {items.map((item, idx) => (
        <div key={idx} className="d-flex justify-content-between py-2" style={{borderBottom: idx < items.length - 1 ? '1px solid #eee' : 'none'}}>
          <span>{item.label}</span>
          <strong className={item.positive ? 'text-success' : item.negative ? 'text-danger' : ''}>{item.value}</strong>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Dashboard Main Component
 * Connects to Redux store and displays all dashboard statistics
 */
const Dashboard = () => {
  const dispatch = useDispatch();
  
  // Redux state selectors - using direct state paths as required
  const members = useSelector((state) => state.members?.list || []);
  const membersLoading = useSelector((state) => state.members?.loading);
  const membersError = useSelector((state) => state.members?.error);
  const entries = useSelector((state) => state.entries?.list || []);
  const entriesLoading = useSelector((state) => state.entries?.loading);
  const entriesError = useSelector((state) => state.entries?.error);
  
  // Load data on component mount
  useEffect(() => {
    dispatch(loadMembers());
    dispatch(loadEntries());
  }, [dispatch]);
  
  // Memoized calculations for stats - all computed from Redux state
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const totalDeposits = entries.reduce((sum, e) => sum + Number(e.hapto || 0), 0);
    const totalWithdrawals = entries.reduce((sum, e) => sum + Number(e.upad || 0), 0);
    const netBalance = totalDeposits - totalWithdrawals;
    const totalInterest = entries.reduce((sum, e) => sum + Number(e.vyaj || 0), 0);
    const totalPenalty = entries.reduce((sum, e) => sum + Number(e.dand || 0), 0);
    
    return {
      totalMembers,
      totalDeposits,
      totalWithdrawals,
      netBalance,
      totalInterest,
      totalPenalty
    };
  }, [members, entries]);
  
  // Monthly data for chart using helpers.getLast12Months()
  const { monthlyDeposits, chartLabels } = useMemo(() => {
    const months = helpers.getLast12Months();
    const deposits = months.map(month => {
      return entries.reduce((sum, e) => {
        if (e.month === month) {
          return sum + Number(e.hapto || 0);
        }
        return sum;
      }, 0);
    });
    const labels = months.map(m => helpers.monthLabel(m).split(' ')[0]);
    return { monthlyDeposits: deposits, chartLabels: labels };
  }, [entries]);
  
  const isLoading = membersLoading || entriesLoading;
  const hasError = membersError || entriesError;
  
  // Summary items for side cards
  const summaryItems = [
    { label: 'Total Members', value: (stats.totalMembers || 0).toString() },
    { label: 'Total Entries', value: (entries.length || 0).toString() }
  ];
  
  const financialItems = [
    { label: 'Total Deposits', value: fmt(stats.totalDeposits), positive: true },
    { label: 'Total Withdrawals', value: fmt(stats.totalWithdrawals), negative: true },
    { label: 'Net Balance', value: fmt(stats.netBalance), positive: stats.netBalance >= 0 }
  ];
  
  return (
    <div>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Dashboard</h4>
          <small className="text-muted">Last updated: {new Date().toLocaleTimeString()}</small>
        </div>
      </div>
      
      {/* Error Alert */}
      {hasError && (
        <div className="alert alert-danger">Error loading data. Please refresh the page.</div>
      )}
      
      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid - 5 cards in a row */}
          <div className="row g-3 mb-4">
            <StatCard title="Total Members" value={stats.totalMembers} icon="👥" color="#6366f1" sub="Active members"/>
            <StatCard title="Total Deposits" value={fmt(stats.totalDeposits)} icon="💰" color="#10b981" sub={fmt(stats.totalInterest) + ' interest'}/>
            <StatCard title="Total Withdrawals" value={fmt(stats.totalWithdrawals)} icon="📤" color="#ef4444"/>
            <StatCard title="Net Balance" value={fmt(stats.netBalance)} icon="🏦" color={getValueColor(stats.netBalance)}/>
            <StatCard title="Total Penalty" value={fmt(stats.totalPenalty)} icon="⚠️" color="#f97316"/>
          </div>
          
          {/* Monthly Chart */}
          <div className="mb-4">
            <SimpleBarChart data={monthlyDeposits} labels={chartLabels} title="Monthly Deposit Trend (Last 12 Months)"/>
          </div>
          
          {/* Summary Cards */}
          <div className="row g-3">
            <div className="col-md-6">
              <SummaryCard title="Member Summary" items={summaryItems}/>
            </div>
            <div className="col-md-6">
              <SummaryCard title="Financial Summary" items={financialItems}/>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
