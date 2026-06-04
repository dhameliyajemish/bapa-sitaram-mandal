import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { fetchMonthlyReport, fetchYearlyReport, fetchMemberLedger, fetchMonthlyTrend } from '../api/client';
import { loadMembers } from '../redux/slices/memberSlice.js';
import helpers from '../utils/helpers';
import toast from 'react-hot-toast';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const Skeleton = () => <div className="skeleton" style={{ height: 200, backgroundColor: '#e9ecef', borderRadius: 4 }}></div>;

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentYear = () => new Date().getFullYear().toString();

const monthNames = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];

const ReportsPage = () => {
  const dispatch = useDispatch();
  const [reportType, setReportType] = useState('monthly');
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [memberLedger, setMemberLedger] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);

  const members = useSelector(s => s.members.list);

  useEffect(() => {
    dispatch(loadMembers());
  }, [dispatch]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0]._id);
      initializedRef.current = true;
    }
  }, [members, selectedMemberId]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      if (reportType === 'monthly') {
        const { data } = await fetchMonthlyReport(month);
        setMonthlyData(data);
      } else if (reportType === 'yearly') {
        const { data } = await fetchYearlyReport(year);
        setYearlyData(data);
      } else if (reportType === 'member' && selectedMemberId) {
        const { data } = await fetchMemberLedger(selectedMemberId);
        setMemberLedger(data);
      } else if (reportType === 'trend') {
        const { data } = await fetchMonthlyTrend();
        setTrendData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reportType, month, year, selectedMemberId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handlePrint = () => window.print();

  const renderMonthlyReport = () => {
    if (!monthlyData) return null;
    const { rows, summary } = monthlyData;
    const totalRow = rows.reduce((acc, r) => {
      acc.h += Number(r.hapto || 0); acc.u += Number(r.upad || 0);
      acc.v += Number(r.vyaj || 0);   acc.d += Number(r.dand || 0);
      return acc;
    }, { h: 0, u: 0, v: 0, d: 0 });
    return (
      <div className="mt-4">
        <div className="row g-2 mb-3">
          <div className="col-6 col-md-3"><div className="p-2 bg-light rounded"><small>હપ્તો</small><div className="fw-bold">{fmt(summary.totalHapto)}</div></div></div>
          <div className="col-6 col-md-3"><div className="p-2 bg-light rounded"><small>ઉપાડ</small><div className="fw-bold">{fmt(summary.totalUpad)}</div></div></div>
          <div className="col-6 col-md-3"><div className="p-2 bg-light rounded"><small>વ્યાજ</small><div className="fw-bold">{fmt(summary.totalVyaj)}</div></div></div>
          <div className="col-6 col-md-3"><div className="p-2 bg-light rounded"><small>દંડ</small><div className="fw-bold">{fmt(summary.totalDand)}</div></div></div>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ફાટા નં.</th><th>નામ</th><th>હપ્તો</th><th>ઉપાડ</th><th>વ્યાજ</th><th>દંડ</th><th>કુલ બચત સિલક (Balance)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.member?.fataNo || ''}</td>
                  <td>{r.member?.name  || ''}</td>
                  <td>{fmt(r.hapto)}</td>
                  <td>{fmt(r.upad)}</td>
                  <td>{fmt(r.vyaj)}</td>
                  <td>{fmt(r.dand)}</td>
                  <td className="fw-bold">{fmt(r.balance)}</td>
                </tr>
              ))}
              <tr className="table-secondary fw-bold">
                <td colSpan="2">કુલ</td>
                <td>{fmt(totalRow.h)}</td>
                <td>{fmt(totalRow.u)}</td>
                <td>{fmt(totalRow.v)}</td>
                <td>{fmt(totalRow.d)}</td>
                <td>{fmt(rows.reduce((sum, r) => sum + Number(r.balance || 0), 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button className="btn btn-primary btn-sm mt-3" onClick={handlePrint}>Print / PDF</button>
      </div>
    );
  };

  const renderYearlyReport = () => {
    if (!yearlyData) return null;
    const { months, grandTotal } = yearlyData;
    const gt = grandTotal || {};
    return (
      <div className="mt-4">
        <div className="row g-2 mb-3">
          <div className="col-6 col-md-3"><div className="p-2 bg-light rounded"><small>કુલ હપ્તો</small><div className="fw-bold">{fmt(gt.totalHapto || 0)}</div></div></div>
          <div className="col-6 col-md-3"><div className="p-2 bg-light rounded"><small>કુલ ઉપાડ</small><div className="fw-bold">{fmt(gt.totalUpad || 0)}</div></div></div>
          <div className="col-6 col-md-3"><div className="p-2 bg-light rounded"><small>કુલ વ્યાજ</small><div className="fw-bold">{fmt(gt.totalVyaj || 0)}</div></div></div>
          <div className="col-6 col-md-3"><div className="p-2 bg-light rounded"><small>કુલ દંડ</small><div className="fw-bold">{fmt(gt.totalDand || 0)}</div></div></div>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>મહિનો</th>
                <th>હપ્તો</th><th>ઉપાડ</th><th>વ્યાજ</th><th>દંડ</th><th>કુલ</th>
              </tr>
            </thead>
            <tbody>
              {(months || []).map((m, i) => {
                const t = (m.mh || 0) - (m.mu || 0) + (m.mv || 0) + (m.md || 0);
                return (<tr key={i}>
                  <td>{m.label}</td>
                  <td>{fmt(m.mh || 0)}</td>
                  <td>{fmt(m.mu || 0)}</td>
                  <td>{fmt(m.mv || 0)}</td>
                  <td>{fmt(m.md || 0)}</td>
                  <td className="fw-bold">{fmt(t)}</td>
                </tr>);
              })}
              <tr className="table-secondary fw-bold">
                <td>એકંદર કુલ</td>
                <td>{fmt(gt.totalHapto || 0)}</td>
                <td>{fmt(gt.totalUpad  || 0)}</td>
                <td>{fmt(gt.totalVyaj  || 0)}</td>
                <td>{fmt(gt.totalDand  || 0)}</td>
                <td>{fmt((gt.totalHapto||0) - (gt.totalUpad||0) + (gt.totalVyaj||0) + (gt.totalDand||0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button className="btn btn-primary btn-sm mt-3" onClick={handlePrint}>Print / PDF</button>
      </div>
    );
  };

  const renderMemberLedger = () => {
    if (!memberLedger) return null;
    const { member, rows, totalHapto, totalUpad, totalVyaj, totalDand } = memberLedger;
    return (
      <div className="mt-4">
        <div className="mb-3"><strong>સભ્ય:</strong> {member?.name} ({member?.fataNo})</div>
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>મહિનો</th><th>હપ્તો</th><th>ઉપાડ</th><th>વ્યાજ</th><th>દંડ</th><th>કુલ બચત સિલક (Balance)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{helpers.monthLabel(r.month)}</td>
                  <td>{fmt(r.hapto)}</td>
                  <td>{fmt(r.upad)}</td>
                  <td>{fmt(r.vyaj)}</td>
                  <td>{fmt(r.dand)}</td>
                  <td className="fw-bold">{fmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-secondary fw-bold">
              <tr>
                <td>કુલ બચત સિલક</td>
                <td>{fmt(totalHapto)}</td>
                <td>{fmt(totalUpad)}</td>
                <td>{fmt(totalVyaj)}</td>
                <td>{fmt(totalDand)}</td>
                <td>{fmt(rows[rows.length - 1]?.total || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button className="btn btn-primary btn-sm mt-3" onClick={handlePrint}>Print / PDF</button>
      </div>
    );
  };

  const renderTrend = () => {
    if (!trendData) return null;
    const chartData = {
      labels: trendData.map(d => d.label || d.month),
      datasets: [
        { label: 'જમા (Hapto)',   data: trendData.map(d => d.hapto || 0), borderColor: '#10b981', fill: false, tension: 0.3 },
        { label: 'ઉપાડ (Upad)',   data: trendData.map(d => d.upad || 0),   borderColor: '#ef4444', fill: false, tension: 0.3 },
        { label: 'વ્યાજ (Vyaj)',  data: trendData.map(d => d.vyaj || 0),  borderColor: '#f59e0b', fill: false, tension: 0.3 },
      ]
    };
    return (
      <div className="mt-4">
        <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } } } }} />
        <button className="btn btn-primary btn-sm mt-3" onClick={handlePrint}>Print / PDF</button>
      </div>
    );
  };

  return (
    <div className="reports-page">
      <style>{`
        @media print { .no-print { display: none !important; } .print-btn { display: none !important; } }
        .skeleton { background-color: #e9ecef; border-radius: 4px; min-height: 100px; }
      `}</style>
      <h4 className="fw-bold mb-4">રિપોર્ટ્સ (Reports)</h4>
      <ul className="nav nav-tabs no-print mb-3">
        <li className="nav-item">
          <button className={`nav-link ${reportType === 'monthly' ? 'active' : ''}`} onClick={() => setReportType('monthly')}>Monthly</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${reportType === 'yearly' ? 'active' : ''}`} onClick={() => setReportType('yearly')}>Yearly</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${reportType === 'member' ? 'active' : ''}`} onClick={() => setReportType('member')}>Member</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${reportType === 'trend' ? 'active' : ''}`} onClick={() => setReportType('trend')}>Trend</button>
        </li>
      </ul>
      <div className="no-print mb-3">
        {reportType === 'monthly' && (
          <input type="month" className="form-control" value={month} onChange={e => setMonth(e.target.value)} style={{ maxWidth: 200 }} />
        )}
        {reportType === 'yearly' && (
          <input type="number" className="form-control" value={year} onChange={e => setYear(e.target.value)} style={{ maxWidth: 120 }} />
        )}
        {reportType === 'member' && (
          <select className="form-select" value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} style={{ maxWidth: 250 }}>
            {members.map(m => (
              <option key={m._id} value={m._id}>{m.name} ({m.fataNo})</option>
            ))}
          </select>
        )}
      </div>
      {loading ? <Skeleton /> : (
        <>
          {reportType === 'monthly' && renderMonthlyReport()}
          {reportType === 'yearly' && renderYearlyReport()}
          {reportType === 'member' && renderMemberLedger()}
          {reportType === 'trend' && renderTrend()}
        </>
      )}
    </div>
  );
};

export default ReportsPage;