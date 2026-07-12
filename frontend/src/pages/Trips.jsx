import { useEffect, useState } from 'react';
import api from '../api/axios';

const empty = { source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '', revenue: '' };

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completing, setCompleting] = useState(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: '', fuelConsumed: '', fuelCost: '' });

  const load = async () => {
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/trips'),
        api.get('/vehicles/available'),
        api.get('/drivers/available'),
      ]);
      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),
        cargoWeight: Number(form.cargoWeight),
        plannedDistance: Number(form.plannedDistance),
        revenue: Number(form.revenue) || 0,
      };
      await api.post('/trips', payload);
      setSuccess('Trip created as Draft');
      setForm(empty);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip');
    }
  };

  const dispatchTrip = async (id) => {
    setError(''); setSuccess('');
    try {
      await api.put(`/trips/${id}/dispatch`);
      setSuccess('Trip dispatched');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch trip');
    }
  };

  const cancelTrip = async (id) => {
    if (!window.confirm('Cancel this trip?')) return;
    setError(''); setSuccess('');
    try {
      await api.put(`/trips/${id}/cancel`);
      setSuccess('Trip cancelled');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel trip');
    }
  };

  const openComplete = (trip) => {
    setCompleting(trip);
    setCompleteForm({ finalOdometer: trip.vehicle?.odometer || '', fuelConsumed: '', fuelCost: '' });
  };

  const submitComplete = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.put(`/trips/${completing.id}/complete`, {
        finalOdometer: Number(completeForm.finalOdometer),
        fuelConsumed: Number(completeForm.fuelConsumed),
        fuelCost: Number(completeForm.fuelCost) || 0,
      });
      setSuccess('Trip completed');
      setCompleting(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete trip');
    }
  };

  return (
    <div>
      <h1>Trip Management</h1>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="card">
        <h3>Create Trip (Draft)</h3>
        <form className="inline-form" onSubmit={handleCreate}>
          <div className="field"><label>Source</label>
            <input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          </div>
          <div className="field"><label>Destination</label>
            <input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </div>
          <div className="field"><label>Vehicle (Available)</label>
            <select required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name} (max {v.maxLoadCapacity}kg)</option>)}
            </select>
          </div>
          <div className="field"><label>Driver (Available)</label>
            <select required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
              <option value="">Select driver</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.licenseCategory})</option>)}
            </select>
          </div>
          <div className="field"><label>Cargo Weight (kg)</label>
            <input required type="number" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} />
          </div>
          <div className="field"><label>Planned Distance (km)</label>
            <input required type="number" value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })} />
          </div>
          <div className="field"><label>Revenue (optional)</label>
            <input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} />
          </div>
          <button className="primary" type="submit">Create Trip</button>
        </form>
      </div>

      {completing && (
        <div className="card">
          <h3>Complete Trip #{completing.id} ({completing.source} → {completing.destination})</h3>
          <form className="inline-form" onSubmit={submitComplete}>
            <div className="field"><label>Final Odometer</label>
              <input required type="number" value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })} />
            </div>
            <div className="field"><label>Fuel Consumed (L)</label>
              <input required type="number" value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} />
            </div>
            <div className="field"><label>Fuel Cost</label>
              <input type="number" value={completeForm.fuelCost} onChange={(e) => setCompleteForm({ ...completeForm, fuelCost: e.target.value })} />
            </div>
            <button className="primary" type="submit">Confirm Completion</button>
            <button type="button" className="secondary" onClick={() => setCompleting(null)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Route</th><th>Vehicle</th><th>Driver</th><th>Cargo (kg)</th><th>Distance</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.source} → {t.destination}</td>
                <td>{t.vehicle?.registrationNumber || '-'}</td>
                <td>{t.driver?.name || '-'}</td>
                <td>{t.cargoWeight}</td>
                <td>{t.actualDistance ?? t.plannedDistance} km</td>
                <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                <td>
                  {t.status === 'Draft' && <button className="small success" onClick={() => dispatchTrip(t.id)}>Dispatch</button>}
                  {t.status === 'Dispatched' && <button className="small success" onClick={() => openComplete(t)}>Complete</button>}
                  {['Draft', 'Dispatched'].includes(t.status) && <button className="small danger" onClick={() => cancelTrip(t.id)}>Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
