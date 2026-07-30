import React, { useState, useEffect } from 'react';
import { Link, useNavigate as useNav } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { User, Mail, Lock, ClipboardCheck, Award, Briefcase, GraduationCap } from 'lucide-react';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  
  // Student-specific fields
  const [rollNumber, setRollNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);

  // Teacher-specific fields
  const [employeeId, setEmployeeId] = useState('');

  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNav();

  // Fetch classes for students
  useEffect(() => {
    if (role === 'STUDENT') {
      axios.get('/api/auth/classes')
        .then(res => {
          setClasses(res.data);
          if (res.data.length > 0) setClassId(res.data[0].id);
        })
        .catch(err => {
          console.error('Error fetching classes', err);
          showToast('Could not load classes list.', 'error');
        });
    }
  }, [role, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !role) {
      showToast('Please fill in all core fields', 'warning');
      return;
    }

    const payload = { name, email, password, role };

    if (role === 'STUDENT') {
      if (!rollNumber || !classId) {
        showToast('Roll number and class selection are required for students.', 'warning');
        return;
      }
      payload.rollNumber = rollNumber;
      payload.classId = classId;
    } else if (role === 'TEACHER') {
      if (!employeeId) {
        showToast('Employee ID is required for teachers.', 'warning');
        return;
      }
      payload.employeeId = employeeId;
    }

    setLoading(true);
    try {
      await register(payload);
      showToast('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '40px 0' }}>
      <div className="card auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <ClipboardCheck size={32} />
          </div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the college attendance network</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                id="name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="john.doe@college.edu"
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
                type="password"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">Sign Up As</label>
            <div style={{ position: 'relative' }}>
              <select
                id="role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {role === 'STUDENT' && (
            <div style={{ borderLeft: '3px solid var(--accent-secondary)', paddingLeft: '16px', marginBottom: '20px', animation: 'fadeIn 0.3s ease-out' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="rollNumber">Roll Number</label>
                <div style={{ position: 'relative' }}>
                  <GraduationCap size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    id="rollNumber"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '44px' }}
                    placeholder="e.g. CS2028-099"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="classId">Select Your Class</label>
                <select
                  id="classId"
                  className="form-select"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={loading}
                >
                  {classes.length === 0 ? (
                    <option value="">No classes available (Contact Admin)</option>
                  ) : (
                    classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {role === 'TEACHER' && (
            <div style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '16px', marginBottom: '20px', animation: 'fadeIn 0.3s ease-out' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="employeeId">Employee ID</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    id="employeeId"
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '44px' }}
                    placeholder="e.g. EMP-1092"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'none' }}>
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
