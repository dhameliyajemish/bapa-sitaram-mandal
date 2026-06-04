import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { loadMembers } from '../redux/slices/memberSlice.js';
import { loadEntries, addEntryThunk, deleteEntryThunk } from '../redux/slices/entrySlice.js';
import helpers from '../utils/helpers';

const MonthlyEntry = () => {
  const dispatch    = useDispatch();
  const { list: members, loading: membersLoading } = useSelector(s => s.members);
  const { list: entries, loading: entriesLoading }   = useSelector(s => s.entries);

  const [selectedMonth, setSelectedMonth] = useState(helpers.getCurrentMonth());
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    memberId: '', month: helpers.getCurrentMonth(),
    hapto: '', upad: '', vyaj: '', dand: ''
  });

  /* ── computed ─────────────────────────────── */
  const filteredEntries = entries.filter(e => e.month === selectedMonth);
  const searchedEntries = filteredEntries.filter(e => {
    const memberIdStr = e.memberId?._id || e.memberId;
    const m = members.find(mem => mem._id === memberIdStr) || (e.memberId && typeof e.memberId === 'object' ? e.memberId : null);
    return (
      (m?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m?.fataNo || '').includes(searchTerm) ||
      (m?.mobile || '').includes(searchTerm)
    );
  });

  const sumHapto = filteredEntries.reduce((s, e) => s + Number(e.hapto || 0), 0);
  const sumUpad  = filteredEntries.reduce((s, e) => s + Number(e.upad  || 0), 0);
  const sumVyaj  = filteredEntries.reduce((s, e) => s + Number(e.vyaj  || 0), 0);
  const sumDand  = filteredEntries.reduce((s, e) => s + Number(e.dand  || 0), 0);

  const calcTotal = (e) => Number(e.hapto || 0) - Number(e.upad || 0) + Number(e.vyaj || 0) + Number(e.dand || 0);
  const netTotal  = sumHapto - sumUpad + sumVyaj + sumDand;

  /* ── effects ───────────────────────────────── */
  useEffect(() => {
    dispatch(loadMembers());
    dispatch(loadEntries());
  }, [dispatch]);

  useEffect(() => {
    if (selectedMonth && entries.length === 0) {
      dispatch(loadEntries());
    }
  }, [selectedMonth, dispatch]);

  /* ── handlers ──────────────────────────────── */
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addEntryThunk({
        ...formData,
        hapto: Number(formData.hapto) || 0,
        upad:  Number(formData.upad)  || 0,
        vyaj:  Number(formData.vyaj)  || 0,
        dand:  Number(formData.dand)  || 0,
      })).unwrap();
      toast.success('એન્ટ્રી સફળતાપૂર્વક સેવ થઈ! (Entry saved!)');
      setShowModal(false);
      setFormData({ memberId: '', month: selectedMonth, hapto: '', upad: '', vyaj: '', dand: '' });
    } catch { toast.error('સેવ કરવામાં ભૂલ આવી (Save failed)'); }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('શું તમે આ એન્ટ્રી કાઢી નાખવા માંગો છો?')) return;
    try {
      await dispatch(deleteEntryThunk(id)).unwrap();
      toast.success('એન્ટ્રీ કાઢી નાખવામાં આવી!');
    } catch { toast.error('કાઢી નાખવામાં ભૂલ આવી'); }
  };

  const handleSendWhatsApp = (member, entry) => {
    const text =
`નમસ્તે ${member.name},
તમારો ${entry.month} નો રીપોર્ટ:
હપ્તો: ₹${entry.hapto}
ઉપાડ: ₹${entry.upad}
વ્યાજ: ₹${entry.vyaj || 0}
દંડ: ₹${entry.dand}
કુલ: ₹${calcTotal(entry)}

આભાર,
બાપા સીતારામ મંડળ`;
    window.open(`https://wa.me/91${member.mobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintReceipt = (entry, member) => {
    const total = calcTotal(entry);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>રિસીપ્ટ</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Hind+Vadodara:wght@400;700');body{font-family:'Hind Vadodara',sans-serif;margin:30px;color:#000;background:#fff}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:8px;font-size:14px}
      tfoot td{background:#f8fafc;font-weight:bold;font-size:16px;color:#4f46e5}</style></head>
      <body onload="setTimeout(()=>{window.print();setTimeout(()=>window.close(),300)},200)">
      <h1 style="text-align:center;color:#4f46e5;margin:0">બાપા સીતારામ મંડળ</h1>
      <p style="text-align:center;margin:4px 0;color:#666">માસિક એન્ટ્રી રિપોર્ટ</p>
      <p style="font-size:14px"><strong>ખાતા નં.:</strong> ${member.fataNo} &nbsp;&nbsp; <strong>નામ:</strong> ${member.name} &nbsp;&nbsp; <strong>મહિનો:</strong> ${entry.month}</p>
      <table><tr><td>હપ્તો (Collection)</td><td>₹${entry.hapto}</td></tr>
      <tr><td>ઉપાડ (Withdrawal)</td><td>₹${entry.upad}</td></tr>
      <tr><td>વ્યાજ (Interest)</td><td>₹${entry.vyaj || 0}</td></tr>
      <tr><td>દંડ (Penalty)</td><td>₹${entry.dand}</td></tr>
      <tfoot><tr><td colspan="2">કુલ (Total)&nbsp;&nbsp;&nbsp; ₹${total}</td></tr></tfoot></table>
      <p style="text-align:center;font-size:12px;color:#888;margin-top:30px">આ કોમ્પ્યુટર દ્વારા જનરેટ થયેલ છે. &nbsp;|&nbsp; બાપા સીતારામ મંડળ &nbsp;|&nbsp; મંડળ નં. ૩૬</p></body></html>`);
    w.document.close();
  };

  /* ── member list for select ─────────────────── */
  const memberOptions = members.filter(m =>
    !searchTerm || m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.fataNo?.includes(searchTerm)
  );

  return (
    <div>
      {/* Page header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2 className="mb-0">માસિક એન્ટ્રી (Monthly Entry)</h2>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setFormData({ ...formData, month: selectedMonth }); }}><i className="bi bi-plus-lg"></i> નવી એન્ટ્રી</button>
      </div>

      {/* Month picker + search */}
      <div className="card p-3 mb-4 d-flex flex-wrap gap-3 align-items-center">
        <div className="d-flex align-items-center gap-2">
          <label className="mb-0 fw-semibold">મહિનો:</label>
          <input type="month" className="form-control w-auto" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
        </div>
        <div className="input-group w-auto" style={{ maxWidth: 280 }}>
          <span className="input-group-text"><i className="bi bi-search"></i></span>
          <input type="text" className="form-control" placeholder="નામ / ખાતા નં / મોબાઈલ શોધો" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="row row-cols-2 row-cols-md-5 g-3 mb-4">
        {[
          { label: 'હપ્તો', value: sumHapto, cls: 'text-primary' },
          { label: 'ઉપાડ',  value: sumUpad,  cls: 'text-danger'  },
          { label: 'વ્યાજ', value: sumVyaj,  cls: 'text-warning' },
          { label: 'દંડ',   value: sumDand,  cls: 'text-danger'  },
          { label: 'નેટ ટોટલ', value: netTotal, cls: 'text-success' },
        ].map((s, i) => (
          <div className="col" key={i}>
            <div className="card h-100 p-3 border-0 shadow-sm bg-white">
              <small className="text-muted">{s.label}</small>
              <div className={`fw-bold fs-3 ${s.cls}`}>{helpers.fmt(s.value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Entries table */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>ખાતા નં.</th><th>નામ</th><th>હપ્તો</th><th>ઉપાડ</th><th>વ્યાજ</th><th>દંડ</th><th>કુલ</th><th>ક્રિયા</th>
                </tr>
              </thead>
              <tbody>
                {searchedEntries.map(entry => {
                  const memberIdStr = entry.memberId?._id || entry.memberId;
                  const member = members.find(m => m._id === memberIdStr) || (entry.memberId && typeof entry.memberId === 'object' ? entry.memberId : null);
                  if (!member) return null;
                  const total = calcTotal(entry);
                  return (
                    <tr key={entry._id}>
                      <td>{member.fataNo}</td><td>{member.name}</td>
                      <td>₹{entry.hapto}</td><td>₹{entry.upad}</td>
                      <td>₹{entry.vyaj || 0}</td><td>₹{entry.dand}</td>
                      <td className="fw-bold">₹{total}</td>
                      <td className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handlePrintReceipt(entry, member)} title="PDF">
                            <i className="bi bi-download"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-success" onClick={() => handleSendWhatsApp(member, entry)} title="WhatsApp">
                            <i className="bi bi-whatsapp"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteEntry(entry._id)} title="હટાવો">
                            <i className="bi bi-trash"></i>
                          </button>
                      </td>
                    </tr>
                  );
                })}
                {!searchedEntries.length && (
                  <tr><td colSpan="8" className="text-center py-4 text-muted">આ મહિના માટે કોઈ એન્ટ્રી નથી</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showModal &&
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>નવી માસિક એન્ટ્રી</h4>
              <button className="btn btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">સભ્ય પસંદ કરો *</label>
                  <select className="form-select" required value={formData.memberId}
                    onChange={e => setFormData({ ...formData, memberId: e.target.value })}>
                    <option value="">-- પસંદ કરો --</option>
                    {members.map(m => (<option key={m._id} value={m._id}>{m.fataNo} – {m.name}</option>))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">મહિનો *</label>
                  <input type="month" className="form-control" required value={formData.month}
                    onChange={e => setFormData({ ...formData, month: e.target.value })} />
                </div>
                <div className="row g-3">
                  {[['hapto','હપ્તો (Collection)'],['upad','ઉપાડ (Withdrawal)'],['vyaj','વ્યાજ (Interest)'],['dand','દંડ (Penalty)']].map(([f,l]) =>
                    <div className="col-6" key={f}>
                      <label className="form-label">{l}</label>
                      <input type="number" className="form-control" min="0" step="0.01"
                        value={formData[f]}
                        onChange={e => setFormData({ ...formData, [f]: e.target.value })} />
                    </div>
                  )}
                </div>
                <div className="mt-3 p-3 bg-light rounded text-end fw-bold">
                  કુલ: ₹{Number(formData.hapto || 0) - Number(formData.upad || 0) + Number(formData.vyaj || 0) + Number(formData.dand || 0)}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>રદ કરો</button>
                <button type="submit" className="btn btn-primary">સેવ કરો</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  );
};

export default MonthlyEntry;
