import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { Award, Calendar, FileText, Send, CheckCircle, Clock, AlertTriangle, Bell, Check } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // Leave request fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await axios.get('/api/student/attendance');
      setData(statsRes.data);
      
      const leavesRes = await axios.get('/api/student/leaves');
      setLeaveRequests(leavesRes.data);
    } catch (err) {
      console.error('Error fetching student stats', err);
      showToast('Could not load attendance details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      showToast('Please fill in all leave request fields.', 'warning');
      return;
    }

    setSubmittingLeave(true);
    try {
      await axios.post('/api/student/leaves', { startDate, endDate, reason });
      showToast('Leave request submitted successfully.', 'success');
      setStartDate('');
      setEndDate('');
      setReason('');
      // Reload leaves
      const res = await axios.get('/api/student/leaves');
      setLeaveRequests(res.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit leave request.';
      showToast(errMsg, 'error');
    } finally {
      setSubmittingLeave(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>
      </div>
    );
  }

  const summary = data?.summary || { total: 0, present: 0, late: 0, absent: 0, percentage: 100 };
  const breakdown = data?.breakdown || [];
  const studentClass = data?.studentClass || { name: 'N/A', department: 'N/A' };

  // Circle path math
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (summary.percentage / 100) * circumference;

  return (
    <div className="app-container">
      {/* Profile summary card */}
      <div className="card profile-card pulse" style={{ marginBottom: '24px' }}>
        <div className="profile-avatar">
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{user.name}</h2>
          <p style={{ fontSize: '0.9rem' }}>
            Roll: <strong style={{ color: '#fff' }}>{user.student?.rollNumber || 'N/A'}</strong> | Class:{' '}
            <strong style={{ color: '#fff' }}>{studentClass.name}</strong> ({studentClass.department})
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Overall Circular Chart */}
        <div className="card col-span-4" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Overall Attendance
          </h3>
          <div className="progress-ring-container">
            <svg height={radius * 2} width={radius * 2}>
              <circle
                stroke="rgba(255,255,255,0.03)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={summary.percentage >= 75 ? 'var(--color-present)' : 'var(--color-absent)'}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                className="progress-ring-circle"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className="progress-ring-value">
              {summary.percentage}%
              <span>{summary.percentage >= 75 ? 'Good' : 'Low'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 4px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-present)', fontWeight: '600' }}>Present</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '4px' }}>{summary.present}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 4px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-late)', fontWeight: '600' }}>Late</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '4px' }}>{summary.late}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 4px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-absent)', fontWeight: '600' }}>Absent</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '4px' }}>{summary.absent}</div>
            </div>
          </div>
        </div>

        {/* Notifications & System Updates */}
        <div className="card col-span-8">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} style={{ color: 'var(--accent-primary)' }} />
            Notifications
          </h3>
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No new notifications.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: n.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h5 style={{ fontWeight: '600', fontSize: '0.9rem', color: n.isRead ? 'var(--text-secondary)' : '#fff' }}>{n.title}</h5>
                    <p style={{ fontSize: '0.8rem', marginTop: '2px', color: 'var(--text-muted)' }}>{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="btn btn-secondary"
                      style={{ padding: '6px', borderRadius: '50%' }}
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

        {/* Detailed subject breakdown */}
        <div className="card col-span-12">
          <h3>Subject-wise Attendance Breakdown</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
            Maintain above 75% attendance in each subject to remain compliant.
          </p>
          <div className="subject-grid">
            {breakdown.map((subj) => (
              <div key={subj.subjectId} className="card subject-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="subject-header">
                  <div>
                    <span className="subject-code">{subj.subjectCode}</span>
                    <h4 style={{ fontSize: '1rem', marginTop: '6px' }}>{subj.subjectName}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Instructor: {subj.teacherName}
                    </p>
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    color: subj.percentage >= 75 ? 'var(--color-present)' : 'var(--color-absent)'
                  }}>
                    {subj.percentage}%
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                  <div style={{
                    width: `${subj.percentage}%`,
                    height: '100%',
                    background: subj.percentage >= 75 ? 'var(--color-present)' : 'var(--color-absent)',
                    borderRadius: '3px'
                  }} />
                </div>

                <div className="subject-stats-row">
                  <div>
                    <div className="subject-stat-label">Attended</div>
                    <div className="subject-stat-val" style={{ color: 'var(--color-present)' }}>{subj.present + subj.late}</div>
                  </div>
                  <div>
                    <div className="subject-stat-label">Absent</div>
                    <div className="subject-stat-val" style={{ color: 'var(--color-absent)' }}>{subj.absent}</div>
                  </div>
                  <div>
                    <div className="subject-stat-label">Total</div>
                    <div className="subject-stat-val">{subj.total}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Requests Portal */}
        <div className="card col-span-6">
          <h3>Apply for Leave</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--text-muted)' }}>
            Submit advisor-reviewable requests ahead of absences.
          </p>
          <form onSubmit={handleRequestLeave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submittingLeave}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="endDate">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={submittingLeave}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reason">Reason for Leave</label>
              <textarea
                id="reason"
                className="form-textarea"
                rows="3"
                placeholder="Details of emergency, sickness, or event..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submittingLeave}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submittingLeave}>
              <Send size={16} />
              {submittingLeave ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Leave History / Logs */}
        <div className="card col-span-6">
          <h3>Leave History Logs</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--text-muted)' }}>
            Track approval status of your requests.
          </p>
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaveRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No leave requests filed yet.</p>
            ) : (
              leaveRequests.map((leave) => (
                <div key={leave.id} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <h5 style={{ fontWeight: '600' }}>{leave.reason}</h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Duration: {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge badge-${leave.status.toLowerCase()}`}>
                    {leave.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
