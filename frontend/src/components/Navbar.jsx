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

  const hasAccess = (path) => {
    if (user.role === 'admin') return true;
    switch (path) {
      case '/':
        return true;
      case '/vehicles':
        return user.role === 'fleet_manager';
      case '/drivers':
        return ['safety_officer', 'fleet_manager'].includes(user.role);
      case '/trips':
        return ['fleet_manager', 'driver'].includes(user.role);
      case '/maintenance':
        return user.role === 'fleet_manager';
      case '/fuel-expenses':
        return user.role === 'financial_analyst';
      case '/reports':
        return ['fleet_manager', 'financial_analyst'].includes(user.role);
      default:
        return false;
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">TransitOps</div>
      <div className="navbar-links">
        {hasAccess('/') && <NavLink to="/" end>Dashboard</NavLink>}
        {hasAccess('/vehicles') && <NavLink to="/vehicles">Vehicles</NavLink>}
        {hasAccess('/drivers') && <NavLink to="/drivers">Drivers</NavLink>}
        {hasAccess('/trips') && <NavLink to="/trips">Trips</NavLink>}
        {hasAccess('/maintenance') && <NavLink to="/maintenance">Maintenance</NavLink>}
        {hasAccess('/fuel-expenses') && <NavLink to="/fuel-expenses">Fuel & Expenses</NavLink>}
        {hasAccess('/reports') && <NavLink to="/reports">Reports</NavLink>}
      </div>
      <div className="navbar-user">
        <span>{user.name} <em>({user.role.replace('_', ' ')})</em></span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
