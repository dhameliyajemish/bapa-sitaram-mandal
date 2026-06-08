import React from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const Reports = () => {
  const { list: transactions } = useSelector(s => s.transactions);
  const { list: members } = useSelector(s => s.members);

  const exportCSV = () => {
    const headers = ['Member,Account No,Type,Amount,Month,Date,Note'];
    const rows = transactions.map(t => [
      t.memberId?.name || '',
      t.memberId?.fataNo || '',
      t.type,
      t.amount,
      t.month,
      new Date(t.date).toLocaleDateString(),
      t.note || '',
    ].join(','));
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `mandal_transactions_${Date.now()}.csv`; a.click();
    toast.success('CSV Export ready!');
  };

  const memberSummary = members.map(m => {
    const mtxs = transactions.filter(t => (t.memberId?._id || t.memberId) === m._id);
    const deposit = mtxs.filter(t=>t.type==='deposit').reduce((s,t)=>s+t.amount,0);
    const withdraw = mtxs.filter(t=>t.type==='withdraw').reduce((s,t)=>s+t.amount,0);
    const interest = mtxs.filter(t=>t.type==='interest').reduce((s,t)=>s+t.amount,0);
    const penalty = mtxs.filter(t=>t.type==='penalty').reduce((s,t)=>s+t.amount,0);
    return { ...m, deposit, withdraw, interest, penalty, net: deposit - withdraw + interest - penalty };
  }).filter(m => m.deposit + m.withdraw + m.interest + m.penalty > 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold mb-0">📋 રિપોર્ટ્સ (Reports)</h4>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-success btn-sm" onClick={exportCSV}>
            📊 CSV Export
          </button>
        </div>
      </div>

      {/* Member-wise Summary */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent fw-bold">👥 સભ્ય મુજબ સારાંશ (Member-wise Summary)</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ખાતા નં.</th>
                <th>સભ્ય નામ</th>
                <th className="text-success">જમા (Deposit)</th>
                <th className="text-danger">ઉપાડ (Withdraw)</th>
                <th className="text-primary">વ્યાજ (Interest)</th>
                <th className="text-warning">દંડ (Penalty)</th>
                <th>ચોખ્ખો (Net)</th>
              </tr>
            </thead>
            <tbody>
              {memberSummary.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted">ડેટા નથી</td></tr>
              ) : memberSummary.map(m => (
                <tr key={m._id}>
                  <td>{m.fataNo}</td>
                  <td className="fw-semibold">{m.name}</td>
                  <td className="text-success">+{fmt(m.deposit)}</td>
                  <td className="text-danger">-{fmt(m.withdraw)}</td>
                  <td className="text-primary">+{fmt(m.interest)}</td>
                  <td className="text-warning">-{fmt(m.penalty)}</td>
                  <td className={`fw-bold ${m.net >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(m.net)}</td>
                </tr>
              ))}
            </tbody>
            {memberSummary.length > 0 && (
              <tfoot className="table-secondary fw-bold">
                <tr>
                  <td colSpan="2">Grand Total</td>
                  <td className="text-success">+{fmt(memberSummary.reduce((s,m)=>s+m.deposit,0))}</td>
                  <td className="text-danger">-{fmt(memberSummary.reduce((s,m)=>s+m.withdraw,0))}</td>
                  <td className="text-primary">+{fmt(memberSummary.reduce((s,m)=>s+m.interest,0))}</td>
                  <td className="text-warning">-{fmt(memberSummary.reduce((s,m)=>s+m.penalty,0))}</td>
                  <td className={memberSummary.reduce((s,m)=>s+m.net,0) >= 0 ? 'text-success' : 'text-danger'}>
                    {fmt(memberSummary.reduce((s,m)=>s+m.net,0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;
