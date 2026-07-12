import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Reports from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="page-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/fuel-expenses" element={<ProtectedRoute><FuelExpenses /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['financial_analyst', 'fleet_manager']}><Reports /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
