import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { Award, Calendar, FileText, Send, CheckCircle, Clock, AlertTriangle, Bell, Check, BookOpen, MapPin, ShieldAlert, CreditCard, IndianRupee, Layers, Settings, Landmark } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab')?.toUpperCase() || 'STATS';

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

  // Classmates directory
  const [classmates, setClassmates] = useState([]);
  const [studentClassInfo, setStudentClassInfo] = useState(null);

  // Notices
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

  // Branding config
  const [collegeConfig, setCollegeConfig] = useState(null);

  // Calendar Planner states
  const [plannerDate, setPlannerDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateAttendance, setDateAttendance] = useState([]);
  const [loadingDateAtt, setLoadingDateAtt] = useState(false);
  const [bunkSessions, setBunkSessions] = useState(1);
  const [targetPercentage, setTargetPercentage] = useState(75);

  useEffect(() => {
    if (activeTab === 'CALENDAR') {
      fetchDateAttendance(plannerDate);
    }
  }, [plannerDate, activeTab]);

  const fetchDateAttendance = async (targetDate) => {
    setLoadingDateAtt(true);
    try {
      const res = await axios.get(`/api/student/attendance-by-date?date=${targetDate}`);
      setDateAttendance(res.data);
    } catch (err) {
      console.error('Error fetching date attendance', err);
    } finally {
      setLoadingDateAtt(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    fetchAdditionalData();
    fetchClassmates();
    fetchNotices();
    fetchCollegeConfig();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await axios.get('/api/student/attendance');
      setData(statsRes.data);
    } catch (err) {
      console.error('Error fetching student stats', err);
    }

    try {
      const leavesRes = await axios.get('/api/student/leaves');
      setLeaveRequests(leavesRes.data);
    } catch (err) {
      console.error('Error fetching student leaves', err);
    }

    setLoading(false);
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
    } catch (err) {
      console.error('Error fetching student timetable', err);
    }

    try {
      const examsRes = await axios.get('/api/student/exams/marks');
      setExams(examsRes.data);
    } catch (err) {
      console.error('Error fetching student exam marks', err);
    }

    try {
      const holidaysRes = await axios.get('/api/student/holidays');
      setHolidays(holidaysRes.data);
    } catch (err) {
      console.error('Error fetching student holidays', err);
    }

    try {
      const feesRes = await axios.get('/api/student/fees');
      setFees(feesRes.data);
    } catch (err) {
      console.error('Error fetching student fees', err);
    }
  };

  const fetchClassmates = async () => {
    try {
      const res = await axios.get('/api/student/classmates');
      setClassmates(res.data.classmates);
      setStudentClassInfo(res.data.class);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotices = async () => {
    setLoadingNotices(true);
    try {
      const res = await axios.get('/api/notices');
      setNotices(res.data);
    } catch (err) {
      console.error('Error fetching notices', err);
    } finally {
      setLoadingNotices(false);
    }
  };

  const fetchCollegeConfig = async () => {
    try {
      const res = await axios.get('/api/college/config');
      setCollegeConfig(res.data);
    } catch (err) {
      console.error(err);
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



  return (
    <div className="app-container" style={{ padding: '0px' }}>
      {/* Profile summary card */}
      <div className="card profile-card" style={{ marginBottom: '24px' }}>
        <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)' }}>
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{user.name}</h2>
          <p style={{ fontSize: '0.9rem' }}>
            Roll No: <strong style={{ color: '#fff' }}>{user.student?.rollNumber || 'N/A'}</strong> | Class:{' '}
            <strong style={{ color: '#fff' }}>{studentClass.name}</strong> ({studentClass.department}) | Semester:{' '}
            <strong style={{ color: 'var(--accent-secondary)' }}>Sem {studentClass.semester}</strong>
          </p>
        </div>
      </div>

      {/* TAB 1: OVERVIEW STATS (DASHBOARD) */}
      {activeTab === 'STATS' && (
        <div className="dashboard-grid">
          {/* Circular Stats Chart */}
          <div className="card col-span-4" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Overall Attendance
            </h3>
            <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {summary.percentage}%
              </div>
              <div style={{ 
                marginTop: '12px', 
                padding: '6px 14px', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                textTransform: 'uppercase',
                background: summary.percentage >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: summary.percentage >= 75 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                color: summary.percentage >= 75 ? 'var(--color-present)' : 'var(--color-absent)' 
              }}>
                {summary.percentage >= 75 ? 'Good Standing' : 'Low Attendance'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-present)', fontWeight: '600' }}>Present</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '4px' }}>{summary.present}</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sessions</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-late)', fontWeight: '600' }}>Late</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '4px' }}>{summary.late}</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sessions</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 4px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-absent)', fontWeight: '600' }}>Absent</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '4px' }}>{summary.absent}</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sessions</span>
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total Term Attendance: <strong>{summary.total}</strong> registered sessions
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
            <h3>Attendance Progress Breakdown</h3>
            <div className="subject-grid" style={{ marginTop: '16px' }}>
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

          {/* Bunk & Attendance Estimator */}
          <div className="card col-span-12" style={{ marginTop: '24px' }}>
            <h3>Bunk & Attendance Calculator</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Estimate the impact of skip sessions (bunks) or calculate how many consecutive classes you need to attend to hit your goal.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Skip Estimator */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ fontWeight: '700', marginBottom: '12px' }}>Bunk Estimator</h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="bunkInput">Bunk (Skip) Upcoming Sessions</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                      id="bunkInput"
                      type="range" 
                      min="1" 
                      max="20" 
                      className="form-input" 
                      style={{ flex: 1, padding: 0 }}
                      value={bunkSessions} 
                      onChange={(e) => setBunkSessions(parseInt(e.target.value))} 
                    />
                    <strong style={{ fontSize: '1.2rem', width: '40px', textAlign: 'right' }}>{bunkSessions}</strong>
                  </div>
                </div>

                {(() => {
                  const P = summary.present + summary.late;
                  const T = summary.total;
                  const estTotal = T + bunkSessions;
                  const estPercentage = estTotal > 0 ? Math.round((P / estTotal) * 100) : 100;
                  const isSafe = estPercentage >= 75;

                  return (
                    <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: isSafe ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: isSafe ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Attendance:</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: isSafe ? 'var(--color-present)' : 'var(--color-absent)', margin: '4px 0' }}>
                        {estPercentage}%
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: isSafe ? 'var(--color-present)' : 'var(--color-absent)' }}>
                        {isSafe ? '✓ Safe: Still above 75% threshold' : '⚠️ Warning: Drops below 75% attendance threshold!'}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Goal Tracker */}
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ fontWeight: '700', marginBottom: '12px' }}>Goal Planner</h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="goalSelect">Target Threshold (%)</label>
                  <select 
                    id="goalSelect"
                    className="form-select" 
                    value={targetPercentage} 
                    onChange={(e) => setTargetPercentage(parseInt(e.target.value))}
                  >
                    <option value={75}>75% (Minimum Passing)</option>
                    <option value={80}>80% (Good Standing)</option>
                    <option value={85}>85% (Excellent Standing)</option>
                    <option value={90}>90% (Distinction Goal)</option>
                  </select>
                </div>

                {(() => {
                  const P = summary.present + summary.late;
                  const T = summary.total;
                  const currentPct = T > 0 ? (P / T) * 100 : 100;

                  if (currentPct < targetPercentage) {
                    const needed = Math.ceil((targetPercentage * T - 100 * P) / (100 - targetPercentage));
                    const safeNeeded = needed > 0 ? needed : 0;
                    return (
                      <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', color: 'var(--accent-secondary)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Action Required:</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', marginTop: '6px' }}>
                          Attend <span style={{ fontSize: '1.4rem', color: '#fff' }}>{safeNeeded}</span> consecutive classes
                        </div>
                        <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.9 }}>
                          To raise your overall attendance from {summary.percentage}% to {targetPercentage}%.
                        </p>
                      </div>
                    );
                  } else {
                    const bunks = Math.floor((100 * P - targetPercentage * T) / targetPercentage);
                    const safeBunks = bunks > 0 ? bunks : 0;
                    return (
                      <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--color-present)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bunk Allowance:</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', marginTop: '6px' }}>
                          You can bunk <span style={{ fontSize: '1.4rem', color: '#fff' }}>{safeBunks}</span> classes
                        </div>
                        <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.9 }}>
                          consecutively without falling below your target of {targetPercentage}%.
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSES LIST */}
      {activeTab === 'COURSES' && (
        <div className="card col-span-12">
          <h3>Registered Course Subjects</h3>
          {breakdown.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No subjects found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="attendance-list">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Subject Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Subject Code</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Semester</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Course Instructor</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((subj) => (
                    <tr key={subj.subjectId} className="attendance-row">
                      <td className="attendance-cell" style={{ fontWeight: '600' }}>{subj.subjectName}</td>
                      <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{subj.subjectCode}</td>
                      <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '600' }}>Sem {studentClass.semester}</td>
                      <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '500' }}>{subj.teacherName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLASSES (CLASSMATES DIRECTORY) */}
      {activeTab === 'CLASSES' && (
        <div className="dashboard-grid">
          <div className="card col-span-4" style={{ height: 'fit-content' }}>
            <h3>Class Details</h3>
            {studentClassInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class Name</span>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{studentClassInfo.name}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Department</span>
                  <div style={{ fontWeight: '600' }}>{studentClassInfo.department}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Semester</span>
                  <div style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>Semester {studentClassInfo.semester}</div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Loading class details...</p>
            )}
          </div>

          <div className="card col-span-8">
            <h3>Classmates Directory ({classmates.length} Enrolled)</h3>
            {classmates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No classmates found.</p>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table className="attendance-list">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Roll Number</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Student Name</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Email Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classmates.map((st) => (
                      <tr key={st.id} className="attendance-row">
                        <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{st.rollNumber}</td>
                        <td className="attendance-cell" style={{ fontWeight: '600' }}>{st.user.name} {st.id === user.student?.id && '(You)'}</td>
                        <td className="attendance-cell" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{st.user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TIMETABLE WEEKLY GRID */}
      {activeTab === 'TIMETABLE' && (
        <div className="dashboard-grid">
          {/* Exams Schedule Card */}
          <div className="card col-span-4" style={{ height: 'fit-content' }}>
            <h3>Exams Schedule Calendar</h3>
            {exams.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>No upcoming exams scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {exams.map((ex) => (
                  <div key={ex.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-secondary)' }}>{ex.subject.code}</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>{ex.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(ex.date).toLocaleDateString()} | {ex.startTime} - {ex.endTime} | Venue: {ex.room}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card col-span-8">
            <h3>Weekly Lecture Timetable Schedule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName, index) => {
                const dayIndex = index + 1;
                const daySlots = timetable.filter(s => s.dayOfWeek === dayIndex);
                return (
                  <div key={dayName} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                    <h4 style={{ color: 'var(--accent-secondary)', fontWeight: '700', marginBottom: '8px' }}>{dayName}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {daySlots.length === 0 ? (
                        <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No lectures.</div>
                      ) : (
                        daySlots.map(s => (
                          <div key={s.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{s.startTime} - {s.endTime}</span>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>{s.subject.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{s.subject.teacher?.user?.name || 'TBA'}</span>
                              <span style={{ fontWeight: '700' }}>{s.room}</span>
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

      {/* TAB 5: FEES DUES */}
      {activeTab === 'FEES' && (
        <div className="card col-span-12">
          <h3>Academic Fees Statement</h3>
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
                        <IndianRupee size={18} /> {fee.amount.toFixed(2)}
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

      {/* TAB 6: LEAVES MANAGER */}
      {activeTab === 'LEAVES' && (
        <div className="dashboard-grid">
          {/* Apply Form */}
          <div className="card col-span-6">
            <h3>Apply for Leave</h3>
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

      {/* TAB 7: NOTICE BOARD (STUDENTS VIEW NOTICE BOARD) */}
      {activeTab === 'NOTICE' && (
        <div className="card col-span-12">
          <h3>College Notice Board</h3>

          {loadingNotices ? (
            <p>Loading notices...</p>
          ) : notices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Notice board is currently clear.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {notices.map((n) => (
                <div key={n.id} style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--glass-border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff' }}>{n.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {n.content}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>
                    <span>Posted by:</span>
                    <strong>{n.postedBy}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: BRANDING (SPECIFICATIONS) */}
      {activeTab === 'BRANDING' && (
        <div className="card col-span-12" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={22} style={{ color: 'var(--accent-primary)' }} />
            College Institution Details
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Institution registration profiles and active academic year configuration.
          </p>
          
          {collegeConfig ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Institution Name</span>
                <div style={{ fontWeight: '700', fontSize: '1.15rem', marginTop: '4px' }}>{collegeConfig.name}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>College Code</span>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '4px', color: 'var(--accent-secondary)' }}>{collegeConfig.code}</div>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Term / Year</span>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '4px' }}>{collegeConfig.academicYear}</div>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Loading college branding specifications...</p>
          )}
        </div>
      )}

      {/* TAB 9: PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="card col-span-12" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div className="profile-avatar" style={{ margin: '0 auto 20px', width: '80px', height: '80px', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)' }}>
            {user?.name?.charAt(0) || 'S'}
          </div>
          <h3 style={{ marginBottom: '16px' }}>Student Profile</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</span>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '4px' }}>{user?.name}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</span>
              <div style={{ fontWeight: '600', marginTop: '4px' }}>{user?.email}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll Number</span>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '4px', color: 'var(--accent-secondary)' }}>{user?.student?.rollNumber || 'N/A'}</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Semester</span>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '4px' }}>Semester {studentClass?.semester || 1}</div>
              </div>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class Group / Department</span>
              <div style={{ fontWeight: '600', marginTop: '4px' }}>
                {studentClass?.name} ({studentClass?.department})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: CALENDAR PLANNER */}
      {activeTab === 'CALENDAR' && (() => {
        const isDateValid = (() => {
          if (!collegeConfig || !collegeConfig.semesterStart || !collegeConfig.semesterEnd) return true;
          const target = new Date(plannerDate);
          target.setUTCHours(0, 0, 0, 0);
          const start = new Date(collegeConfig.semesterStart);
          start.setUTCHours(0, 0, 0, 0);
          const end = new Date(collegeConfig.semesterEnd);
          end.setUTCHours(23, 59, 59, 999);
          return target >= start && target <= end;
        })();

        const weekDaysName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeekVal = new Date(plannerDate).getDay();
        const clickedDayName = weekDaysName[dayOfWeekVal];
        
        // Match weekday to timetable (1 = Mon, ..., 5 = Fri)
        const scheduledLectures = timetable.filter(s => s.dayOfWeek === dayOfWeekVal);
        const todayString = new Date().toISOString().split('T')[0];
        const isFutureDate = plannerDate > todayString;

        return (
          <div className="dashboard-grid">
            <div className="card col-span-5">
              <h3>Academic Calendar Tracker</h3>

              <div className="form-group">
                <label className="form-label" htmlFor="planDate">Choose Date</label>
                <input 
                  id="planDate" 
                  type="date" 
                  className="form-input" 
                  value={plannerDate} 
                  onChange={(e) => setPlannerDate(e.target.value)} 
                />
              </div>

              {/* Semester Validity Box */}
              <div style={{ marginTop: '20px' }}>
                {isDateValid ? (
                  <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', color: 'var(--color-present)' }}>
                    <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={18} /> Active Semester Timeline
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.9 }}>
                      This date is within the registered term dates: <strong>{new Date(collegeConfig?.semesterStart).toLocaleDateString()}</strong> to <strong>{new Date(collegeConfig?.semesterEnd).toLocaleDateString()}</strong>.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', color: 'var(--color-absent)' }}>
                    <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} /> Outside Semester Timeline
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.9 }}>
                      Warning: Selected date falls outside academic term limits: <strong>{collegeConfig ? new Date(collegeConfig.semesterStart).toLocaleDateString() : 'N/A'}</strong> to <strong>{collegeConfig ? new Date(collegeConfig.semesterEnd).toLocaleDateString() : 'N/A'}</strong>.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card col-span-7">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Schedule & Attendance for {clickedDayName}</h3>
                {isFutureDate && <span className="badge badge-pending">Future Date</span>}
              </div>

              {loadingDateAtt ? (
                <p>Loading session logs...</p>
              ) : scheduledLectures.length === 0 ? (
                <div style={{ padding: '40px', border: '1px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No timetable lectures scheduled for {clickedDayName}s.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scheduledLectures.map((slot) => {
                    // Match attendance status from response
                    const attRecord = dateAttendance.find(r => r.subjectId === slot.subjectId);
                    
                    let statusLabel = 'No attendance marked';
                    let statusBadgeClass = 'pending';

                    if (isFutureDate) {
                      statusLabel = 'Scheduled (Future Slot)';
                      statusBadgeClass = 'pending';
                    } else if (attRecord) {
                      statusLabel = attRecord.status;
                      statusBadgeClass = attRecord.status.toLowerCase();
                    }

                    return (
                      <div key={slot.id} style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {slot.startTime} - {slot.endTime} | Room: {slot.room}
                          </span>
                          <h4 style={{ fontWeight: '600', marginTop: '4px' }}>{slot.subject.name} ({slot.subject.code})</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Instructor: {slot.subject.teacher?.user?.name || 'TBA'}
                          </p>
                        </div>

                        <span className={`badge badge-${statusBadgeClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* TAB: HOLIDAYS */}
      {activeTab === 'HOLIDAYS' && (
        <div className="card col-span-12">
          <h3>Upcoming College Recess Breaks</h3>
          {holidays.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No recess breaks or holidays scheduled currently.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {holidays.map((hol) => (
                <div key={hol.id} style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--glass-border)',
                }}>
                  <h4 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>{hol.name}</h4>
                  {hol.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>"{hol.description}"</p>}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div>Start Date: <strong>{new Date(hol.startDate).toLocaleDateString()}</strong></div>
                    <div style={{ marginTop: '4px' }}>End Date: <strong>{new Date(hol.endDate).toLocaleDateString()}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* TAB: EXAM MARKS */}
      {activeTab === 'MARKS' && (
        <div className="card col-span-12">
          <h3>Academic Exam Marks</h3>

          {exams.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No exam records published currently.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="attendance-list">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Subject</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Exam Name</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Date & Time</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Room</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Marks Obtained</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((ex) => {
                    const percentage = ex.isPublished ? Math.round((ex.marks / ex.maxMarks) * 100) : null;
                    let marksColor = 'var(--text-primary)';
                    let marksLabel = `${ex.marks} / ${ex.maxMarks}`;

                    if (!ex.isPublished) {
                      marksColor = 'var(--text-muted)';
                      marksLabel = 'Awaiting';
                    } else if (percentage >= 75) {
                      marksColor = 'var(--color-present)';
                    } else if (percentage < 40) {
                      marksColor = 'var(--color-absent)';
                    }

                    return (
                      <tr key={ex.examId} className="attendance-row">
                        <td className="attendance-cell">
                          <div style={{ fontWeight: '600' }}>{ex.subjectName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.subjectCode}</div>
                        </td>
                        <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>
                          {ex.examName}
                        </td>
                        <td className="attendance-cell" style={{ textAlign: 'center' }}>
                          <div>{new Date(ex.date).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {ex.startTime} - {ex.endTime}
                          </div>
                        </td>
                        <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '600' }}>{ex.room}</td>
                        <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '800', color: marksColor }}>
                          {marksLabel}
                          {ex.isPublished && (
                            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: '500', color: 'var(--text-muted)', marginTop: '2px' }}>
                              ({percentage}%)
                            </span>
                          )}
                        </td>
                        <td className="attendance-cell" style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {ex.isPublished ? (ex.remarks || 'No remarks') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {/* TAB: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="card col-span-12" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>App Settings & Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            {/* Theme selector */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>Visual Theme</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Customize the color palette of your academic dashboard shell.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <button type="button" className="btn btn-secondary btn-sm" style={{ border: '1px solid var(--accent-primary)', color: '#fff' }}>🌌 Slate Midnight (Active)</button>
                <button type="button" onClick={() => showToast('Theme changed to Cyber Purple! (Simulation)', 'success')} className="btn btn-secondary btn-sm">👾 Cyber Purple</button>
                <button type="button" onClick={() => showToast('Theme changed to Forest Emerald! (Simulation)', 'success')} className="btn btn-secondary btn-sm">🌲 Forest Emerald</button>
                <button type="button" onClick={() => showToast('Theme changed to Oceanic Glass! (Simulation)', 'success')} className="btn btn-secondary btn-sm">🌊 Oceanic Glass</button>
              </div>
            </div>

            {/* Notification settings */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '12px' }}>Alert Preferences</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem' }}>Push Notifications for attendance</span>
                  <input type="checkbox" defaultChecked onChange={(e) => showToast(e.target.checked ? 'Push alerts enabled!' : 'Push alerts disabled!', 'info')} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.85rem' }}>Email alerts for fee invoices & gradebook</span>
                  <input type="checkbox" defaultChecked onChange={(e) => showToast(e.target.checked ? 'Email notifications enabled!' : 'Email notifications disabled!', 'info')} />
                </label>
              </div>
            </div>

            {/* Language settings */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>Locale Settings</h4>
              <select className="form-select" defaultValue="en" onChange={(e) => showToast(`Locale changed to: ${e.target.value.toUpperCase()}`, 'success')}>
                <option value="en">English (US/IN)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="es">Español (Spanish)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
