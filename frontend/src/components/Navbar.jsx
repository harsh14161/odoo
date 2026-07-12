import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">TransitOps</div>
      <div className="navbar-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/vehicles">Vehicles</NavLink>
        <NavLink to="/drivers">Drivers</NavLink>
        <NavLink to="/trips">Trips</NavLink>
        <NavLink to="/maintenance">Maintenance</NavLink>
        <NavLink to="/fuel-expenses">Fuel & Expenses</NavLink>
        <NavLink to="/reports">Reports</NavLink>
      </div>
      <div className="navbar-user">
        <span>{user.name} <em>({user.role.replace('_', ' ')})</em></span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
