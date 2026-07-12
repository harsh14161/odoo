import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectPosition = (pos) => {
    setPosition(pos);
    if (pos === 'manager') {
      setEmail('fleet@transitops.com');
      setPassword('Password123!');
    } else if (pos === 'admin') {
      setEmail('admin@transitops.com');
      setPassword('Password123!');
    } else if (pos === 'driver') {
      setEmail('driver@transitops.com');
      setPassword('Password123!');
    } else {
      setEmail('');
      setPassword('');
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const getPositionLabel = () => {
    switch (position) {
      case 'manager': return 'Fleet Manager';
      case 'admin': return 'Administrator';
      case 'driver': return 'Driver';
      default: return 'Staff / Other';
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card login-card">
        <h2>TransitOps Login</h2>
        {error && <div className="error-msg">{error}</div>}

        {step === 1 ? (
          <div>
            <p style={{ color: 'var(--muted)', marginBottom: '20px', fontSize: '0.95rem' }}>
              Select your position to log in to the portal:
            </p>
            <div className="position-grid">
              <div className="position-card" onClick={() => handleSelectPosition('manager')}>
                <div className="position-icon">💼</div>
                <div className="position-title">Manager</div>
                <div className="position-subtitle">Manage operations</div>
              </div>
              <div className="position-card" onClick={() => handleSelectPosition('admin')}>
                <div className="position-icon">🛡️</div>
                <div className="position-title">Admin</div>
                <div className="position-subtitle">System administration</div>
              </div>
              <div className="position-card" onClick={() => handleSelectPosition('driver')}>
                <div className="position-icon">🚚</div>
                <div className="position-title">Driver</div>
                <div className="position-subtitle">Log trips & operations</div>
              </div>
              <div className="position-card" onClick={() => handleSelectPosition('other')}>
                <div className="position-icon">⚙️</div>
                <div className="position-title">Other Staff</div>
                <div className="position-subtitle">Safety / Finance / Info</div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <button className="login-back-btn" onClick={handleBack}>
              ← Change position
            </button>
            <div className="selected-position-badge">
              Position: <span>{getPositionLabel()}</span>
            </div>
            <form onSubmit={handleSubmit}>
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button className="primary" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        )}

        <div className="demo-accounts">
          Demo accounts (run <code>npm run seed</code> in backend), password: <strong>Password123!</strong><br />
          admin@transitops.com · fleet@transitops.com · driver@transitops.com<br />
          safety@transitops.com · finance@transitops.com
        </div>
      </div>
    </div>
  );
}
