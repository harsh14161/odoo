import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [filters, setFilters] = useState({ type: '', status: '', region: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await api.get('/dashboard/kpis', { params });
      setKpis(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load KPIs');
    }
  };

  useEffect(() => { load(); }, [filters]);

  const cards = kpis ? [
    { label: 'Active Vehicles', value: kpis.activeVehicles },
    { label: 'Available Vehicles', value: kpis.availableVehicles },
    { label: 'Vehicles in Maintenance', value: kpis.vehiclesInMaintenance },
    { label: 'Active Trips', value: kpis.activeTrips },
    { label: 'Pending Trips', value: kpis.pendingTrips },
    { label: 'Drivers On Duty', value: kpis.driversOnDuty },
    { label: 'Fleet Utilization (%)', value: `${kpis.fleetUtilization}%` },
  ] : [];

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <div className="error-msg">{error}</div>}
      <div className="filters">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="Van">Van</option>
          <option value="Truck">Truck</option>
          <option value="Car">Car</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="On Trip">On Trip</option>
          <option value="In Shop">In Shop</option>
          <option value="Retired">Retired</option>
        </select>
        <input placeholder="Region" value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
      </div>
      <div className="kpi-grid">
        {cards.map((c) => (
          <div className="kpi-card" key={c.label}>
            <div className="value">{c.value}</div>
            <div className="label">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <p>Welcome to TransitOps. Use the navigation above to manage vehicles, drivers, trips, maintenance, fuel & expenses, and view reports.</p>
      </div>
    </div>
  );
}
