import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Reports() {
  const [report, setReport] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/reports/vehicles');
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    }
  };

  useEffect(() => { load(); }, []);

  const exportCsv = async () => {
    try {
      const res = await api.get('/reports/vehicles/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transitops_vehicle_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  return (
    <div>
      <h1>Reports & Analytics</h1>
      {error && <div className="error-msg">{error}</div>}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Per-Vehicle Operational Report</h3>
          <button className="primary" onClick={exportCsv}>Export CSV</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Reg. No.</th><th>Name</th><th>Distance (km)</th><th>Fuel (L)</th><th>Fuel Efficiency (km/L)</th>
              <th>Fuel Cost</th><th>Maintenance Cost</th><th>Operational Cost</th><th>Revenue</th><th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {report.map((r) => (
              <tr key={r.vehicleId}>
                <td>{r.registrationNumber}</td>
                <td>{r.name}</td>
                <td>{r.totalDistance}</td>
                <td>{r.totalFuelLiters}</td>
                <td>{r.fuelEfficiency}</td>
                <td>{r.totalFuelCost}</td>
                <td>{r.totalMaintenanceCost}</td>
                <td>{r.operationalCost}</td>
                <td>{r.totalRevenue}</td>
                <td>{(r.roi * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
