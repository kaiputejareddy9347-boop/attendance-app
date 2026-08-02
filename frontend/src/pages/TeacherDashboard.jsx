import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { ClipboardCheck, UserCheck, FileText, Check, X, BookOpen, Calendar, Clock, Layers, History, Settings, Landmark, CreditCard, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

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
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [attendanceMarkedAt, setAttendanceMarkedAt] = useState(null);

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

  // Unit PDFs state for assigned subjects
  const [teacherPdfs, setTeacherPdfs] = useState(() => {
    try {
      const saved = localStorage.getItem('college_teacher_pdfs');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const handleAddPdf = (subjectId, subjectCode) => {
    const pdfName = prompt(`Enter Unit PDF Title for ${subjectCode} (e.g. Unit 1: Advanced Algorithms Notes):`);
    if (!pdfName) return;

    const currentPdfs = teacherPdfs[subjectId] || [];
    const newPdf = {
      id: Date.now().toString(),
      title: pdfName,
      uploadedAt: new Date().toLocaleDateString(),
      fileName: `${subjectCode}_${pdfName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    };

    const updated = {
      ...teacherPdfs,
      [subjectId]: [...currentPdfs, newPdf]
    };

    setTeacherPdfs(updated);
    localStorage.setItem('college_teacher_pdfs', JSON.stringify(updated));
    showToast(`Successfully uploaded "${pdfName}" for ${subjectCode}!`, 'success');
  };

  const handleRemovePdf = (subjectId, pdfId) => {
    if (!confirm('Are you sure you want to remove this PDF?')) return;
    const currentPdfs = teacherPdfs[subjectId] || [];
    const updatedPdfs = currentPdfs.filter(p => p.id !== pdfId);
    const updated = {
      ...teacherPdfs,
      [subjectId]: updatedPdfs
    };
    setTeacherPdfs(updated);
    localStorage.setItem('college_teacher_pdfs', JSON.stringify(updated));
    showToast('PDF note removed.', 'info');
  };
  const [postingNotice, setPostingNotice] = useState(false);

  // Calendar Planner states
  const [plannerDate, setPlannerDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateAttendance, setDateAttendance] = useState([]);
  const [loadingDateAtt, setLoadingDateAtt] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marksRoster, setMarksRoster] = useState([]);
  const [loadingMarksRoster, setLoadingMarksRoster] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  useEffect(() => {
    if (activeTab === 'CALENDAR') {
      fetchDateAttendance(plannerDate);
    }
  }, [plannerDate, activeTab]);

  const fetchDateAttendance = async (targetDate) => {
    setLoadingDateAtt(true);
    try {
      const res = await axios.get(`/api/teacher/attendance-by-date?date=${targetDate}`);
      setDateAttendance(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching date attendance logs', err);
      setDateAttendance([]);
    } finally {
      setLoadingDateAtt(false);
    }
  };

  const fetchTeacherExams = async () => {
    setLoadingExams(true);
    try {
      const res = await axios.get('/api/teacher/exams');
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching teacher exams', err);
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchExamMarksRoster = async (examId) => {
    setLoadingMarksRoster(true);
    try {
      const res = await axios.get(`/api/teacher/exams/${examId}/marks`);
      setSelectedExam(res.data?.exam || null);
      setMarksRoster(Array.isArray(res.data?.students) ? res.data.students : []);
    } catch (err) {
      console.error('Error fetching marks roster', err);
      showToast('Failed to load students roster.', 'error');
      setMarksRoster([]);
    } finally {
      setLoadingMarksRoster(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksRoster(prev => prev.map(m => m.studentId === studentId ? { ...m, [field]: value } : m));
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    setSavingMarks(true);
    try {
      const payload = marksRoster.map(r => ({
        studentId: r.studentId,
        marks: r.marks === '' ? 0 : parseFloat(r.marks),
        maxMarks: parseFloat(r.maxMarks || 100),
        remarks: r.remarks || '',
      }));
      await axios.post(`/api/teacher/exams/${selectedExam.id}/marks`, { marks: payload });
      showToast('Exam marks saved and published successfully.', 'success');
      fetchExamMarksRoster(selectedExam.id);
    } catch (err) {
      console.error('Error saving marks', err);
      showToast('Failed to save exam marks.', 'error');
    } finally {
      setSavingMarks(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // 1. Subjects
    try {
      const subRes = await axios.get('/api/teacher/subjects');
      const subData = Array.isArray(subRes.data) ? subRes.data : [];
      setSubjects(subData);
      if (subData.length > 0) {
        setSelectedSubjectId(subData[0].id);
        if (subData[0].timetable && subData[0].timetable.length > 0) {
          fetchClassStudents(subData[0].timetable[0].classId, subData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching teacher subjects', err);
      setSubjects([]);
    }

    // 2. Timetable
    try {
      const ttRes = await axios.get('/api/teacher/timetable');
      setTimetable(Array.isArray(ttRes.data) ? ttRes.data : []);
    } catch (err) {
      console.error('Error fetching teacher timetable', err);
      setTimetable([]);
    }

    // 3. Classes
    try {
      const clsRes = await axios.get('/api/teacher/classes');
      setClasses(Array.isArray(clsRes.data) ? clsRes.data : []);
    } catch (err) {
      console.error('Error fetching teacher classes', err);
      setClasses([]);
    }

    // 4. Fees
    try {
      const feeRes = await axios.get('/api/teacher/fees');
      setFees(Array.isArray(feeRes.data) ? feeRes.data : []);
    } catch (err) {
      console.error('Error fetching teacher fees', err);
      setFees([]);
    }

    // 5. Exams
    try {
      const examRes = await axios.get('/api/teacher/exams');
      setExams(Array.isArray(examRes.data) ? examRes.data : []);
    } catch (err) {
      console.error('Error fetching teacher exams', err);
      setExams([]);
    }

    // 6. Holidays
    try {
      const holRes = await axios.get('/api/teacher/holidays');
      setHolidays(Array.isArray(holRes.data) ? holRes.data : []);
    } catch (err) {
      console.error('Error fetching teacher holidays', err);
      setHolidays([]);
    }

    // 7. History
    try {
      const histRes = await axios.get('/api/teacher/attendance-history');
      setHistory(Array.isArray(histRes.data) ? histRes.data : []);
    } catch (err) {
      console.error('Error fetching teacher history', err);
      setHistory([]);
    }

    // 8. Leaves
    try {
      const leavesRes = await axios.get('/api/teacher/leaves');
      setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
    } catch (err) {
      console.error('Error fetching teacher leaves', err);
      setLeaves([]);
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
      setNotices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching notices', err);
      setNotices([]);
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

  const fetchClassStudents = async (classId, subjectId, dateParam) => {
    setLoadingStudents(true);
    try {
      const targetDate = dateParam || date;
      const res = await axios.get(`/api/teacher/students-by-class/${classId}?date=${targetDate}&subjectId=${subjectId}`);
      
      const { students: studentList, attendanceMarked, markedAt, studentStatusMap } = res.data || {};
      const safeStudents = Array.isArray(studentList) ? studentList : [];
      const statusMap = studentStatusMap || {};
      
      setStudents(safeStudents);

      const defaultRecords = {};
      safeStudents.forEach((student) => {
        if (student && student.id) {
          defaultRecords[student.id] = statusMap[student.id] || 'PRESENT';
        }
      });
      setAttendanceRecords(defaultRecords);
      setIsAttendanceMarked(!!attendanceMarked);
      setAttendanceMarkedAt(markedAt || null);
    } catch (err) {
      console.error(err);
      showToast('Error loading student roster.', 'error');
      setStudents([]);
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
      fetchClassStudents(classId, subId, date);
    } else {
      setStudents([]);
      setIsAttendanceMarked(false);
      setAttendanceMarkedAt(null);
    }
  };

  const selectTimetableSlot = (slot) => {
    setSelectedSlot(slot);
    setSelectedSubjectId(slot.subjectId);
    fetchClassStudents(slot.classId, slot.subjectId, date);
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
    if (scheduledTodaySlots.length === 0) {
      showToast(`Access Restricted: No lecture scheduled in your timetable for ${getDayName(selectedDayNum)}.`, 'error');
      return;
    }
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
      
      // Refresh local page markings & validity states
      const classId = selectedSlot?.classId || subjects.find(s => s.id === selectedSubjectId)?.timetable?.[0]?.classId;
      if (classId) {
        fetchClassStudents(classId, selectedSubjectId, date);
      }
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

            <div className="form-group" style={{ marginTop: '12px' }}>
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
                <div style={{ padding: '16px', border: '1px dashed rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.04)', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-absent)', fontWeight: '600' }}>🔒 No lectures scheduled in timetable for this weekday.</p>
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
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>{slot.subject.name}</div>
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
            {(() => {
              const canEditAttendance = () => {
                if (scheduledTodaySlots.length === 0) return false;
                if (!isAttendanceMarked) return true;
                if (!attendanceMarkedAt) return true;
                const hoursElapsed = (new Date() - new Date(attendanceMarkedAt)) / (1000 * 60 * 60);
                return hoursElapsed <= 24;
              };
              const editable = canEditAttendance();

              return (
                <>
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
                      <button type="button" onClick={() => handleMarkAll('PRESENT')} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-present)' }} disabled={!editable}>All Present</button>
                      <button type="button" onClick={() => handleMarkAll('ABSENT')} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-absent)' }} disabled={!editable}>All Absent</button>
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
                      {/* Access Restricted Warning if Timetable Doesn't Match */}
                      {scheduledTodaySlots.length === 0 ? (
                        <div style={{
                          marginBottom: '16px',
                          padding: '14px 18px',
                          borderRadius: '10px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: 'var(--color-absent)',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          🔒 Access Restricted: No lecture scheduled in your timetable for {getDayName(selectedDayNum)} ({new Date(date).toLocaleDateString()}). Attendance marking is disabled for this date.
                        </div>
                      ) : isAttendanceMarked && (
                        <div style={{
                          marginBottom: '16px',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: editable ? 'rgba(99, 102, 241, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          border: editable ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                          color: editable ? 'var(--accent-secondary)' : 'var(--color-absent)',
                          fontSize: '0.85rem'
                        }}>
                          {editable ? (
                            <div>
                              <strong>✓ Attendance Sheets Submitted:</strong> You can edit or modify these records for this session until <strong>{new Date(new Date(attendanceMarkedAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString()}</strong> (24-hour edit window).
                            </div>
                          ) : (
                            <div>
                              <strong>🔒 Registry Locked:</strong> Attendance for this lecture was marked on {new Date(attendanceMarkedAt).toLocaleString()} (more than 24 hours ago) and is now closed for edits.
                            </div>
                          )}
                        </div>
                      )}

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
                                  <div className="status-selector" style={{ opacity: editable ? 1 : 0.6 }}>
                                    <button
                                      type="button"
                                      onClick={() => editable && handleStatusChange(st.id, 'PRESENT')}
                                      className={`status-btn status-btn-present ${attendanceRecords[st.id] === 'PRESENT' ? 'active' : ''}`}
                                      disabled={!editable}
                                    >
                                      Present
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => editable && handleStatusChange(st.id, 'LATE')}
                                      className={`status-btn status-btn-late ${attendanceRecords[st.id] === 'LATE' ? 'active' : ''}`}
                                      disabled={!editable}
                                    >
                                      Late
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => editable && handleStatusChange(st.id, 'ABSENT')}
                                      className={`status-btn status-btn-absent ${attendanceRecords[st.id] === 'ABSENT' ? 'active' : ''}`}
                                      disabled={!editable}
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

                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: '20px' }} 
                        disabled={submittingAttendance || !editable}
                      >
                        <UserCheck size={18} />
                        {submittingAttendance ? 'Saving Attendance Records...' : isAttendanceMarked ? (editable ? 'Update Attendance Records' : 'Attendance Registry Locked') : 'Save & Publish Attendance'}
                      </button>
                    </form>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* TAB 3: ASSIGNED COURSES & UNIT PDF MANAGER */}
      {activeTab === 'COURSES' && (
        <div className="card col-span-12">
          <h3>My Assigned Course Subjects & Study PDF Manager</h3>
          {subjects.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No courses assigned to your profile.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              {subjects.map((sub) => {
                const subPdfs = teacherPdfs[sub.id] || [];
                return (
                  <div key={sub.id} style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{sub.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', marginTop: '2px' }}>
                          Code: {sub.code} | Semester {sub.semester} | Type: {sub.type || 'THEORY'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddPdf(sub.id, sub.code)}
                        className="btn btn-primary btn-sm"
                      >
                        + Upload Unit PDF
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Uploaded Unit Notes ({subPdfs.length} Files):
                      </div>

                      {subPdfs.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No unit PDFs uploaded for this subject yet. Click "+ Upload Unit PDF" to add lecture notes for students.
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                          {subPdfs.map((pdf) => (
                            <div key={pdf.id} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: '600' }}>📄 {pdf.title}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{pdf.uploadedAt}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePdf(sub.id, pdf.id)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-absent)', cursor: 'pointer', fontSize: '0.75rem' }}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TEACHING CLASSES */}
      {activeTab === 'CLASSES' && (
        <div className="card col-span-12">
          <h3>Assigned Class Groups</h3>
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
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', marginTop: '4px' }}>{s.subject.name}</div>
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
                      <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '700' }}>₹{f.amount.toFixed(2)}</td>
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

      {/* TAB 12: CALENDAR PLANNER */}
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Select a calendar date to track scheduled classes, timeframe validity, and your logged attendance sheets.
              </p>

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
                <h3>Schedule & Submissions for {clickedDayName}</h3>
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
                    const isMarked = dateAttendance.some(r => r.subjectId === slot.subjectId);
                    
                    let statusLabel = 'Not Marked / Pending';
                    let statusBadgeClass = 'absent';

                    if (isFutureDate) {
                      statusLabel = 'Scheduled (Future Slot)';
                      statusBadgeClass = 'pending';
                    } else if (isMarked) {
                      statusLabel = 'Attendance Submitted';
                      statusBadgeClass = 'present';
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
                          <h4 style={{ fontWeight: '600', marginTop: '4px' }}>{slot.subject.name}</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Class Group: {slot.class?.name || 'Unassigned'}
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
      {/* TAB: EXAM MARKS */}
      {activeTab === 'MARKS' && (
        <div className="card col-span-12">
          {!selectedExam ? (
            <>
              <h3>Exam Marks Registry</h3>

              {loadingExams ? (
                <p>Loading exams...</p>
              ) : exams.length === 0 ? (
                <div style={{ padding: '40px', border: '1px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No scheduled exams found for your registered courses.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {exams.map((ex) => (
                    <div key={ex.id} style={{
                      padding: '20px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}>
                      <div>
                        <span className="subject-code" style={{ fontSize: '0.75rem' }}>{ex.subject.code}</span>
                        <h4 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff', margin: '6px 0' }}>{ex.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Course: {ex.subject.name}</p>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                          <div>Date: <strong>{new Date(ex.date).toLocaleDateString()}</strong></div>
                          <div>Time: <strong>{ex.startTime} - {ex.endTime}</strong></div>
                          <div>Room: <strong>{ex.room}</strong></div>
                        </div>
                      </div>
                      <button
                        onClick={() => fetchExamMarksRoster(ex.id)}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '16px', width: '100%' }}
                      >
                        Enter Marks
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <button
                    onClick={() => { setSelectedExam(null); fetchTeacherExams(); }}
                    className="btn btn-secondary btn-sm"
                    style={{ marginBottom: '8px' }}
                  >
                    ← Back to Exams List
                  </button>
                  <h3>Enter Marks: {selectedExam.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: '600' }}>
                    Subject: {selectedExam.subject.name} ({selectedExam.subject.code})
                  </span>
                </div>
              </div>

              {loadingMarksRoster ? (
                <p>Loading students roster...</p>
              ) : (
                <form onSubmit={handleSaveMarks}>
                  <div style={{ overflowX: 'auto', maxHeight: '450px', overflowY: 'auto' }}>
                    <table className="attendance-list">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Roll No</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Student Name</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)', width: '150px' }}>Max Marks</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)', width: '150px' }}>Marks Scored</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', width: '300px' }}>Remarks / Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marksRoster.map((st) => (
                          <tr key={st.studentId} className="attendance-row">
                            <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{st.rollNumber}</td>
                            <td className="attendance-cell" style={{ fontWeight: '600' }}>{st.name}</td>
                            <td className="attendance-cell" style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                className="form-input"
                                style={{ width: '80px', textAlign: 'center', margin: '0 auto' }}
                                value={st.maxMarks}
                                onChange={(e) => handleMarkChange(st.studentId, 'maxMarks', e.target.value)}
                                min="0"
                                required
                              />
                            </td>
                            <td className="attendance-cell" style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                className="form-input"
                                style={{ width: '80px', textAlign: 'center', margin: '0 auto', border: '1px solid var(--accent-secondary)' }}
                                value={st.marks}
                                onChange={(e) => handleMarkChange(st.studentId, 'marks', e.target.value)}
                                min="0"
                                max={st.maxMarks}
                                placeholder="0"
                                required
                              />
                            </td>
                            <td className="attendance-cell" style={{ textAlign: 'right' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ width: '100%' }}
                                placeholder="e.g. Excellent work, Needs improvement"
                                value={st.remarks}
                                onChange={(e) => handleMarkChange(st.studentId, 'remarks', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '24px' }}
                    disabled={savingMarks}
                  >
                    {savingMarks ? 'Publishing Student Marks...' : 'Save & Publish Exam Marks'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
      {/* TAB: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="card col-span-12" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h3>App Settings & Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            {/* Visual Theme selector */}
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

            {/* Display Density & Typography */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>Display Density & Scale</h4>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Font Scale & Spacing</label>
                <select className="form-select" defaultValue="normal" onChange={(e) => showToast(`Font scale updated: ${e.target.value}`, 'success')}>
                  <option value="compact">Compact (Higher Data Density)</option>
                  <option value="normal">Normal (Default Balanced)</option>
                  <option value="large">Large (High Accessibility & Contrast)</option>
                </select>
              </div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.85rem' }}>Compact Table Rows</span>
                <input type="checkbox" onChange={(e) => showToast(e.target.checked ? 'Compact table view enabled!' : 'Compact table view disabled!', 'info')} />
              </label>
            </div>

            {/* Live Data Refresh Interval */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>Real-time Data Sync</h4>
              <div className="form-group">
                <label className="form-label">Background Polling Rate</label>
                <select className="form-select" defaultValue="15" onChange={(e) => showToast(`Sync rate updated to ${e.target.value}s`, 'success')}>
                  <option value="15">High Frequency (15 Seconds)</option>
                  <option value="30">Balanced (30 Seconds)</option>
                  <option value="60">Low Battery Saver (60 Seconds)</option>
                  <option value="0">Manual Refresh Only</option>
                </select>
              </div>
            </div>

            {/* Sound & Haptics */}
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '12px' }}>Audio & Haptic Feedback</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem' }}>Sound Chime on Attendance Action</span>
                  <input type="checkbox" defaultChecked onChange={(e) => showToast(e.target.checked ? 'Audio effects enabled!' : 'Audio effects disabled!', 'info')} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.85rem' }}>Mobile Touch Haptic Vibration</span>
                  <input type="checkbox" defaultChecked onChange={(e) => showToast(e.target.checked ? 'Haptic feedback enabled!' : 'Haptic feedback disabled!', 'info')} />
                </label>
              </div>
            </div>

            {/* Alert Preferences */}
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

            {/* Locale Settings */}
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

      {/* TAB: CAMPUS EVENTS */}
      {activeTab === 'EVENTS' && (
        <div className="card col-span-12">
          <h3>Campus Events & Faculty Duty Calendar</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: '700' }}>TECHNICAL FEST 2026</div>
              <h4 style={{ fontSize: '1.15rem', marginTop: '4px' }}>National Hackathon & AI Summit</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '8px 0' }}>Faculty Jury & Evaluation Panel Assignment.</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📅 Date: Aug 15, 2026 | Venue: Main Auditorium</div>
              <button type="button" onClick={() => showToast('Jury Panel duty accepted!', 'success')} className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px' }}>Confirm Jury Duty</button>
            </div>

            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-present)', fontWeight: '700' }}>CULTURAL FEST</div>
              <h4 style={{ fontSize: '1.15rem', marginTop: '4px' }}>Annual Music & Dance Night</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '8px 0' }}>Faculty Coordination & Discipline Committee.</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📅 Date: Sep 02, 2026 | Venue: Open Air Theatre</div>
              <button type="button" onClick={() => showToast('Faculty Pass issued!', 'success')} className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px' }}>Issue VIP Pass</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FEEDBACK */}
      {activeTab === 'FEEDBACK' && (
        <div className="card col-span-12" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>Submit Faculty Feedback & Infrastructure Request</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            showToast('Thank you! Your feedback has been submitted to portal admin.', 'success');
          }}>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Category</label>
              <select className="form-select" defaultValue="Infrastructure">
                <option value="Infrastructure">Lab Equipment & Projector Maintenance</option>
                <option value="Academic">Timetable & Slot Conflicts</option>
                <option value="Portal">Portal UI & Attendance System</option>
                <option value="General">General Faculty Feedback</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Comments / Details</label>
              <textarea className="form-textarea" rows="4" placeholder="Provide detailed feedback or report issues..." required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Feedback</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
