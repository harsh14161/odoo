import { useEffect, useState } from 'react';
import api from '../api/axios';

const empty = { vehicleId: '', description: '', cost: '', date: new Date().toISOString().slice(0, 10) };

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([api.get('/maintenance'), api.get('/vehicles')]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data.filter((v) => v.status !== 'On Trip'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load maintenance data');
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/maintenance', { ...form, vehicleId: Number(form.vehicleId), cost: Number(form.cost) || 0 });
      setSuccess('Maintenance record created — vehicle moved to In Shop');
      setForm(empty);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create maintenance record');
    }
  };

  const closeLog = async (id) => {
    setError(''); setSuccess('');
    try {
      await api.put(`/maintenance/${id}/close`);
      setSuccess('Maintenance closed — vehicle restored to Available');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close maintenance record');
    }
  };

  return (
    <div>
      <h1>Maintenance</h1>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="card">
        <h3>New Maintenance Record</h3>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field"><label>Vehicle</label>
            <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name} ({v.status})</option>)}
            </select>
          </div>
          <div className="field"><label>Description</label>
            <input required placeholder="e.g. Oil Change" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="field"><label>Cost</label>
            <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <div className="field"><label>Date</label>
            <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <button className="primary" type="submit">Log Maintenance</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>ID</th><th>Vehicle</th><th>Description</th><th>Cost</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.vehicle?.registrationNumber || '-'}</td>
                <td>{l.description}</td>
                <td>{l.cost}</td>
                <td>{l.date}</td>
                <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                <td>{l.status === 'Active' && <button className="small success" onClick={() => closeLog(l.id)}>Close (Restore Vehicle)</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
