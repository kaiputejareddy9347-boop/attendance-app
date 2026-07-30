import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherHistory from './pages/TeacherHistory';
import TeacherLeaves from './pages/TeacherLeaves';
import StudentLeaves from './pages/StudentLeaves';
import Timetable from './pages/Timetable';
import AdminDashboard from './pages/AdminDashboard';

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

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    // Redirect to home page if they don't have role access
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

  if (user.role === 'STUDENT') {
    return <Navigate to="/dashboard" replace />;
  } else if (user.role === 'TEACHER') {
    return <Navigate to="/teacher/dashboard" replace />;
  } else if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div style={{ flex: 1 }}>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Role-based Protected Student Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/timetable"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT']}>
                      <Timetable />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaves"
                  element={
                    <ProtectedRoute allowedRoles={['STUDENT']}>
                      <StudentLeaves />
                    </ProtectedRoute>
                  }
                />

                {/* Role-based Protected Teacher Routes */}
                <Route
                  path="/teacher/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER']}>
                      <TeacherDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/history"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER']}>
                      <TeacherHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/leaves"
                  element={
                    <ProtectedRoute allowedRoles={['TEACHER']}>
                      <TeacherLeaves />
                    </ProtectedRoute>
                  }
                />

                {/* Role-based Protected Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Root Redirection */}
                <Route path="/" element={<HomeRedirect />} />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
