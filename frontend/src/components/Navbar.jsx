import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ClipboardCheck, LayoutDashboard, Clock, FileText, History, Settings, Menu, X, Calendar, Layers, BookOpen, CreditCard } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collegeConfig, setCollegeConfig] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get('/api/college/config')
        .then(res => setCollegeConfig(res.data))
        .catch(err => console.error('Error loading config', err));
    }
  }, [user]);

  // Close sidebar on path or search query change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path, tab = null) => {
    if (tab) {
      const searchParams = new URLSearchParams(location.search);
      const currentTab = searchParams.get('tab')?.toLowerCase();
      // If path matches and tab matches (or default to stats if no query param)
      if (tab === 'stats' && !currentTab) {
        return location.pathname === path;
      }
      return location.pathname === path && currentTab === tab.toLowerCase();
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="mobile-header">
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="mobile-menu-btn"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>
        <Link to="/" className="mobile-header-brand">
          <ClipboardCheck size={20} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{collegeConfig ? collegeConfig.code : 'Attendance'}</span>
        </Link>
        <button 
          onClick={handleLogout} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
          title="Log Out"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Sidebar Overlay (Mobile Backdrop) */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation Drawer */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Brand header */}
          <div className="sidebar-brand">
            <ClipboardCheck size={24} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {collegeConfig ? collegeConfig.name : 'AttendancePortal'}
            </span>
            {sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(false)} 
                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                className="mobile-only"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* User profile card */}
          <div className="sidebar-profile">
            <div className="sidebar-profile-avatar">
              {user.name.charAt(0)}
            </div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">{user.name}</span>
              <span className="sidebar-profile-role">{user.role}</span>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="sidebar-links">
            {user.role === 'STUDENT' && (
              <>
                <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/timetable" className={`sidebar-link ${isActive('/timetable') ? 'active' : ''}`}>
                  <Clock size={18} />
                  <span>Timetable</span>
                </Link>
                <Link to="/leaves" className={`sidebar-link ${isActive('/leaves') ? 'active' : ''}`}>
                  <FileText size={18} />
                  <span>Leaves</span>
                </Link>
              </>
            )}

            {user.role === 'TEACHER' && (
              <>
                <Link to="/teacher/dashboard" className={`sidebar-link ${isActive('/teacher/dashboard') ? 'active' : ''}`}>
                  <ClipboardCheck size={18} />
                  <span>Mark Attendance</span>
                </Link>
                <Link to="/teacher/history" className={`sidebar-link ${isActive('/teacher/history') ? 'active' : ''}`}>
                  <History size={18} />
                  <span>History</span>
                </Link>
                <Link to="/teacher/leaves" className={`sidebar-link ${isActive('/teacher/leaves') ? 'active' : ''}`}>
                  <FileText size={18} />
                  <span>Leave Requests</span>
                </Link>
              </>
            )}

            {user.role === 'ADMIN' && (
              <>
                <Link to="/admin/dashboard?tab=stats" className={`sidebar-link ${isActive('/admin/dashboard', 'stats') ? 'active' : ''}`}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/admin/dashboard?tab=classes" className={`sidebar-link ${isActive('/admin/dashboard', 'classes') ? 'active' : ''}`}>
                  <Layers size={18} />
                  <span>Classes</span>
                </Link>
                <Link to="/admin/dashboard?tab=courses" className={`sidebar-link ${isActive('/admin/dashboard', 'courses') ? 'active' : ''}`}>
                  <BookOpen size={18} />
                  <span>Courses</span>
                </Link>
                <Link to="/admin/dashboard?tab=timetable" className={`sidebar-link ${isActive('/admin/dashboard', 'timetable') ? 'active' : ''}`}>
                  <Clock size={18} />
                  <span>Timetables</span>
                </Link>
                <Link to="/admin/dashboard?tab=exams" className={`sidebar-link ${isActive('/admin/dashboard', 'exams') ? 'active' : ''}`}>
                  <Calendar size={18} />
                  <span>Exams Planner</span>
                </Link>
                <Link to="/admin/dashboard?tab=holidays" className={`sidebar-link ${isActive('/admin/dashboard', 'holidays') ? 'active' : ''}`}>
                  <Calendar size={18} />
                  <span>Holiday Recess</span>
                </Link>
                <Link to="/admin/dashboard?tab=fees" className={`sidebar-link ${isActive('/admin/dashboard', 'fees') ? 'active' : ''}`}>
                  <CreditCard size={18} />
                  <span>Fee Dues</span>
                </Link>
                <Link to="/admin/dashboard?tab=branding" className={`sidebar-link ${isActive('/admin/dashboard', 'branding') ? 'active' : ''}`}>
                  <Settings size={18} />
                  <span>Brand Settings</span>
                </Link>
              </>
            )}
          </nav>

          {/* Sidebar Footer Logout */}
          <div className="sidebar-footer">
            <button onClick={handleLogout} className="sidebar-logout-btn">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
