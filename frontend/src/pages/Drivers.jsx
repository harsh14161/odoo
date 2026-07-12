import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const empty = { name: '', licenseNumber: '', licenseCategory: 'B', licenseExpiry: '', contactNumber: '', safetyScore: 100 };

export default function Drivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = ['safety_officer', 'fleet_manager', 'admin'].includes(user?.role);

  const load = async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load drivers');
    }
  };

  useEffect(() => { load(); }, []);

  const isExpired = (d) => new Date(d.licenseExpiry) < new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const payload = { ...form, safetyScore: Number(form.safetyScore) };
      if (editingId) {
        await api.put(`/drivers/${editingId}`, payload);
        setSuccess('Driver updated');
      } else {
        await api.post('/drivers', payload);
        setSuccess('Driver created');
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (d) => {
    setEditingId(d.id);
    setForm({
      name: d.name, licenseNumber: d.licenseNumber, licenseCategory: d.licenseCategory,
      licenseExpiry: d.licenseExpiry, contactNumber: d.contactNumber || '', safetyScore: d.safetyScore,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const setStatus = async (d, status) => {
    try {
      await api.put(`/drivers/${d.id}`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div>
      <h1>Driver Management</h1>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {canManage && (
        <div className="card">
          <h3>{editingId ? 'Edit Driver' : 'Register New Driver'}</h3>
          <form className="inline-form" onSubmit={handleSubmit}>
            <div className="field"><label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field"><label>License Number</label>
              <input required value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </div>
            <div className="field"><label>License Category</label>
              <select value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                <option>A</option><option>B</option><option>C</option><option>D</option>
              </select>
            </div>
            <div className="field"><label>License Expiry</label>
              <input required type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
            </div>
            <div className="field"><label>Contact Number</label>
              <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </div>
            <div className="field"><label>Safety Score</label>
              <input type="number" min="0" max="100" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} />
            </div>
            <button className="primary" type="submit">{editingId ? 'Update' : 'Register'}</button>
            {editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>License No.</th><th>Category</th><th>Expiry</th><th>Safety Score</th><th>Status</th>{canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.licenseNumber}</td>
                <td>{d.licenseCategory}</td>
                <td style={{ color: isExpired(d) ? '#c0392b' : 'inherit', fontWeight: isExpired(d) ? 600 : 400 }}>
                  {d.licenseExpiry} {isExpired(d) && '(Expired)'}
                </td>
                <td>{d.safetyScore}</td>
                <td><span className={`badge ${d.status.replace(' ', '')}`}>{d.status}</span></td>
                {canManage && (
                  <td>
                    <button className="small" onClick={() => handleEdit(d)}>Edit</button>
                    {d.status !== 'Suspended'
                      ? <button className="small danger" onClick={() => setStatus(d, 'Suspended')}>Suspend</button>
                      : <button className="small success" onClick={() => setStatus(d, 'Available')}>Reinstate</button>}
                    <button className="small danger" onClick={() => handleDelete(d.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
