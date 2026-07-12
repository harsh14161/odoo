import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const empty = { registrationNumber: '', name: '', type: 'Van', maxLoadCapacity: '', odometer: 0, acquisitionCost: '', region: '' };

export default function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = ['fleet_manager', 'admin'].includes(user?.role);

  const load = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vehicles');
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const payload = { ...form, maxLoadCapacity: Number(form.maxLoadCapacity), odometer: Number(form.odometer), acquisitionCost: Number(form.acquisitionCost) };
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, payload);
        setSuccess('Vehicle updated');
      } else {
        await api.post('/vehicles', payload);
        setSuccess('Vehicle created');
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (v) => {
    setEditingId(v.id);
    setForm({
      registrationNumber: v.registrationNumber, name: v.name, type: v.type,
      maxLoadCapacity: v.maxLoadCapacity, odometer: v.odometer, acquisitionCost: v.acquisitionCost, region: v.region || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const setStatus = async (v, status) => {
    try {
      await api.put(`/vehicles/${v.id}`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div>
      <h1>Vehicle Registry</h1>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {canManage && (
        <div className="card">
          <h3>{editingId ? 'Edit Vehicle' : 'Register New Vehicle'}</h3>
          <form className="inline-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Registration Number</label>
              <input required value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
            </div>
            <div className="field">
              <label>Name / Model</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Van</option><option>Truck</option><option>Car</option><option>Bus</option>
              </select>
            </div>
            <div className="field">
              <label>Max Load Capacity (kg)</label>
              <input required type="number" value={form.maxLoadCapacity} onChange={(e) => setForm({ ...form, maxLoadCapacity: e.target.value })} />
            </div>
            <div className="field">
              <label>Odometer</label>
              <input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
            </div>
            <div className="field">
              <label>Acquisition Cost</label>
              <input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} />
            </div>
            <div className="field">
              <label>Region</label>
              <input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
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
              <th>Reg. No.</th><th>Name</th><th>Type</th><th>Max Load</th><th>Odometer</th><th>Region</th><th>Status</th>{canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.registrationNumber}</td>
                <td>{v.name}</td>
                <td>{v.type}</td>
                <td>{v.maxLoadCapacity} kg</td>
                <td>{v.odometer}</td>
                <td>{v.region || '-'}</td>
                <td><span className={`badge ${v.status.replace(' ', '')}`}>{v.status}</span></td>
                {canManage && (
                  <td>
                    <button className="small" onClick={() => handleEdit(v)}>Edit</button>
                    {v.status !== 'Retired' && <button className="small danger" onClick={() => setStatus(v, 'Retired')}>Retire</button>}
                    <button className="small danger" onClick={() => handleDelete(v.id)}>Delete</button>
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
