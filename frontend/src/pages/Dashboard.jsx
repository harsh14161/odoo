import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Role-specific lists
  const [driverTrips, setDriverTrips] = useState([]);
  const [safetyDrivers, setSafetyDrivers] = useState([]);
  const [analystExpenses, setAnalystExpenses] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  
  // Driver Trip Completion State
  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: '', fuelConsumed: '', fuelCost: '' });

  const loadDashboard = async () => {
    try {
      const kpisRes = await api.get('/dashboard/kpis');
      setKpis(kpisRes.data);

      if (user.role === 'driver') {
        const tripsRes = await api.get('/trips');
        setDriverTrips(tripsRes.data);
      } else if (user.role === 'safety_officer') {
        const driversRes = await api.get('/drivers');
        // Filter drivers that need attention: suspended, license expiring within 30 days, or score < 90
        const alertDrivers = driversRes.data.filter(d => {
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          const isExpiring = new Date(d.licenseExpiry) <= thirtyDaysFromNow;
          return d.status === 'Suspended' || isExpiring || d.safetyScore < 90;
        });
        setSafetyDrivers(alertDrivers);
      } else if (user.role === 'financial_analyst') {
        const expensesRes = await api.get('/expenses');
        setAnalystExpenses(expensesRes.data.slice(0, 5)); // show top 5 recent expenses
      } else if (user.role === 'admin' || user.role === 'fleet_manager') {
        const tripsRes = await api.get('/trips');
        setRecentTrips(tripsRes.data.slice(0, 5)); // show top 5 recent trips
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  // Driver actions
  const dispatchTrip = async (id) => {
    setError(''); setSuccess('');
    try {
      await api.put(`/trips/${id}/dispatch`);
      setSuccess('Trip dispatched successfully!');
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch trip');
    }
  };

  const cancelTrip = async (id) => {
    if (!window.confirm('Cancel this trip?')) return;
    setError(''); setSuccess('');
    try {
      await api.put(`/trips/${id}/cancel`);
      setSuccess('Trip cancelled successfully.');
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel trip');
    }
  };

  const openComplete = (trip) => {
    setCompletingTrip(trip);
    setCompleteForm({ finalOdometer: trip.vehicle?.odometer || '', fuelConsumed: '', fuelCost: '' });
  };

  const submitComplete = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.put(`/trips/${completingTrip.id}/complete`, {
        finalOdometer: Number(completeForm.finalOdometer),
        fuelConsumed: Number(completeForm.fuelConsumed),
        fuelCost: Number(completeForm.fuelCost) || 0,
      });
      setSuccess('Trip completed successfully!');
      setCompletingTrip(null);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete trip');
    }
  };

  if (!user || !kpis) return <div className="card">Loading dashboard...</div>;

  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg, #101828 0%, #1f6feb 100%)', color: 'white', border: 'none' }}>
        <h2 style={{ marginBottom: '8px' }}>Welcome back, {user.name}!</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          You are logged in as <strong>{user.role.replace('_', ' ').toUpperCase()}</strong>. Here is your personalized command center.
        </p>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {/* RENDER BY ROLE */}
      
      {/* 1. DRIVER DASHBOARD */}
      {user.role === 'driver' && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="value">{kpis.safetyScore}%</div>
              <div className="label">Safety Score</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.status}</div>
              <div className="label">My Status</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.activeTrips}</div>
              <div className="label">Active Trips</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.completedTrips}</div>
              <div className="label">Completed Trips</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.licenseExpiry}</div>
              <div className="label">License Expiry</div>
            </div>
          </div>

          {completingTrip && (
            <div className="card">
              <h3>Complete Trip #{completingTrip.id} ({completingTrip.source} → {completingTrip.destination})</h3>
              <form className="inline-form" onSubmit={submitComplete}>
                <div className="field"><label>Final Odometer (km)</label>
                  <input required type="number" value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })} />
                </div>
                <div className="field"><label>Fuel Consumed (Liters)</label>
                  <input required type="number" value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} />
                </div>
                <div className="field"><label>Fuel Cost ($)</label>
                  <input type="number" value={completeForm.fuelCost} onChange={(e) => setCompleteForm({ ...completeForm, fuelCost: e.target.value })} />
                </div>
                <button className="primary" type="submit">Confirm Completion</button>
                <button type="button" className="secondary" onClick={() => setCompletingTrip(null)}>Cancel</button>
              </form>
            </div>
          )}

          <div className="card">
            <h3>My Assigned Trips</h3>
            {driverTrips.length === 0 ? (
              <p>You have no trips assigned to you.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Route</th><th>Vehicle</th><th>Cargo Weight</th><th>Distance</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {driverTrips.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.source} → {t.destination}</td>
                      <td>{t.vehicle?.registrationNumber || '-'} ({t.vehicle?.name})</td>
                      <td>{t.cargoWeight} kg</td>
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
            )}
          </div>
        </div>
      )}

      {/* 2. SAFETY OFFICER DASHBOARD */}
      {user.role === 'safety_officer' && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="value">{kpis.totalDrivers}</div>
              <div className="label">Total Drivers</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.availableDrivers}</div>
              <div className="label">Available Drivers</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.onTripDrivers}</div>
              <div className="label">On Trip</div>
            </div>
            <div className="kpi-card">
              <div className="value" style={{ color: kpis.suspendedDrivers > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {kpis.suspendedDrivers}
              </div>
              <div className="label">Suspended Drivers</div>
            </div>
            <div className="kpi-card">
              <div className="value" style={{ color: kpis.expiringLicenses > 0 ? 'var(--warning)' : 'var(--success)' }}>
                {kpis.expiringLicenses}
              </div>
              <div className="label">License Expiring (&lt; 30 Days)</div>
            </div>
            <div className="kpi-card">
              <div className="value" style={{ color: kpis.lowScoreDrivers > 0 ? 'var(--danger)' : 'var(--primary)' }}>
                {kpis.lowScoreDrivers}
              </div>
              <div className="label">Drivers with Low Score (&lt; 90)</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Drivers Requiring Attention</h3>
              <button className="primary" onClick={() => navigate('/drivers')}>
                Manage All Drivers
              </button>
            </div>
            
            {safetyDrivers.length === 0 ? (
              <p style={{ color: 'var(--success)', fontWeight: 600 }}>All drivers are compliant. No actions required.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>License Number</th><th>License Expiry</th><th>Safety Score</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {safetyDrivers.map((d) => {
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                    const isExpiring = new Date(d.licenseExpiry) <= thirtyDaysFromNow;
                    return (
                      <tr key={d.id}>
                        <td>{d.id}</td>
                        <td><strong>{d.name}</strong></td>
                        <td>{d.licenseNumber}</td>
                        <td style={{ color: isExpiring ? 'var(--danger)' : 'inherit', fontWeight: isExpiring ? '600' : 'normal' }}>
                          {d.licenseExpiry} {isExpiring && '(Expiring Soon)'}
                        </td>
                        <td style={{ color: d.safetyScore < 90 ? 'var(--danger)' : 'inherit', fontWeight: d.safetyScore < 90 ? '600' : 'normal' }}>
                          {d.safetyScore}%
                        </td>
                        <td><span className={`badge ${d.status}`}>{d.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 3. FINANCIAL ANALYST DASHBOARD */}
      {user.role === 'financial_analyst' && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="value">${kpis.totalRevenue.toLocaleString()}</div>
              <div className="label">Total Revenue (Completed)</div>
            </div>
            <div className="kpi-card">
              <div className="value" style={{ color: 'var(--danger)' }}>${kpis.totalFuelCost.toLocaleString()}</div>
              <div className="label">Fuel Cost</div>
            </div>
            <div className="kpi-card">
              <div className="value" style={{ color: 'var(--danger)' }}>${kpis.totalOtherExpenses.toLocaleString()}</div>
              <div className="label">Other Expenses</div>
            </div>
            <div className="kpi-card">
              <div className="value" style={{ color: kpis.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ${kpis.netProfit.toLocaleString()}
              </div>
              <div className="label">Net Profit</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.activeTrips}</div>
              <div className="label">Active Trips</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.completedTrips}</div>
              <div className="label">Completed Trips</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>Recent Expenses</h3>
                <button className="primary" onClick={() => navigate('/fuel-expenses')}>
                  Log Expenses
                </button>
              </div>
              {analystExpenses.length === 0 ? (
                <p>No expenses recorded yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th><th>Vehicle</th><th>Type</th><th>Amount</th><th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analystExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td>{exp.date}</td>
                        <td>{exp.vehicle?.registrationNumber || '-'}</td>
                        <td>{exp.type}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>-${exp.amount}</td>
                        <td>{exp.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h3>Financial Shortcuts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p>Access analytical modules or perform regular administrative updates:</p>
                <button className="primary" style={{ padding: '12px', fontWeight: 'bold' }} onClick={() => navigate('/reports')}>
                  📈 View Financial & Utilization Reports
                </button>
                <button className="secondary" style={{ padding: '12px' }} onClick={() => navigate('/fuel-expenses')}>
                  ⛽ Log Fuel Usage and Other Toll Fees
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADMIN & FLEET MANAGER DASHBOARD */}
      {(user.role === 'admin' || user.role === 'fleet_manager') && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="value">{kpis.activeVehicles}</div>
              <div className="label">Active Vehicles</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.availableVehicles}</div>
              <div className="label">Available Vehicles</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.vehiclesInMaintenance}</div>
              <div className="label">In Shop</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.activeTrips}</div>
              <div className="label">Active Trips</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.pendingTrips}</div>
              <div className="label">Pending Trips</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.driversOnDuty}</div>
              <div className="label">Drivers On Trip</div>
            </div>
            <div className="kpi-card">
              <div className="value">{kpis.fleetUtilization}%</div>
              <div className="label">Fleet Utilization</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>Recent Trips</h3>
                <button className="primary" onClick={() => navigate('/trips')}>
                  Manage All Trips
                </button>
              </div>
              {recentTrips.length === 0 ? (
                <p>No trips dispatch logs recorded.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th><th>Route</th><th>Vehicle</th><th>Driver</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrips.map((t) => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.source} → {t.destination}</td>
                        <td>{t.vehicle?.registrationNumber || '-'}</td>
                        <td>{t.driver?.name || '-'}</td>
                        <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h3>Quick Administration</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="primary" style={{ padding: '12px', fontWeight: 'bold' }} onClick={() => navigate('/vehicles')}>
                  🚚 Manage Vehicles Registry
                </button>
                {user.role === 'admin' && (
                  <button className="primary" style={{ padding: '12px', fontWeight: 'bold' }} onClick={() => navigate('/drivers')}>
                    👤 Manage Driver Roster
                  </button>
                )}
                <button className="primary" style={{ padding: '12px', fontWeight: 'bold' }} onClick={() => navigate('/maintenance')}>
                  🔧 Maintenance Workflows
                </button>
                <button className="secondary" style={{ padding: '12px' }} onClick={() => navigate('/reports')}>
                  📊 Analytics & Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
