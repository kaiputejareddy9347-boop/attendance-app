import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Lock, Mail, ClipboardCheck, Eye, EyeOff, GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      
      if (data.user.role === 'STUDENT') {
        navigate('/dashboard');
      } else if (data.user.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const autofillRole = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    showToast('Credentials filled. Click Sign In to log in.', 'info');
  };

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ maxWidth: '440px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Top Glow Decorator */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '160px',
          height: '160px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        <div className="auth-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div className="auth-logo" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
            marginBottom: '16px',
            color: '#fff'
          }}>
            <GraduationCap size={34} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
            <h2 className="auth-title" style={{ fontSize: '1.6rem', fontWeight: 800 }}>Attendance Portal</h2>
            <Sparkles size={18} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <p className="auth-subtitle" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Smart Academic & Attendance Management System
          </p>
        </div>

        {/* Quick Demo Autofill Pills */}
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
            Quick Demo Login Accounts:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => autofillRole('student@college.edu', 'password123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', padding: '6px 4px', borderRadius: '8px' }}
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => autofillRole('teacher@college.edu', 'password123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', padding: '6px 4px', borderRadius: '8px' }}
            >
              👨‍🏫 Teacher
            </button>
            <button
              type="button"
              onClick={() => autofillRole('admin@college.edu', 'password123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', padding: '6px 4px', borderRadius: '8px' }}
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '14px' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: '700', textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
