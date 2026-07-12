import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyFuel = { vehicleId: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) };
const emptyExpense = { vehicleId: '', type: 'Toll', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' };

export default function FuelExpenses() {
  const [tab, setTab] = useState('fuel');
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelForm, setFuelForm] = useState(emptyFuel);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      const [v, f, e] = await Promise.all([api.get('/vehicles'), api.get('/fuel-logs'), api.get('/expenses')]);
      setVehicles(v.data);
      setFuelLogs(f.data);
      setExpenses(e.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  const submitFuel = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/fuel-logs', { ...fuelForm, vehicleId: Number(fuelForm.vehicleId), liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) });
      setSuccess('Fuel log recorded');
      setFuelForm(emptyFuel);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record fuel log');
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/expenses', { ...expenseForm, vehicleId: Number(expenseForm.vehicleId), amount: Number(expenseForm.amount) });
      setSuccess('Expense recorded');
      setExpenseForm(emptyExpense);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record expense');
    }
  };

  return (
    <div>
      <h1>Fuel & Expense Management</h1>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="tabs">
        <button className={tab === 'fuel' ? 'active' : ''} onClick={() => setTab('fuel')}>Fuel Logs</button>
        <button className={tab === 'expenses' ? 'active' : ''} onClick={() => setTab('expenses')}>Other Expenses</button>
      </div>

      {tab === 'fuel' && (
        <>
          <div className="card">
            <h3>Record Fuel Log</h3>
            <form className="inline-form" onSubmit={submitFuel}>
              <div className="field"><label>Vehicle</label>
                <select required value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
                </select>
              </div>
              <div className="field"><label>Liters</label>
                <input required type="number" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} />
              </div>
              <div className="field"><label>Cost</label>
                <input required type="number" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
              </div>
              <div className="field"><label>Date</label>
                <input required type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
              </div>
              <button className="primary" type="submit">Add Fuel Log</button>
            </form>
          </div>
          <div className="card">
            <table>
              <thead><tr><th>ID</th><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Date</th></tr></thead>
              <tbody>
                {fuelLogs.map((f) => (
                  <tr key={f.id}><td>{f.id}</td><td>{f.vehicle?.registrationNumber}</td><td>{f.liters}</td><td>{f.cost}</td><td>{f.date}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'expenses' && (
        <>
          <div className="card">
            <h3>Record Expense</h3>
            <form className="inline-form" onSubmit={submitExpense}>
              <div className="field"><label>Vehicle</label>
                <select required value={expenseForm.vehicleId} onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}>
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
                </select>
              </div>
              <div className="field"><label>Type</label>
                <select value={expenseForm.type} onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}>
                  <option>Toll</option><option>Parking</option><option>Fine</option><option>Other</option>
                </select>
              </div>
              <div className="field"><label>Amount</label>
                <input required type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </div>
              <div className="field"><label>Date</label>
                <input required type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
              </div>
              <div className="field"><label>Notes</label>
                <input value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
              </div>
              <button className="primary" type="submit">Add Expense</button>
            </form>
          </div>
          <div className="card">
            <table>
              <thead><tr><th>ID</th><th>Vehicle</th><th>Type</th><th>Amount</th><th>Date</th><th>Notes</th></tr></thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}><td>{e.id}</td><td>{e.vehicle?.registrationNumber}</td><td>{e.type}</td><td>{e.amount}</td><td>{e.date}</td><td>{e.notes}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
