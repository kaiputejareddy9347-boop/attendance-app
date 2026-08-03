import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

import Navbar from './components/Navbar';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherHistory from './pages/TeacherHistory';
import TeacherLeaves from './pages/TeacherLeaves';
import StudentLeaves from './pages/StudentLeaves';
import Timetable from './pages/Timetable';
import AdminDashboard from './pages/AdminDashboard';

import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';

// Protected Route Component to enforce roles
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user?.role || '').toUpperCase();
  if (allowedRoles.length && !allowedRoles.some(r => r.toUpperCase() === userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Home component to redirect users based on their active role
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleUpper = (user?.role || '').toUpperCase();
  if (roleUpper === 'STUDENT') {
    return <Navigate to="/dashboard" replace />;
  } else if (roleUpper === 'TEACHER') {
    return <Navigate to="/teacher/dashboard" replace />;
  } else if (roleUpper === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(() => {
    const splashSeen = sessionStorage.getItem('attendease_splash_seen');
    return !splashSeen;
  });

  const handleSplashFinish = () => {
    sessionStorage.setItem('attendease_splash_seen', 'true');
    setShowSplash(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <Navbar />
      <main className="main-content-layout">
        <ErrorBoundary>
          <Routes>
            {/* Protected Student Routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/timetable" element={<Navigate to="/dashboard?tab=timetable" replace />} />
            <Route path="/leaves" element={<Navigate to="/dashboard?tab=leaves" replace />} />

            {/* Protected Teacher Routes */}
            <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/history" element={<Navigate to="/teacher/dashboard?tab=history" replace />} />
            <Route path="/teacher/leaves" element={<Navigate to="/teacher/dashboard?tab=leaves" replace />} />

            {/* Protected Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

            {/* Home Redirect and Catch-all */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <PWAInstallPrompt />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
