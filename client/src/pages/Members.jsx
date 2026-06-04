import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchMembers, createMember, updateMember, deleteMember } from '../features/members/memberSlice';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh } from 'react-icons/md';

const emptyForm = { fataNo: '', name: '', mobile: '', email: '', familyGroup: '', openingBalance: 0 };

const Members = () => {
  const dispatch = useDispatch();
  const { list: members, total, loading } = useSelector(s => s.members);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchMembers({ limit: 200 }));
  }, [dispatch]);

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m) => { setEditId(m._id); setForm({ fataNo: m.fataNo, name: m.name, mobile: m.mobile, email: m.email || '', familyGroup: m.familyGroup || '', openingBalance: m.openingBalance || 0 }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    let res;
    if (editId) {
      res = await dispatch(updateMember({ id: editId, body: form }));
      if (!res.error) toast.success('સભ્ય સુધાર્યો! (Member updated!)');
    } else {
      res = await dispatch(createMember(form));
      if (!res.error) toast.success('નવો સભ્ય ઉમેર્યો! (Member added!)');
    }
    if (res.error) toast.error(res.payload);
    else setShowModal(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`શું તમે "${name}" ને કાઢી નાખવા માંગો છો?`)) return;
    const res = await dispatch(deleteMember(id));
    if (!res.error) toast.success('સભ્ય કાઢ્યો! (Member deleted)');
    else toast.error(res.payload);
  };

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.mobile?.includes(search) ||
    m.fataNo?.includes(search) ||
    m.memberId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0">👥 સભ્ય વ્યવસ્થાપન (Members)</h4>
          <small className="text-muted">કુલ {total} સભ્ય</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => dispatch(fetchMembers({ limit: 200 }))}>
            <MdRefresh /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <MdAdd /> નવો સભ્ય
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-3 p-3">
        <div className="input-group">
          <span className="input-group-text bg-transparent"><MdSearch /></span>
          <input type="text" className="form-control border-start-0" placeholder="નામ, ખાતા નં., મોબાઈલ..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ખાતા નં.</th>
                <th>Member ID</th>
                <th>સભ્ય નામ (Name)</th>
                <th>મોબાઈલ</th>
                <th>ઈમેઈલ</th>
                <th>ઓ.બૅ. (Opening Bal)</th>
                <th>સ્થિતિ</th>
                <th>ક્રિયા</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-4 text-muted">કોઈ સભ્ય મળ્યો નથી</td></tr>
              ) : filtered.map(m => (
                <tr key={m._id}>
                  <td className="fw-semibold">{m.fataNo}</td>
                  <td><span className="badge bg-light text-dark">{m.memberId || '—'}</span></td>
                  <td>
                    <div className="fw-semibold">{m.name}</div>
                    {m.familyGroup && <small className="text-muted">👨‍👩‍👧 {m.familyGroup}</small>}
                  </td>
                  <td>{m.mobile}</td>
                  <td className="text-muted small">{m.email || '—'}</td>
                  <td>₹{Number(m.openingBalance || 0).toLocaleString('en-IN')}</td>
                  <td><span className={`badge ${m.isActive ? 'bg-success' : 'bg-secondary'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(m)} title="Edit"><MdEdit /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m._id, m.name)} title="Delete"><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editId ? '✏️ સભ્ય સુધારો' : '➕ નવો સભ્ય ઉમેરો'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">ખાતા નં. (Fata No) *</label>
                      <input type="text" className="form-control" required value={form.fataNo} onChange={e => setForm({...form, fataNo: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">સભ્ય નામ (Name) *</label>
                      <input type="text" className="form-control" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">મોબાઈલ (Mobile) *</label>
                      <input type="tel" className="form-control" required value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">ઈમેઈલ (Email)</label>
                      <input type="email" className="form-control" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">ફૅમિલી ગ્રૂપ (Family Group)</label>
                      <input type="text" className="form-control" placeholder="e.g. Dhameliya Family" value={form.familyGroup} onChange={e => setForm({...form, familyGroup: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">ઓપ. બૅલેન્સ (Opening Balance)</label>
                      <input type="number" className="form-control" value={form.openingBalance} onChange={e => setForm({...form, openingBalance: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>રદ</button>
                  <button type="submit" className="btn btn-primary">💾 સેવ કરો</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
