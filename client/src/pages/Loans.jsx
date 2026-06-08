import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { loadMembers } from '../redux/slices/memberSlice.js';
import { loadLoans, loadLoanStats, addLoanThunk, updateLoanThunk, removeLoanThunk } from '../redux/slices/loanSlice.js';
import helpers from '../utils/helpers.js';

const LoansPage = () => {
  const dispatch = useDispatch();
  const { list: loans, stats, loading } = useSelector(s => s.loans);
  const { list: members }               = useSelector(s => s.members);

  const [search, setSearch] = useState('');
  const [filterSt, setFilterSt] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ memberId: '', amount: '', interestRate: 12, termMonths: '', paidAmount: 0, status: 'Active', notes: '' });
  const [showPay, setShowPay] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [payAmt, setPayAmt] = useState('');

  useEffect(() => { dispatch(loadMembers()); dispatch(loadLoans()); dispatch(loadLoanStats()); }, [dispatch]);

  
  const statCards = [
    { label: 'કુલ લોન (Total Loans)',  value: stats?.totalLoaned    || 0, cls: 'text-primary' },
    { label: 'ચુકવણી (Total Paid)',    value: stats?.totalPaid      || 0, cls: 'text-success' },
    { label: 'બાકી (Remaining)',        value: stats?.remainingTotal || 0, cls: 'text-danger'  },
    { label: 'એક્ટિવ લોન (Active)',     value: stats?.activeLoans    || 0, cls: 'text-warning' },
  ];

  
  const filtered = (loans && Array.isArray(loans) ? loans : []).filter(l => {
    const memberIdStr = l.memberId?._id || l.memberId;
    const m = (members && Array.isArray(members) ? members : []).find(mem => mem._id === memberIdStr) || (l.memberId && typeof l.memberId === 'object' ? l.memberId : null);
    const nameOk  = !search || (m?.name || '').toLowerCase().includes(search.toLowerCase()) || (m?.fataNo || '').includes(search) || (l.loanNumber || '').toLowerCase().includes(search.toLowerCase());
    const statOk  = !filterSt   || l.status === filterSt;
    return nameOk && statOk;
  });

  
  const calcEMI = () => {
    const P   = Number(form.amount)         || 0;
    const rate = Number(form.interestRate)   || 0;
    const n   = Number(form.termMonths)     || 0;
    if (!P || !n) return 0;
    const r = rate / 12 / 100;
    return r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      amount: +form.amount,
      interestRate: +form.interestRate,
      termMonths: +form.termMonths,
      paidAmount: +form.paidAmount || 0,
    };
    try {
      if (editId) {
        await dispatch(updateLoanThunk({ id: editId, data: payload })).unwrap();
        toast.success('દર્શાવસર માટે સુધારો થયો (Loan updated!)');
      } else {
        await dispatch(addLoanThunk(payload)).unwrap();
        toast.success('લોન બનાવવામાં આવ્યો! (Loan created!)');
      }
      setShowForm(false); setEditId(null);
      setForm({ memberId: '', amount: '', interestRate: 12, termMonths: '', paidAmount: 0, status: 'Active', notes: '' });
    } catch (err) { toast.error(err.message || 'ત્રુટિ'); }
  };

  const handleEdit    = (loan) => {
    setForm({ memberId: loan.memberId?._id || '', amount: loan.amount, interestRate: loan.interestRate, termMonths: loan.termMonths, paidAmount: loan.paidAmount, status: loan.status, notes: loan.notes || '' });
    setEditId(loan._id); setShowForm(true);
  };
  const handleDelete  = async (id) => {
    if (!window.confirm('શું તમે આ લોન કાઢી નાખવા માંગો છો?')) return;
    try { await dispatch(removeLoanThunk(id)).unwrap(); toast.success('લોન કાઢી નાખ્યો!'); }
    catch { toast.error('કાઢી નાખવામાં ભૂલ'); }
  };
  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;
    const newPaid = Number(selectedLoan.paidAmount || 0) + Number(payAmt);
    try {
      await dispatch(updateLoanThunk({ id: selectedLoan._id, data: { paidAmount: newPaid } })).unwrap();
      toast.success('ચુકવણી યાદ્યો! (Payment recorded!)');
      setShowPay(false); setPayAmt('');
    } catch (err) { toast.error(err.message || 'ત્રુટિ'); }
  };

  const statusBadge = {
    Active:        'bg-success',
    'Active':        'bg-success',
    Completed:     'bg-secondary',
    Defaulted:     'bg-danger',
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">લોન મેનેજમેન્ટ (Loans)</h2>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ memberId: '', amount: '', interestRate: 12, termMonths: '', paidAmount: 0, status: 'Active', notes: '' }); setShowForm(true); }}>
          <i className="bi bi-plus-lg"></i> નવો લોન
        </button>
      </div>

      {}
      <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
        {statCards.map((s, i) => (
          <div className="col" key={i}>
            <div className="card h-100 p-3 shadow-sm">
              <small className="text-muted">{s.label}</small>
              <div className={`fw-bold fs-3 ${s.cls}`}>{helpers.fmt(s.value)}</div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="card p-3 mb-4 d-flex flex-wrap gap-3 align-items-center">
        <select className="form-select w-auto" value={filterSt} onChange={e => setFilterSt(e.target.value)}>
          <option value="">બધા સ્ટેટસ (All Status)</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Defaulted">Defaulted</option>
        </select>
        <div className="input-group w-auto" style={{ maxWidth: 280 }}>
          <span className="input-group-text"><i className="bi bi-search"></i></span>
          <input className="form-control" placeholder="નામ / ખાતા નં શોધો" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>લોન નં.</th><th>સભ્ય</th><th>રકમ</th><th>વાર્ષિક વ્યાજ%</th><th>મહિનો</th>
                  <th>EMI</th><th>ચૂકવણી</th><th>બાકી</th><th>સ્ટેટસ</th><th>ક્રિયા</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const memberIdStr = l.memberId?._id || l.memberId;
                  const mem = members.find(m => m._id === memberIdStr) || (l.memberId && typeof l.memberId === 'object' ? l.memberId : null) || {};
                  return (
                    <tr key={l._id}>
                      <td className="fw-bold text-primary">{l.loanNumber}</td>
                      <td>{mem.name}<br/><small className="text-muted">{mem.fataNo}</small></td>
                      <td>{helpers.fmt(l.amount)}</td>
                      <td>{l.interestRate}%</td><td>{l.termMonths}</td>
                      <td className="fw-bold">{helpers.fmt(l.emi)}</td>
                      <td>{helpers.fmt(l.paidAmount)}</td>
                      <td className="fw-bold text-danger">{helpers.fmt(l.remainingBalance)}</td>
                      <td>
                        <span className={`badge ${statusBadge[l.status] || 'bg-secondary'}`}>{l.status}</span>
                      </td>
                      <td className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(l)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-success" onClick={() => { setSelectedLoan(l); setPayAmt(''); setShowPay(true); }} disabled={l.status !== 'Active'}><i className="bi bi-cash"></i></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(l._id)}><i className="bi bi-trash"></i></button>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td colSpan="10" className="text-center py-4 text-muted">કોઈ લોન મળ્યો નથી</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {}
      {showForm &&
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h4>{editId ? 'લોનમાં સુધારો (Edit Loan)' : 'નવો લોન (Add Loan)'}</h4>
              <button className="btn btn-close" onClick={() => setShowForm(false)}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">સભ્ય પસંદ કરો *</label>
                  <select className="form-select" required value={form.memberId}
                    onChange={e => setForm({ ...form, memberId: e.target.value })}>
                    <option value="">-- પસંદ કરો --</option>
                    {(members && Array.isArray(members) ? members : []).map(m => <option key={m._id} value={m._id}>{m.fataNo} – {m.name}</option>)}
                  </select>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label">લોન રકમ *</label>
                    <input type="number" className="form-control" min="0" required value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">વાર્ષિક વ્યાજ % *</label>
                    <input type="number" className="form-control" min="0" step="0.1" required value={form.interestRate}
                      onChange={e => setForm({ ...form, interestRate: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">મુદ્દત (મહિના) *</label>
                    <input type="number" className="form-control" min="1" required value={form.termMonths}
                      onChange={e => setForm({ ...form, termMonths: e.target.value })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">પાછી ચૂકવેલ (Paid)</label>
                    <input type="number" className="form-control" min="0" value={form.paidAmount}
                      onChange={e => setForm({ ...form, paidAmount: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">નોંધો (Notes)</label>
                    <textarea className="form-control" rows="2" value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-info bg-opacity-10 rounded text-end fw-bold text-info">
                  અવતરણ દર (EMI): ₹{calcEMI().toFixed(2)}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">{editId ? 'સુધારો' : 'બનાવો'}</button>
              </div>
            </form>
          </div>
        </div>
      }

      {}
      {showPay &&
        <div className="modal-overlay" onClick={() => setShowPay(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>ચુકવણી (Pay EMI)</h4>
              <button className="btn btn-close" onClick={() => setShowPay(false)}></button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                <p><strong>લોન નં.:</strong> {selectedLoan?.loanNumber}<br />
                   <strong>સભ્ય:</strong> {(() => { const memberIdStr = selectedLoan?.memberId?._id || selectedLoan?.memberId; const m = (members && Array.isArray(members) ? members : []).find(mem => mem._id === memberIdStr) || (selectedLoan?.memberId && typeof selectedLoan.memberId === 'object' ? selectedLoan.memberId : null); return m ? `${m.name} (${m.fataNo})` : '–'; })()}<br />
                   <strong>બાકી EMI:</strong> {helpers.fmt(selectedLoan?.remainingBalance)}</p>
                <div className="mb-3">
                  <label className="form-label">ચુકવણી રકમ *</label>
                  <input type="number" className="form-control" min="0.01" step="0.01" required
                    value={payAmt} onChange={e => setPayAmt(e.target.value)} placeholder="EMI રકમ દાખલ કરો" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPay(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-success">ચૂકવણી નીન્દિત કરો</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  );
};

export default LoansPage;
