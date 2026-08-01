import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, UserCheck, FileText, Check, X, BookOpen, Calendar, Clock, Layers, History, Settings, Landmark, CreditCard, Trash2 } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab')?.toUpperCase() || 'STATS';

  // Global lists
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Mark Attendance Form
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Teaching timetable schedule
  const [timetable, setTimetable] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Student Leaves
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // Exams, Holidays, and Fees
  const [exams, setExams] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [classes, setClasses] = useState([]);
  const [fees, setFees] = useState([]);
  const [history, setHistory] = useState([]);

  // College Branding configuration
  const [collegeConfig, setCollegeConfig] = useState(null);

  // Notices state (post notice form + list)
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [postingNotice, setPostingNotice] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // 1. Subjects
    try {
      const subRes = await axios.get('/api/teacher/subjects');
      setSubjects(subRes.data);
      if (subRes.data.length > 0) {
        setSelectedSubjectId(subRes.data[0].id);
        if (subRes.data[0].timetable && subRes.data[0].timetable.length > 0) {
          fetchClassStudents(subRes.data[0].timetable[0].classId, subRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching teacher subjects', err);
    }

    // 2. Timetable
    try {
      const ttRes = await axios.get('/api/teacher/timetable');
      setTimetable(ttRes.data);
    } catch (err) {
      console.error('Error fetching teacher timetable', err);
    }

    // 3. Classes
    try {
      const clsRes = await axios.get('/api/teacher/classes');
      setClasses(clsRes.data);
    } catch (err) {
      console.error('Error fetching teacher classes', err);
    }

    // 4. Fees
    try {
      const feeRes = await axios.get('/api/teacher/fees');
      setFees(feeRes.data);
    } catch (err) {
      console.error('Error fetching teacher fees', err);
    }

    // 5. Exams
    try {
      const examRes = await axios.get('/api/teacher/exams');
      setExams(examRes.data);
    } catch (err) {
      console.error('Error fetching teacher exams', err);
    }

    // 6. Holidays
    try {
      const holRes = await axios.get('/api/teacher/holidays');
      setHolidays(holRes.data);
    } catch (err) {
      console.error('Error fetching teacher holidays', err);
    }

    // 7. History
    try {
      const histRes = await axios.get('/api/teacher/attendance-history');
      setHistory(histRes.data);
    } catch (err) {
      console.error('Error fetching teacher history', err);
    }

    // 8. Leaves
    try {
      const leavesRes = await axios.get('/api/teacher/leaves');
      setLeaves(leavesRes.data);
    } catch (err) {
      console.error('Error fetching teacher leaves', err);
    }

    // 9. Config
    try {
      const configRes = await axios.get('/api/college/config');
      setCollegeConfig(configRes.data);
    } catch (err) {
      console.error('Error fetching college config', err);
    }

    // 10. Notices
    try {
      await fetchNotices();
    } catch (err) {
      console.error('Error fetching notices', err);
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

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) {
      showToast('Title and content are required.', 'warning');
      return;
    }
    setPostingNotice(true);
    try {
      await axios.post('/api/notices', { title: noticeTitle, content: noticeContent });
      showToast('Announcement posted successfully.', 'success');
      setNoticeTitle('');
      setNoticeContent('');
      fetchNotices();
    } catch (err) {
      showToast('Failed to post announcement.', 'error');
    } finally {
      setPostingNotice(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`/api/notices/${id}`);
      showToast('Notice deleted successfully.', 'success');
      fetchNotices();
    } catch (err) {
      showToast('Could not delete notice.', 'error');
    }
  };

  const fetchClassStudents = async (classId, subjectId) => {
    setLoadingStudents(true);
    try {
      const res = await axios.get(`/api/teacher/students-by-class/${classId}`);
      setStudents(res.data);

      const defaultRecords = {};
      res.data.forEach((student) => {
        defaultRecords[student.id] = 'PRESENT';
      });
      setAttendanceRecords(defaultRecords);
    } catch (err) {
      console.error(err);
      showToast('Error loading student roster.', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setSelectedSubjectId(subId);
    setSelectedSlot(null);

    const subject = subjects.find(s => s.id === subId);
    const classId = subject?.timetable?.[0]?.classId;
    if (classId) {
      fetchClassStudents(classId, subId);
    } else {
      setStudents([]);
    }
  };

  const selectTimetableSlot = (slot) => {
    setSelectedSlot(slot);
    setSelectedSubjectId(slot.subjectId);
    fetchClassStudents(slot.classId, slot.subjectId);
    showToast(`Loaded roster for class: ${slot.class.name}`, 'info');
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((student) => {
      updated[student.id] = status;
    });
    setAttendanceRecords(updated);
    showToast(`Marked all as ${status.toLowerCase()}.`, 'warning');
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId || students.length === 0) {
      showToast('No class active for marking.', 'warning');
      return;
    }

    setSubmittingAttendance(true);
    try {
      const recordsArray = Object.keys(attendanceRecords).map((studentId) => ({
        studentId,
        status: attendanceRecords[studentId],
      }));

      await axios.post('/api/teacher/attendance', {
        date,
        subjectId: selectedSubjectId,
        records: recordsArray,
      });

      showToast('Attendance records submitted successfully.', 'success');
      // Refresh history log
      const histRes = await axios.get('/api/teacher/attendance-history');
      setHistory(histRes.data);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit attendance.';
      showToast(errMsg, 'error');
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleReviewLeave = async (id, status) => {
    try {
      await axios.put(`/api/teacher/leaves/${id}/status`, { status });
      showToast(`Leave request ${status.toLowerCase()} successfully.`, 'success');
      // Refresh leaves list
      const leavesRes = await axios.get('/api/teacher/leaves');
      setLeaves(leavesRes.data);
    } catch (err) {
      showToast('Could not process leave request.', 'error');
    }
  };

  const getWeekDayNumber = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    const day = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    return day;
  };

  const getDayName = (dayNum) => {
    const days = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
    return days[dayNum] || 'Unknown';
  };

  // Filter lectures for the selected date's day of the week
  const selectedDayNum = getWeekDayNumber(date);
  const scheduledTodaySlots = timetable.filter(slot => slot.dayOfWeek === selectedDayNum);

  return (
    <div className="app-container" style={{ padding: '0px' }}>
      {/* Profile Header */}
      <div className="card profile-card" style={{ marginBottom: '24px' }}>
        <div className="profile-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)' }}>
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{user.name}</h2>
          <p style={{ fontSize: '0.9rem' }}>
            Faculty Employee ID: <strong style={{ color: '#fff' }}>{user.teacher?.employeeId || 'N/A'}</strong>
          </p>
        </div>
      </div>

      {/* TAB 1: OVERVIEW STATS (DASHBOARD) */}
      {activeTab === 'STATS' && (
        <div className="dashboard-grid">
          <div className="card col-span-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', padding: '12px', borderRadius: '12px' }}><BookOpen size={24} /></div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Courses Handled</span>
              <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{subjects.length} Subjects</div>
            </div>
          </div>

          <div className="card col-span-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'var(--accent-secondary-glow)', color: 'var(--accent-secondary)', padding: '12px', borderRadius: '12px' }}><Layers size={24} /></div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Classes Taught</span>
              <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{classes.length} Groups</div>
            </div>
          </div>

          <div className="card col-span-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-absent)', padding: '12px', borderRadius: '12px' }}><FileText size={24} /></div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Leaves Pending</span>
              <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{leaves.filter(l => l.status === 'PENDING').length} Requests</div>
            </div>
          </div>

          {/* invigilations schedule */}
          <div className="card col-span-6">
            <h3>My Course Exams</h3>
            {exams.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No exam invigilations assigned.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {exams.map((ex) => (
                  <div key={ex.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '600' }}>{ex.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {ex.subject.name} ({ex.subject.code})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Date: {new Date(ex.date).toLocaleDateString()} | Time: {ex.startTime} - {ex.endTime} | Venue: {ex.room}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic holidays */}
          <div className="card col-span-6">
            <h3>Upcoming College Recess Breaks</h3>
            {holidays.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No holidays scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {holidays.map((hol) => (
                  <div key={hol.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: '600' }}>{hol.name}</div>
                    {hol.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0' }}>"{hol.description}"</p>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Duration: {new Date(hol.startDate).toLocaleDateString()} - {new Date(hol.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MARK ATTENDANCE (CONNECTED TO CALENDAR SCHEDULE) */}
      {activeTab === 'ATTENDANCE' && (
        <div className="dashboard-grid">
          {/* Calendar connections */}
          <div className="card col-span-4" style={{ height: 'fit-content' }}>
            <h3>Lectures Calendar</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
              Select a date. The system automatically lists the timetable lecture slots scheduled for that weekday.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="attDate">Date Selector</label>
              <input 
                id="attDate" 
                type="date" 
                className="form-input" 
                value={date} 
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                }} 
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Scheduled Lectures ({getDayName(selectedDayNum)}):
              </h4>

              {scheduledTodaySlots.length === 0 ? (
                <div style={{ padding: '16px', border: '1px dashed var(--glass-border)', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No timetable lectures scheduled for this weekday.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {scheduledTodaySlots.map((slot) => (
                    <button 
                      key={slot.id} 
                      type="button" 
                      onClick={() => selectTimetableSlot(slot)}
                      style={{
                        padding: '12px',
                        width: '100%',
                        textAlign: 'left',
                        background: selectedSlot?.id === slot.id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                        border: selectedSlot?.id === slot.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#fff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{slot.startTime} - {slot.endTime}</div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>{slot.subject.name} ({slot.subject.code})</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '4px' }}>Class: {slot.class.name} | Room {slot.room}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Show All Slots fallback option */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  All Course Subjects:
                </h4>
                <div className="form-group">
                  <select 
                    className="form-select" 
                    value={selectedSubjectId} 
                    onChange={handleSubjectChange}
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code}) - Sem {s.semester}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Student attendance list roster */}
          <div className="card col-span-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3>Roll-call Registry</h3>
                {selectedSlot && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-present)', fontWeight: '600' }}>
                    Active Slot: {selectedSlot.subject.code} for Class {selectedSlot.class.name}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => handleMarkAll('PRESENT')} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-present)' }}>All Present</button>
                <button type="button" onClick={() => handleMarkAll('ABSENT')} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-absent)' }}>All Absent</button>
              </div>
            </div>

            {loadingStudents ? (
              <p>Loading student roster...</p>
            ) : students.length === 0 ? (
              <div style={{ padding: '40px', border: '1px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No students roster loaded. Select a lecture slot on the calendar side to start.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAttendance}>
                <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="attendance-list">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Roll No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Student Name</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((st) => (
                        <tr key={st.id} className="attendance-row">
                          <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{st.rollNumber}</td>
                          <td className="attendance-cell">
                            <div style={{ fontWeight: '600' }}>{st.user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.user.email}</div>
                          </td>
                          <td className="attendance-cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div className="status-selector">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'PRESENT')}
                                className={`status-btn status-btn-present ${attendanceRecords[st.id] === 'PRESENT' ? 'active' : ''}`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'LATE')}
                                className={`status-btn status-btn-late ${attendanceRecords[st.id] === 'LATE' ? 'active' : ''}`}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(st.id, 'ABSENT')}
                                className={`status-btn status-btn-absent ${attendanceRecords[st.id] === 'ABSENT' ? 'active' : ''}`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} disabled={submittingAttendance}>
                  <UserCheck size={18} />
                  {submittingAttendance ? 'Saving Attendance Records...' : 'Save & Publish Attendance'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ASSIGNED COURSES */}
      {activeTab === 'COURSES' && (
        <div className="card col-span-12">
          <h3>My Assigned Course Subjects</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            List of academic courses registered under your instruction.
          </p>
          {subjects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No courses assigned to your profile.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="attendance-list">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Course Title</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Code</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Semester Level</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="attendance-row">
                      <td className="attendance-cell" style={{ fontWeight: '600' }}>{sub.name}</td>
                      <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{sub.code}</td>
                      <td className="attendance-cell" style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${sub.type?.toLowerCase() === 'lab' ? 'absent' : 'present'}`}>
                          {sub.type || 'THEORY'}
                        </span>
                      </td>
                      <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '600' }}>Semester {sub.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TEACHING CLASSES */}
      {activeTab === 'CLASSES' && (
        <div className="card col-span-12">
          <h3>Assigned Class Groups</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            List of student class groups you teach in the active term.
          </p>
          {classes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No classes assigned to your subjects.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="attendance-list">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Class Group Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Department</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Semester</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Total Students</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="attendance-row">
                      <td className="attendance-cell" style={{ fontWeight: '600' }}>{cls.name}</td>
                      <td className="attendance-cell" style={{ color: 'var(--text-secondary)' }}>{cls.department}</td>
                      <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent-secondary)' }}>Sem {cls.semester}</td>
                      <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '600' }}>{cls._count?.students || 0} Students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: TIMETABLE SCHEDULE GRID */}
      {activeTab === 'TIMETABLE' && (
        <div className="card col-span-12">
          <h3>My Weekly Teaching Schedule</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Your weekly lecture schedule matching classrooms, classes, and timings.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName, index) => {
              const dayIndex = index + 1;
              const daySlots = timetable.filter(s => s.dayOfWeek === dayIndex);
              return (
                <div key={dayName} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  <h4 style={{ color: 'var(--accent-secondary)', fontWeight: '700', marginBottom: '8px' }}>{dayName}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {daySlots.length === 0 ? (
                      <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No lectures.</div>
                    ) : (
                      daySlots.map(s => (
                        <div key={s.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{s.startTime} - {s.endTime}</span>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>{s.subject.name} ({s.subject.code})</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Class: {s.class.name}</span>
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
      )}

      {/* TAB 6: FEES PORTAL (READ-ONLY BALANCES) */}
      {activeTab === 'FEES' && (
        <div className="card col-span-12">
          <h3>Student Fee Dues Summary</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            List of student payment invoices and balances for classes you instruct.
          </p>
          {fees.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No student fees dues found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="attendance-list">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Student Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Roll No</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Invoice description</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f) => (
                    <tr key={f.id} className="attendance-row">
                      <td className="attendance-cell" style={{ fontWeight: '600' }}>{f.student.user.name}</td>
                      <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{f.student.rollNumber}</td>
                      <td className="attendance-cell" style={{ color: 'var(--text-secondary)' }}>{f.description}</td>
                      <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '700' }}>${f.amount.toFixed(2)}</td>
                      <td className="attendance-cell" style={{ textAlign: 'right' }}>
                        <span className={`badge ${f.status === 'PAID' ? 'badge-present' : 'badge-absent'}`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: ATTENDANCE HISTORY LOGS */}
      {activeTab === 'HISTORY' && (
        <div className="card col-span-12">
          <h3>Marked Attendance Sessions Log</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            History log of roll-calls submitted by you.
          </p>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No history found.</p>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '450px', overflowY: 'auto' }}>
              <table className="attendance-list">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Subject</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Student Name</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((log) => (
                    <tr key={log.id} className="attendance-row">
                      <td className="attendance-cell">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="attendance-cell" style={{ fontWeight: '600' }}>{log.subject.name} ({log.subject.code})</td>
                      <td className="attendance-cell">{log.student.user.name} ({log.student.rollNumber})</td>
                      <td className="attendance-cell" style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${log.status.toLowerCase()}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: LEAVE REQUESTS MANAGER */}
      {activeTab === 'LEAVES' && (
        <div className="card col-span-12">
          <h3>Absence Leave Requests Advisor</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Review pending leave requests filed by students in your class.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaves.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No leaves requests submitted.</p>
            ) : (
              leaves.map((leave) => (
                <div key={leave.id} style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '1.1rem' }}>{leave.student.user.name}</h4>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                        Roll: {leave.student.rollNumber} | Class: {leave.student.class.name}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      "{leave.reason}"
                    </p>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Duration: <strong>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  <div>
                    {leave.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleReviewLeave(leave.id, 'APPROVED')}
                          className="btn btn-primary btn-sm"
                          style={{ background: 'var(--color-present)', color: '#fff', boxShadow: 'none' }}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReviewLeave(leave.id, 'REJECTED')}
                          className="btn btn-danger btn-sm"
                          style={{ background: 'var(--color-absent)', color: '#fff', boxShadow: 'none' }}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`badge badge-${leave.status.toLowerCase()}`}>
                        {leave.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 9: NOTICE BOARD (TEACHERS CAN POST & DELETE ANNOUNCEMENTS) */}
      {activeTab === 'NOTICE' && (
        <div className="dashboard-grid">
          {/* Post Notice Form */}
          <div className="card col-span-5">
            <h3>Post Announcement</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Publish announcements globally to the college notice board. Students can view it instantly.
            </p>
            <form onSubmit={handlePostNotice}>
              <div className="form-group">
                <label className="form-label" htmlFor="nTitle">Notice Title</label>
                <input 
                  id="nTitle" 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Mid-term Exam Syllabus Release" 
                  value={noticeTitle} 
                  onChange={(e) => setNoticeTitle(e.target.value)} 
                  disabled={postingNotice} 
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="nContent">Message Details</label>
                <textarea 
                  id="nContent" 
                  className="form-textarea" 
                  rows="5" 
                  placeholder="Type announcement details here..." 
                  value={noticeContent} 
                  onChange={(e) => setNoticeContent(e.target.value)} 
                  disabled={postingNotice} 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={postingNotice}>
                Publish Notice
              </button>
            </form>
          </div>

          {/* Past Announcements list */}
          <div className="card col-span-7">
            <h3>Active Notice Board Listings</h3>
            {loadingNotices ? (
              <p>Loading notices...</p>
            ) : notices.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Notice board is currently clear.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '520px', overflowY: 'auto' }}>
                {notices.map((n) => (
                  <div key={n.id} style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--glass-border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>{n.title}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Posted: {new Date(n.createdAt).toLocaleDateString()} | By: {n.postedBy}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteNotice(n.id)} 
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: '6px', color: 'var(--color-absent)' }}
                        title="Delete Announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 10: BRANDING CONFIG INFO */}
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

      {/* TAB 11: PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="card col-span-12" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div className="profile-avatar" style={{ margin: '0 auto 20px', width: '80px', height: '80px', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-primary) 100%)' }}>
            {user?.name?.charAt(0) || 'T'}
          </div>
          <h3 style={{ marginBottom: '4px' }}>Instructor Profile</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Faculty Credentials & Assigned Course Summary
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</span>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '4px' }}>{user?.name}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</span>
              <div style={{ fontWeight: '600', marginTop: '4px' }}>{user?.email}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Faculty Employee ID</span>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '4px', color: 'var(--accent-secondary)' }}>{user?.teacher?.employeeId || 'N/A'}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subjects Under Instruction</span>
              <div style={{ fontWeight: '600', marginTop: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {subjects.length > 0 ? (
                  <ul style={{ paddingLeft: '20px', margin: '4px 0 0 0' }}>
                    {subjects.map(sub => (
                      <li key={sub.id} style={{ marginBottom: '4px' }}>
                        <strong>{sub.code}</strong> - {sub.name} [Sem {sub.semester}]
                      </li>
                    ))}
                  </ul>
                ) : (
                  'No subjects assigned'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
