import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadMembers, addMember, editMember, removeMember } from '../redux/slices/memberSlice.js';

const MembersPage = () => {
  const dispatch = useDispatch();
  const members = useSelector((s) => s.members.list);
  const loading = useSelector((s) => s.members.loading);
  const error = useSelector((s) => s.members.error);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ _id: null, name: '', mobile: '', email: '', fataNo: '' });

  useEffect(() => {
    dispatch(loadMembers());
  }, [dispatch]);

  const openAdd = () => {
    setFormData({ _id: null, name: '', mobile: '', email: '', fataNo: '' });
    setShowModal(true);
  };

  const openEdit = (member) => {
    setFormData({
      _id: member._id,
      name: member.name || '',
      mobile: member.mobile || '',
      email: member.email || '',
      fataNo: member.fataNo || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData._id) {
      dispatch(editMember({ id: formData._id, data: formData }));
    } else {
      dispatch(addMember(formData));
    }
    setShowModal(false);
  };

  const handleDelete = (id, name) => {
    if (window.confirm('Delete ' + name + '?')) {
      dispatch(removeMember(id));
    }
  };

  const filtered = members.filter((m) =>
    (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.mobile && m.mobile.includes(searchTerm)) ||
    (m.fataNo && m.fataNo.includes(searchTerm))
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0">સભ્યો (Members)</h4>
          <small className="text-muted">કુલ {filtered.length} સભ્ય</small>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          નવો સભ્ય ઉમેરો (Add Member)
        </button>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm mb-3 p-3">
        <div className="input-group">
          <span className="input-group-text bg-transparent">🔍</span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="નામ, મોબાઈલ, ખાતા નં. માં શોધો..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ખાતા નં.</th>
                <th>નામ (Name)</th>
                <th>મોબાઈલ</th>
                <th>ઈમેઈલ</th>
                <th>ક્રિયા</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4"><div className="spinner-border spinner-border-sm" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-muted">કોઈ સભ્ય મળ્યો નથી</td></tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m._id}>
                    <td className="fw-semibold">{m.fataNo}</td>
                    <td>{m.name}</td>
                    <td>{m.mobile}</td>
                    <td className="text-muted small">{m.email || '—'}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(m)} title="Edit">✏️</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m._id, m.name)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{formData._id ? 'સભ્ય સુધારો' : 'નવો સભ્ય ઉમેરો'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">ખાતા નં. *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.fataNo}
                      onChange={(e) => setFormData({ ...formData, fataNo: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">નામ *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">મોબાઈલ *</label>
                    <input
                      type="tel"
                      className="form-control"
                      required
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">ઈમેઈલ</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>રદ</button>
                  <button type="submit" className="btn btn-primary">સેવ કરો</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;