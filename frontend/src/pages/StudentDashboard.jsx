import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { Award, Calendar, FileText, Send, CheckCircle, Clock, AlertTriangle, Bell, Check, BookOpen, MapPin, ShieldAlert, CreditCard, DollarSign } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // Custom features lists
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [fees, setFees] = useState([]);

  // Leave request fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    fetchAdditionalData();
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

  const fetchAdditionalData = async () => {
    try {
      const timetableRes = await axios.get('/api/student/timetable');
      setTimetable(timetableRes.data);

      const examsRes = await axios.get('/api/student/exams');
      setExams(examsRes.data);

      const holidaysRes = await axios.get('/api/student/holidays');
      setHolidays(holidaysRes.data);

      const feesRes = await axios.get('/api/student/fees');
      setFees(feesRes.data);
    } catch (err) {
      console.error('Error loading academic details', err);
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
  const studentClass = data?.studentClass || { name: 'N/A', department: 'N/A', semester: 1 };

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
            <strong style={{ color: '#fff' }}>{studentClass.name}</strong> ({studentClass.department}) | Semester:{' '}
            <strong style={{ color: 'var(--accent-secondary)' }}>{studentClass.semester}</strong>
          </p>
        </div>
      </div>

      {/* Tabs Selector Header */}
      <div className="tabs-header">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
        >
          <Award size={16} /> Overview
        </button>
        <button
          onClick={() => setActiveTab('EXAMS_TIMETABLE')}
          className={`tab-btn ${activeTab === 'EXAMS_TIMETABLE' ? 'active' : ''}`}
        >
          <BookOpen size={16} /> Exams & Timetable
        </button>
        <button
          onClick={() => setActiveTab('HOLIDAYS')}
          className={`tab-btn ${activeTab === 'HOLIDAYS' ? 'active' : ''}`}
        >
          <Calendar size={16} /> Holidays
        </button>
        <button
          onClick={() => setActiveTab('FEES')}
          className={`tab-btn ${activeTab === 'FEES' ? 'active' : ''}`}
        >
          <CreditCard size={16} /> Fee Dues
        </button>
        <button
          onClick={() => setActiveTab('LEAVES')}
          className={`tab-btn ${activeTab === 'LEAVES' ? 'active' : ''}`}
        >
          <FileText size={16} /> Leave Manager
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="dashboard-grid">
          {/* Circular Stats Chart */}
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

          {/* Notifications Inbox */}
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

          {/* Subject Breakdown Card */}
          <div className="card col-span-12">
            <h3>Subject-wise Attendance Breakdown (Semester {studentClass.semester})</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
              Courses registered for this semester. Maintain above 75% attendance to take exams.
            </p>
            <div className="subject-grid">
              {breakdown.filter(subj => subj.percentage !== undefined).map((subj) => (
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
                      <div className="subject-stat-label">Total Sessions</div>
                      <div className="subject-stat-val">{subj.total}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXAMS & TIMETABLE */}
      {activeTab === 'EXAMS_TIMETABLE' && (
        <div className="dashboard-grid">
          {/* Exams Schedule Card */}
          <div className="card col-span-12">
            <h3>Upcoming Semester Exams Schedule</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Official testing dates scheduled for your current semester subjects.
            </p>
            {exams.length === 0 ? (
              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--glass-border)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No exams scheduled for this semester yet.</p>
              </div>
            ) : (
              <div className="exam-grid">
                {exams.map((ex) => (
                  <div key={ex.id} className="exam-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', background: 'var(--accent-secondary-glow)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          {ex.subject.code}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', marginTop: '6px' }}>{ex.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{ex.subject.name}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Date:</span>
                        <strong style={{ color: '#fff' }}>{new Date(ex.date).toLocaleDateString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Time:</span>
                        <strong style={{ color: '#fff' }}>{ex.startTime} - {ex.endTime}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Venue / Room:</span>
                        <strong style={{ color: 'var(--accent-secondary)' }}>{ex.room}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timetable Slot view */}
          <div className="card col-span-12">
            <h3>Weekly Lecture Timetable</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Your weekly class schedule for Semester {studentClass.semester}.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName, index) => {
                const dayIndex = index + 1;
                const daySlots = timetable.filter(s => s.dayOfWeek === dayIndex);
                return (
                  <div key={dayName} className="timetable-grid" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                    <div className="timetable-day-header">{dayName}</div>
                    <div className="timetable-slots">
                      {daySlots.length === 0 ? (
                        <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No lectures.</div>
                      ) : (
                        daySlots.map(s => (
                          <div key={s.id} className="timetable-slot">
                            <span className="timetable-slot-time">{s.startTime} - {s.endTime}</span>
                            <div className="timetable-slot-subject">{s.subject.name}</div>
                            <div className="timetable-slot-details">
                              <span>{s.subject.teacher.user.name}</span>
                              <span style={{ color: 'var(--accent-secondary)' }}>{s.room}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOLIDAYS */}
      {activeTab === 'HOLIDAYS' && (
        <div className="card col-span-12">
          <h3>Upcoming Academic Holidays</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            List of declared college breaks and national holidays.
          </p>
          {holidays.length === 0 ? (
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--glass-border)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No upcoming holidays declared.</p>
            </div>
          ) : (
            <div className="holiday-grid">
              {holidays.map((hol) => {
                const start = new Date(hol.startDate);
                const end = new Date(hol.endDate);
                const diffTime = Math.abs(start - new Date());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return (
                  <div key={hol.id} className="holiday-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '1.1rem' }}>{hol.name}</h4>
                    </div>
                    {hol.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>"{hol.description}"</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>Duration: <strong style={{ color: '#fff' }}>{start.toLocaleDateString()} - {end.toLocaleDateString()}</strong></div>
                      <div style={{ color: 'var(--color-late)', fontWeight: '600', marginTop: '4px' }}>
                        Starts in {diffDays} days
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FEES PORTAL */}
      {activeTab === 'FEES' && (
        <div className="card col-span-12">
          <h3>Academic Fees Statement</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Monitor outstanding invoices, tuition fees, library balances, and payment histories.
          </p>
          {fees.length === 0 ? (
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--glass-border)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No fee allocations recorded.</p>
            </div>
          ) : (
            <div className="fee-grid">
              {fees.map((fee) => (
                <div key={fee.id} className={`fee-card fee-${fee.status.toLowerCase()}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{fee.description}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Invoiced: {new Date(fee.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${fee.status === 'PAID' ? 'badge-present' : 'badge-absent'}`}>
                      {fee.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount Due</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', color: fee.status === 'PAID' ? 'var(--color-present)' : '#fff' }}>
                        <DollarSign size={18} /> {fee.amount.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Date</span>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: fee.status === 'PENDING' && new Date(fee.dueDate) < new Date() ? 'var(--color-absent)' : '#fff' }}>
                        {new Date(fee.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LEAVE MANAGER */}
      {activeTab === 'LEAVES' && (
        <div className="dashboard-grid">
          {/* Apply Form */}
          <div className="card col-span-6">
            <h3>Apply for Leave</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--text-muted)' }}>
              Submit requests to seek academic leave approvals from class advisors.
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

          {/* Logs */}
          <div className="card col-span-6">
            <h3>Leave Request Logs</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--text-muted)' }}>
              Track approval status of your filed leaves.
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leaveRequests.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No leave requests filed.</p>
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
      )}
    </div>
  );
};

export default StudentDashboard;
