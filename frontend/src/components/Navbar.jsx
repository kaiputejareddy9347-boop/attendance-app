import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ClipboardCheck, LayoutDashboard, Clock, FileText, History, Settings, Menu, X, Calendar, Layers, BookOpen, CreditCard, User, Award, Bell, Check, Calculator, Landmark, GraduationCap, Sun, Moon, MessageSquare, Compass, Users } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collegeConfig, setCollegeConfig] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme_mode') || 'dark');

  const toggleThemeMode = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('theme_mode', nextTheme);
  };

  useEffect(() => {
    if (themeMode === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [themeMode]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      axios.get('/api/college/config')
        .then(res => setCollegeConfig(res.data))
        .catch(err => console.error('Error loading config', err));

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close sidebar on path or search query change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  if (!user) return null;

  const handleLogout = () => {
    document.body.classList.remove('light-theme');
    localStorage.removeItem('theme_mode');
    logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Error marking read', err);
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.isRead).length;

  const isActive = (path, tab = null) => {
    if (tab) {
      const searchParams = new URLSearchParams(location.search);
      const currentTab = searchParams.get('tab');
      if (!currentTab && tab === 'stats') {
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
          <GraduationCap size={22} style={{ color: 'var(--accent-secondary)' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{collegeConfig ? collegeConfig.code : 'Attendance'}</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleThemeMode}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
            title={themeMode === 'dark' ? 'Switch to Bright Light Mode' : 'Switch to Dark Mode'}
          >
            {themeMode === 'dark' ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#6366f1' }} />}
          </button>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', position: 'relative' }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  background: 'var(--color-absent)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '14px',
                  height: '14px',
                  fontSize: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showNotifDropdown && (
              <div style={{
                position: 'absolute',
                top: '36px',
                right: '0',
                width: '280px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '16px',
                zIndex: 2000,
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Notifications</h4>
                  <button onClick={() => setShowNotifDropdown(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {safeNotifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No notifications</p>
                  ) : (
                    safeNotifications.map(n => (
                      <div key={n.id} style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.8rem', color: n.isRead ? 'var(--text-secondary)' : '#fff' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.message}</div>
                        </div>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', padding: '4px' }}
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
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
          {/* Brand header with College Symbol */}
          <div className="sidebar-brand">
            <GraduationCap size={26} style={{ color: 'var(--accent-secondary)' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800 }}>
              {collegeConfig ? collegeConfig.name : 'Attendance Portal'}
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
                <Link to="/dashboard?tab=courses" className={`sidebar-link ${isActive('/dashboard', 'courses') ? 'active' : ''}`}>
                  <BookOpen size={18} />
                  <span>Courses</span>
                </Link>
                <Link to="/dashboard?tab=classes" className={`sidebar-link ${isActive('/dashboard', 'classes') ? 'active' : ''}`}>
                  <Layers size={18} />
                  <span>Classes</span>
                </Link>
                <Link to="/dashboard?tab=bunk" className={`sidebar-link ${isActive('/dashboard', 'bunk') ? 'active' : ''}`}>
                  <Calculator size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Bunk Estimator</span>
                </Link>
                <Link to="/dashboard?tab=fees" className={`sidebar-link ${isActive('/dashboard', 'fees') ? 'active' : ''}`}>
                  <CreditCard size={18} />
                  <span>Fee Dues</span>
                </Link>
                <Link to="/dashboard?tab=leaves" className={`sidebar-link ${isActive('/dashboard', 'leaves') ? 'active' : ''}`}>
                  <FileText size={18} />
                  <span>Leaves</span>
                </Link>
                <Link to="/dashboard?tab=holidays" className={`sidebar-link ${isActive('/dashboard', 'holidays') ? 'active' : ''}`}>
                  <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span>Holiday Recess</span>
                </Link>
                <Link to="/dashboard?tab=events" className={`sidebar-link ${isActive('/dashboard', 'events') ? 'active' : ''}`}>
                  <Compass size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Campus Events</span>
                </Link>
                <Link to="/dashboard?tab=clubs" className={`sidebar-link ${isActive('/dashboard', 'clubs') ? 'active' : ''}`}>
                  <Users size={18} style={{ color: '#10b981' }} />
                  <span>Student Clubs</span>
                </Link>
                <Link to="/dashboard?tab=feedback" className={`sidebar-link ${isActive('/dashboard', 'feedback') ? 'active' : ''}`}>
                  <MessageSquare size={18} style={{ color: '#f59e0b' }} />
                  <span>Feedback</span>
                </Link>
                <Link to="/dashboard?tab=settings" className={`sidebar-link ${isActive('/dashboard', 'settings') ? 'active' : ''}`}>
                  <Settings size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Settings</span>
                </Link>
                <Link to="/dashboard?tab=branding" className={`sidebar-link ${isActive('/dashboard', 'branding') ? 'active' : ''}`}>
                  <Settings size={18} />
                  <span>College Info</span>
                </Link>
              </>
            )}

            {(user?.role || '').toUpperCase() === 'TEACHER' && (
              <>
                <Link to="/teacher/dashboard?tab=attendance" className={`sidebar-link ${isActive('/teacher/dashboard', 'attendance') ? 'active' : ''}`}>
                  <ClipboardCheck size={18} style={{ color: 'var(--color-present)' }} />
                  <span>Mark Attendance</span>
                </Link>
                <Link to="/teacher/dashboard?tab=courses" className={`sidebar-link ${isActive('/teacher/dashboard', 'courses') ? 'active' : ''}`}>
                  <BookOpen size={18} />
                  <span>Courses</span>
                </Link>
                <Link to="/teacher/dashboard?tab=classes" className={`sidebar-link ${isActive('/teacher/dashboard', 'classes') ? 'active' : ''}`}>
                  <Layers size={18} />
                  <span>Classes</span>
                </Link>
                <Link to="/teacher/dashboard?tab=timetable" className={`sidebar-link ${isActive('/teacher/dashboard', 'timetable') ? 'active' : ''}`}>
                  <Clock size={18} />
                  <span>Timetables</span>
                </Link>
                <Link to="/teacher/dashboard?tab=notice" className={`sidebar-link ${isActive('/teacher/dashboard', 'notice') ? 'active' : ''}`}>
                  <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span>Notice Board</span>
                </Link>
                <Link to="/teacher/dashboard?tab=fees" className={`sidebar-link ${isActive('/teacher/dashboard', 'fees') ? 'active' : ''}`}>
                  <CreditCard size={18} />
                  <span>Fee Dues</span>
                </Link>
                <Link to="/teacher/dashboard?tab=history" className={`sidebar-link ${isActive('/teacher/dashboard', 'history') ? 'active' : ''}`}>
                  <History size={18} />
                  <span>History</span>
                </Link>
                <Link to="/teacher/dashboard?tab=leaves" className={`sidebar-link ${isActive('/teacher/dashboard', 'leaves') ? 'active' : ''}`}>
                  <FileText size={18} />
                  <span>Leave Requests</span>
                </Link>
                <Link to="/teacher/dashboard?tab=events" className={`sidebar-link ${isActive('/teacher/dashboard', 'events') ? 'active' : ''}`}>
                  <Compass size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Campus Events</span>
                </Link>
                <Link to="/teacher/dashboard?tab=feedback" className={`sidebar-link ${isActive('/teacher/dashboard', 'feedback') ? 'active' : ''}`}>
                  <MessageSquare size={18} style={{ color: '#f59e0b' }} />
                  <span>Feedback</span>
                </Link>
                <Link to="/teacher/dashboard?tab=settings" className={`sidebar-link ${isActive('/teacher/dashboard', 'settings') ? 'active' : ''}`}>
                  <Settings size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Settings</span>
                </Link>
                <Link to="/teacher/dashboard?tab=branding" className={`sidebar-link ${isActive('/teacher/dashboard', 'branding') ? 'active' : ''}`}>
                  <Settings size={18} />
                  <span>College Info</span>
                </Link>
              </>
            )}

            {user.role === 'ADMIN' && (
              <>
                <Link to="/admin/dashboard?tab=courses" className={`sidebar-link ${isActive('/admin/dashboard', 'courses') ? 'active' : ''}`}>
                  <BookOpen size={18} />
                  <span>Courses</span>
                </Link>
                <Link to="/admin/dashboard?tab=timeline" className={`sidebar-link ${isActive('/admin/dashboard', 'timeline') ? 'active' : ''}`}>
                  <Calendar size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Semester Timeline</span>
                </Link>
                <Link to="/admin/dashboard?tab=exams" className={`sidebar-link ${isActive('/admin/dashboard', 'exams') ? 'active' : ''}`}>
                  <Calendar size={18} />
                  <span>Exams Planner</span>
                </Link>
                <Link to="/admin/dashboard?tab=holidays" className={`sidebar-link ${isActive('/admin/dashboard', 'holidays') ? 'active' : ''}`}>
                  <Calendar size={18} />
                  <span>Holiday Recess</span>
                </Link>
                <Link to="/admin/dashboard?tab=events" className={`sidebar-link ${isActive('/admin/dashboard', 'events') ? 'active' : ''}`}>
                  <Compass size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Campus Events</span>
                </Link>
                <Link to="/admin/dashboard?tab=feedback" className={`sidebar-link ${isActive('/admin/dashboard', 'feedback') ? 'active' : ''}`}>
                  <MessageSquare size={18} style={{ color: '#f59e0b' }} />
                  <span>Feedbacks Log</span>
                </Link>
                <Link to="/admin/dashboard?tab=fees" className={`sidebar-link ${isActive('/admin/dashboard', 'fees') ? 'active' : ''}`}>
                  <CreditCard size={18} />
                  <span>Fee Dues</span>
                </Link>
                <Link to="/admin/dashboard?tab=settings" className={`sidebar-link ${isActive('/admin/dashboard', 'settings') ? 'active' : ''}`}>
                  <Settings size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Settings</span>
                </Link>
                <Link to="/admin/dashboard?tab=branding" className={`sidebar-link ${isActive('/admin/dashboard', 'branding') ? 'active' : ''}`}>
                  <Settings size={18} />
                  <span>College Info</span>
                </Link>
              </>
            )}
          </nav>

          {/* Sidebar Footer Logout & Theme Switcher */}
          <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={toggleThemeMode}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
            >
              {themeMode === 'dark' ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: '#6366f1' }} />}
              <span>{themeMode === 'dark' ? 'Bright Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onClick={handleLogout} className="sidebar-logout-btn">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Floating Glassmorphic Bottom Navigation Bar (Mobile Only) */}
      <nav className="mobile-bottom-nav">
        {user.role === 'STUDENT' && (
          <>
            <Link to="/dashboard?tab=stats" className={`mobile-bottom-nav-item ${isActive('/dashboard', 'stats') ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Home</span>
            </Link>
            <Link to="/dashboard?tab=calendar" className={`mobile-bottom-nav-item ${isActive('/dashboard', 'calendar') ? 'active' : ''}`}>
              <Calendar size={20} />
              <span>Timetable</span>
            </Link>
            <Link to="/dashboard?tab=marks" className={`mobile-bottom-nav-item ${isActive('/dashboard', 'marks') ? 'active' : ''}`}>
              <Award size={20} />
              <span>Marks</span>
            </Link>
            <Link to="/dashboard?tab=notice" className={`mobile-bottom-nav-item ${isActive('/dashboard', 'notice') ? 'active' : ''}`}>
              <FileText size={20} />
              <span>Notices</span>
            </Link>
            <Link to="/dashboard?tab=profile" className={`mobile-bottom-nav-item ${isActive('/dashboard', 'profile') ? 'active' : ''}`}>
              <User size={20} />
              <span>Profile</span>
            </Link>
          </>
        )}

        {user.role === 'TEACHER' && (
          <>
            <Link to="/teacher/dashboard?tab=stats" className={`mobile-bottom-nav-item ${isActive('/teacher/dashboard', 'stats') ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Home</span>
            </Link>
            <Link to="/teacher/dashboard?tab=attendance" className={`mobile-bottom-nav-item ${isActive('/teacher/dashboard', 'attendance') ? 'active' : ''}`}>
              <ClipboardCheck size={20} />
              <span>Mark</span>
            </Link>
            <Link to="/teacher/dashboard?tab=timetable" className={`mobile-bottom-nav-item ${isActive('/teacher/dashboard', 'timetable') ? 'active' : ''}`}>
              <Clock size={20} />
              <span>Timetable</span>
            </Link>
            <Link to="/teacher/dashboard?tab=notice" className={`mobile-bottom-nav-item ${isActive('/teacher/dashboard', 'notice') ? 'active' : ''}`}>
              <FileText size={20} />
              <span>Notice</span>
            </Link>
            <Link to="/teacher/dashboard?tab=profile" className={`mobile-bottom-nav-item ${isActive('/teacher/dashboard', 'profile') ? 'active' : ''}`}>
              <User size={20} />
              <span>Profile</span>
            </Link>
          </>
        )}

        {user.role === 'ADMIN' && (
          <>
            <Link to="/admin/dashboard?tab=stats" className={`mobile-bottom-nav-item ${isActive('/admin/dashboard', 'stats') ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Home</span>
            </Link>
            <Link to="/admin/dashboard?tab=classes" className={`mobile-bottom-nav-item ${isActive('/admin/dashboard', 'classes') ? 'active' : ''}`}>
              <Layers size={20} />
              <span>Classes</span>
            </Link>
            <Link to="/admin/dashboard?tab=timetable" className={`mobile-bottom-nav-item ${isActive('/admin/dashboard', 'timetable') ? 'active' : ''}`}>
              <Clock size={20} />
              <span>Schedule</span>
            </Link>
            <Link to="/admin/dashboard?tab=timeline" className={`mobile-bottom-nav-item ${isActive('/admin/dashboard', 'timeline') ? 'active' : ''}`}>
              <Calendar size={20} />
              <span>Timeline</span>
            </Link>
            <Link to="/admin/dashboard?tab=profile" className={`mobile-bottom-nav-item ${isActive('/admin/dashboard', 'profile') ? 'active' : ''}`}>
              <User size={20} />
              <span>Profile</span>
            </Link>
          </>
        )}
      </nav>
    </>
  );
};

export default Navbar;
