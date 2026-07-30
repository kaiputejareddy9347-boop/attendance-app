import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ClipboardCheck } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collegeConfig, setCollegeConfig] = useState(null);

  useEffect(() => {
    if (user) {
      axios.get('/api/college/config')
        .then(res => setCollegeConfig(res.data))
        .catch(err => console.error('Error loading config', err));
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <ClipboardCheck size={24} />
          <span>{collegeConfig ? `${collegeConfig.name} (${collegeConfig.code})` : 'AttendancePortal'}</span>
        </Link>

        <div className="navbar-links">
          {user.role === 'STUDENT' && (
            <>
              <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/timetable" className={`navbar-link ${isActive('/timetable') ? 'active' : ''}`}>
                Timetable
              </Link>
              <Link to="/leaves" className={`navbar-link ${isActive('/leaves') ? 'active' : ''}`}>
                Leaves
              </Link>
            </>
          )}

          {user.role === 'TEACHER' && (
            <>
              <Link to="/teacher/dashboard" className={`navbar-link ${isActive('/teacher/dashboard') ? 'active' : ''}`}>
                Mark Attendance
              </Link>
              <Link to="/teacher/history" className={`navbar-link ${isActive('/teacher/history') ? 'active' : ''}`}>
                History
              </Link>
              <Link to="/teacher/leaves" className={`navbar-link ${isActive('/teacher/leaves') ? 'active' : ''}`}>
                Leave Requests
              </Link>
            </>
          )}

          {user.role === 'ADMIN' && (
            <>
              <Link to="/admin/dashboard" className={`navbar-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                Control Panel
              </Link>
            </>
          )}
        </div>

        <div className="navbar-user">
          <div className="navbar-user-name">
            {user.name} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>({user.role})</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
