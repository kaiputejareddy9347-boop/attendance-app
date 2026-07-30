import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, UserCheck, FileText, Check, X, BookOpen, Calendar, Clock } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ATTENDANCE');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Form fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Leave requests
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // Exams and Holidays
  const [exams, setExams] = useState([]);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    fetchTeacherSubjects();
    fetchLeaves();
    fetchAdditionalData();
  }, []);

  const fetchTeacherSubjects = async () => {
    try {
      const res = await axios.get('/api/teacher/subjects');
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSelectedSubjectId(res.data[0].id);
        fetchClassStudents(res.data[0].timetable[0]?.classId, res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not load assigned subjects.', 'error');
    }
  };

  const fetchLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const res = await axios.get('/api/teacher/leaves');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchAdditionalData = async () => {
    try {
      const examsRes = await axios.get('/api/teacher/exams');
      setExams(examsRes.data);

      const holRes = await axios.get('/api/teacher/holidays');
      setHolidays(holRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setSelectedSubjectId(subId);
    
    const subject = subjects.find(s => s.id === subId);
    const classId = subject?.timetable[0]?.classId;
    if (classId) {
      fetchClassStudents(classId, subId);
    } else {
      setStudents([]);
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
      showToast('Error loading class student roster.', 'error');
    } finally {
      setLoadingStudents(false);
    }
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
    showToast(`Marked all students as ${status.toLowerCase()}.`, 'warning');
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
      fetchLeaves();
    } catch (err) {
      showToast('Could not process leave request.', 'error');
    }
  };

  return (
    <div className="app-container">
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

      {/* Tabs Header */}
      <div className="tabs-header">
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`tab-btn ${activeTab === 'ATTENDANCE' ? 'active' : ''}`}
        >
          <ClipboardCheck size={16} /> Mark Attendance
        </button>
        <button
          onClick={() => setActiveTab('EXAMS_HOLIDAYS')}
          className={`tab-btn ${activeTab === 'EXAMS_HOLIDAYS' ? 'active' : ''}`}
        >
          <BookOpen size={16} /> Exams & Holidays
        </button>
        <button
          onClick={() => setActiveTab('LEAVES')}
          className={`tab-btn ${activeTab === 'LEAVES' ? 'active' : ''}`}
        >
          <FileText size={16} /> Student Leaves
          {leaves.filter(l => l.status === 'PENDING').length > 0 && (
            <span style={{ background: 'var(--color-absent)', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '50%', marginLeft: '4px' }}>
              {leaves.filter(l => l.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ATTENDANCE */}
      {activeTab === 'ATTENDANCE' && (
        <div className="dashboard-grid">
          <div className="card col-span-12">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3>Roll-call Registry</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => handleMarkAll('PRESENT')} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-present)' }}>All Present</button>
                <button type="button" onClick={() => handleMarkAll('ABSENT')} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-absent)' }}>All Absent</button>
              </div>
            </div>

            <form onSubmit={handleSubmitAttendance}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="subject">Subject / Class</label>
                  <select
                    id="subject"
                    className="form-select"
                    value={selectedSubjectId}
                    onChange={handleSubjectChange}
                  >
                    {subjects.length === 0 ? (
                      <option value="">No subjects assigned</option>
                    ) : (
                      subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code}) - Sem {sub.semester}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="date">Session Date</label>
                  <input
                    id="date"
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {loadingStudents ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p>Loading student roster...</p>
                </div>
              ) : students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No students enrolled in this class group.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table className="attendance-list">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Roll No</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Student Name</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status Toggle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="attendance-row">
                          <td className="attendance-cell" style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>
                            {student.rollNumber}
                          </td>
                          <td className="attendance-cell">
                            <div style={{ fontWeight: '600' }}>{student.user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.user?.email}</div>
                          </td>
                          <td className="attendance-cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div className="status-selector">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                className={`status-btn status-btn-present ${attendanceRecords[student.id] === 'PRESENT' ? 'active' : ''}`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'LATE')}
                                className={`status-btn status-btn-late ${attendanceRecords[student.id] === 'LATE' ? 'active' : ''}`}
                              >
                                Late
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                className={`status-btn status-btn-absent ${attendanceRecords[student.id] === 'ABSENT' ? 'active' : ''}`}
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
              )}

              {students.length > 0 && (
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submittingAttendance}>
                  <UserCheck size={18} />
                  {submittingAttendance ? 'Saving Records...' : 'Save & Publish Attendance'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: EXAMS & HOLIDAYS */}
      {activeTab === 'EXAMS_HOLIDAYS' && (
        <div className="dashboard-grid">
          {/* Invigilation Schedule */}
          <div className="card col-span-6">
            <h3>My Course Exams Schedule</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Scheduled exam sessions for courses you teach.
            </p>
            {exams.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exams scheduled for your courses.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {exams.map((ex) => (
                  <div key={ex.id} className="exam-card">
                    <span style={{ fontSize: '0.75rem', background: 'var(--accent-secondary-glow)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      {ex.subject.code}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', marginTop: '6px' }}>{ex.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{ex.subject.name}</p>
                    <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Date: <strong>{new Date(ex.date).toLocaleDateString()}</strong></span>
                      <span>Time: <strong>{ex.startTime} - {ex.endTime}</strong></span>
                      <span>Room: <strong style={{ color: 'var(--accent-secondary)' }}>{ex.room}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Academic Holidays */}
          <div className="card col-span-6">
            <h3>Academic Holidays</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Upcoming college breaks and recess periods.
            </p>
            {holidays.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No upcoming holidays declared.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {holidays.map((hol) => (
                  <div key={hol.id} className="holiday-card">
                    <h4>{hol.name}</h4>
                    {hol.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0' }}>"{hol.description}"</p>}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Duration: <strong>{new Date(hol.startDate).toLocaleDateString()} - {new Date(hol.endDate).toLocaleDateString()}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LEAVES */}
      {activeTab === 'LEAVES' && (
        <div className="card col-span-12">
          <h3>Student Leaves Advisor</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Review pending leave requests and approve/reject absences.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingLeaves ? (
              <p>Loading leave requests...</p>
            ) : leaves.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No student leave requests recorded.</p>
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
    </div>
  );
};

export default TeacherDashboard;
