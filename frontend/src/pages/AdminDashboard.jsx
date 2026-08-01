import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { Settings, Plus, Users, BookOpen, Layers, History, Calendar, CreditCard, Landmark, Trash2, Clock, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const { showToast } = useToast();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab')?.toUpperCase() || 'STATS';
  const setActiveTab = (tab) => {
    setSearchParams({ tab: tab.toLowerCase() });
  };
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDirectory, setActiveDirectory] = useState('CLASSES');
  
  // Listings data
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [fees, setFees] = useState([]);
  const [timetable, setTimetable] = useState([]);

  // College config state
  const [collegeName, setCollegeName] = useState('');
  const [collegeCode, setCollegeCode] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Create class form fields
  const [className, setClassName] = useState('');
  const [classDept, setClassDept] = useState('');
  const [classSem, setClassSem] = useState(1);
  const [creatingClass, setCreatingClass] = useState(false);

  // Create subject form fields
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjSem, setSubjSem] = useState(1);
  const [subjTeacherId, setSubjTeacherId] = useState('');
  const [subjType, setSubjType] = useState('THEORY');
  const [creatingSubject, setCreatingSubject] = useState(false);

  // Create Exam fields
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examStart, setExamStart] = useState('');
  const [examEnd, setExamEnd] = useState('');
  const [examSubjId, setExamSubjId] = useState('');
  const [examRoom, setExamRoom] = useState('');
  const [creatingExam, setCreatingExam] = useState(false);

  // Create Holiday fields
  const [holidayName, setHolidayName] = useState('');
  const [holidayStart, setHolidayStart] = useState('');
  const [holidayEnd, setHolidayEnd] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [creatingHoliday, setCreatingHoliday] = useState(false);

  // Create Fee fields
  const [feeStudentId, setFeeStudentId] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeDueDate, setFeeDueDate] = useState('');
  const [feeDesc, setFeeDesc] = useState('');
  const [creatingFee, setCreatingFee] = useState(false);

  // Create Timetable Slot fields
  const [ttClassId, setTtClassId] = useState('');
  const [ttSubjectId, setTtSubjectId] = useState('');
  const [ttDayOfWeek, setTtDayOfWeek] = useState(1);
  const [ttStartTime, setTtStartTime] = useState('');
  const [ttEndTime, setTtEndTime] = useState('');
  const [ttRoom, setTtRoom] = useState('');
  const [ttDuration, setTtDuration] = useState('2');
  const [classFilterSem, setClassFilterSem] = useState('ALL');
  const [subjFilterSem, setSubjFilterSem] = useState('ALL');
  const [creatingTimetable, setCreatingTimetable] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchCollegeConfig();
  }, []);

  const fetchAdminData = async () => {
    try {
      const statsRes = await axios.get('/api/admin/stats');
      setStats(statsRes.data);

      const classesRes = await axios.get('/api/admin/classes');
      setClasses(classesRes.data);
      if (classesRes.data.length > 0) setTtClassId(classesRes.data[0].id);

      const teachersRes = await axios.get('/api/admin/teachers');
      setTeachers(teachersRes.data);
      if (teachersRes.data.length > 0) setSubjTeacherId(teachersRes.data[0].id);

      const subjectsRes = await axios.get('/api/admin/subjects');
      setSubjects(subjectsRes.data);
      if (subjectsRes.data.length > 0) {
        setExamSubjId(subjectsRes.data[0].id);
        setTtSubjectId(subjectsRes.data[0].id);
        // Default duration based on type of first subject
        const defaultDuration = subjectsRes.data[0].type === 'LAB' ? '3' : '2';
        setTtDuration(defaultDuration);
      }

      const studentsRes = await axios.get('/api/admin/students');
      setStudents(studentsRes.data);
      if (studentsRes.data.length > 0) setFeeStudentId(studentsRes.data[0].id);

      const examsRes = await axios.get('/api/admin/exams');
      setExams(examsRes.data);

      const holidaysRes = await axios.get('/api/admin/holidays');
      setHolidays(holidaysRes.data);

      const feesRes = await axios.get('/api/admin/fees');
      setFees(feesRes.data);

      const timetableRes = await axios.get('/api/admin/timetable');
      setTimetable(timetableRes.data);
    } catch (err) {
      console.error(err);
      showToast('Could not load administrative details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollegeConfig = async () => {
    try {
      const res = await axios.get('/api/college/config');
      if (res.data) {
        setCollegeName(res.data.name);
        setCollegeCode(res.data.code);
        setAcademicYear(res.data.academicYear);
      }
    } catch (err) {
      console.error('Error fetching college configuration', err);
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    if (!collegeName || !collegeCode || !academicYear) {
      showToast('All branding fields are required.', 'warning');
      return;
    }
    setUpdatingConfig(true);
    try {
      await axios.put('/api/admin/college-config', {
        name: collegeName,
        code: collegeCode,
        academicYear,
      });
      showToast('College configuration updated successfully.', 'success');
      window.location.reload();
    } catch (err) {
      showToast('Failed to update college config.', 'error');
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!className || !classDept) {
      showToast('Class name and department required.', 'warning');
      return;
    }

    setCreatingClass(true);
    try {
      await axios.post('/api/admin/classes', {
        name: className,
        department: classDept,
        semester: parseInt(classSem),
      });
      showToast('New class group created.', 'success');
      setClassName('');
      setClassDept('');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to create class.', 'error');
    } finally {
      setCreatingClass(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjName || !subjCode || !subjTeacherId) {
      showToast('All subject fields are required.', 'warning');
      return;
    }

    setCreatingSubject(true);
    try {
      await axios.post('/api/admin/subjects', {
        name: subjName,
        code: subjCode,
        semester: parseInt(subjSem),
        type: subjType,
        teacherId: subjTeacherId,
      });
      showToast('New subject added.', 'success');
      setSubjName('');
      setSubjCode('');
      setSubjType('THEORY');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to create subject.', 'error');
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examName || !examDate || !examStart || !examEnd || !examSubjId || !examRoom) {
      showToast('All exam fields are required.', 'warning');
      return;
    }
    setCreatingExam(true);
    try {
      await axios.post('/api/admin/exams', {
        name: examName,
        date: examDate,
        startTime: examStart,
        endTime: examEnd,
        subjectId: examSubjId,
        room: examRoom,
      });
      showToast('Exam scheduled successfully.', 'success');
      setExamName('');
      setExamDate('');
      setExamStart('');
      setExamEnd('');
      setExamRoom('');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to schedule exam.', 'error');
    } finally {
      setCreatingExam(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!confirm('Are you sure you want to delete this exam schedule?')) return;
    try {
      await axios.delete(`/api/admin/exams/${id}`);
      showToast('Exam deleted successfully.', 'success');
      fetchAdminData();
    } catch (err) {
      showToast('Could not delete exam.', 'error');
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    if (!holidayName || !holidayStart || !holidayEnd) {
      showToast('Name, start date, and end date are required.', 'warning');
      return;
    }
    setCreatingHoliday(true);
    try {
      await axios.post('/api/admin/holidays', {
        name: holidayName,
        startDate: holidayStart,
        endDate: holidayEnd,
        description: holidayDesc,
      });
      showToast('Holiday break declared successfully.', 'success');
      setHolidayName('');
      setHolidayStart('');
      setHolidayEnd('');
      setHolidayDesc('');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to create holiday.', 'error');
    } finally {
      setCreatingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!confirm('Are you sure you want to remove this holiday break?')) return;
    try {
      await axios.delete(`/api/admin/holidays/${id}`);
      showToast('Holiday deleted.', 'success');
      fetchAdminData();
    } catch (err) {
      showToast('Could not remove holiday.', 'error');
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    if (!feeStudentId || !feeAmount || !feeDueDate || !feeDesc) {
      showToast('All invoice fields are required.', 'warning');
      return;
    }
    setCreatingFee(true);
    try {
      await axios.post('/api/admin/fees', {
        studentId: feeStudentId,
        amount: feeAmount,
        dueDate: feeDueDate,
        description: feeDesc,
      });
      showToast('New fee invoice posted successfully.', 'success');
      setFeeAmount('');
      setFeeDueDate('');
      setFeeDesc('');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to post fee dues.', 'error');
    } finally {
      setCreatingFee(false);
    }
  };

  const handleToggleFeeStatus = async (feeId, currentStatus) => {
    const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try {
      await axios.put(`/api/admin/fees/${feeId}/status`, { status: nextStatus });
      showToast(`Fee status marked as ${nextStatus.toLowerCase()}.`, 'success');
      fetchAdminData();
    } catch (err) {
      showToast('Could not update payment status.', 'error');
    }
  };

  const autoCalcEndTime = (startTimeVal, durationHours) => {
    if (!startTimeVal) return;
    const [hours, minutes] = startTimeVal.split(':').map(Number);
    const endHours = (hours + parseInt(durationHours)) % 24;
    const endHoursFormatted = String(endHours).padStart(2, '0');
    const endMinutesFormatted = String(minutes).padStart(2, '0');
    setTtEndTime(`${endHoursFormatted}:${endMinutesFormatted}`);
  };

  const handleTtSubjectChange = (e) => {
    const subId = e.target.value;
    setTtSubjectId(subId);
    const selectedSub = subjects.find(s => s.id === subId);
    if (selectedSub) {
      const defaultDuration = selectedSub.type === 'LAB' ? '3' : '2';
      setTtDuration(defaultDuration);
      autoCalcEndTime(ttStartTime, defaultDuration);
    }
  };

  const handleCreateTimetable = async (e) => {
    e.preventDefault();
    if (!ttClassId || !ttSubjectId || !ttDayOfWeek || !ttStartTime || !ttEndTime || !ttRoom) {
      showToast('All timetable fields are required.', 'warning');
      return;
    }
    setCreatingTimetable(true);
    try {
      await axios.post('/api/admin/timetable', {
        classId: ttClassId,
        subjectId: ttSubjectId,
        dayOfWeek: parseInt(ttDayOfWeek),
        startTime: ttStartTime,
        endTime: ttEndTime,
        room: ttRoom,
      });
      showToast('Linked subject to class schedule.', 'success');
      setTtRoom('');
      setTtStartTime('');
      setTtEndTime('');
      fetchAdminData();
    } catch (error) {
      console.error(error);
      showToast('Failed to link timetable slot.', 'error');
    } finally {
      setCreatingTimetable(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!confirm('Are you sure you want to remove this timetable class link?')) return;
    try {
      await axios.delete(`/api/admin/timetable/${id}`);
      showToast('Timetable slot deleted.', 'success');
      fetchAdminData();
    } catch (error) {
      showToast('Could not delete timetable slot.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading Administrative Panel...</p>
      </div>
    );
  }

  const counts = stats?.counts || { students: 0, teachers: 0, classes: 0, subjects: 0 };
  const recentLogs = stats?.recentAttendance || [];

  const getDayName = (dayNum) => {
    const days = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
    return days[dayNum] || 'Unknown';
  };

  return (
    <div className="app-container" style={{ padding: '0px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={28} style={{ color: 'var(--accent-primary)' }} />
        Registrar Control Panel
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        System-wide database management and logs.
      </p>

      {/* TAB 1: OVERVIEW STATS (DASHBOARD) */}
      {activeTab === 'STATS' && (
        <div className="dashboard-grid">
          {/* Clickable metric cards */}
          <div className="col-span-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '8px' }}>
            <div 
              className="card" 
              onClick={() => setActiveDirectory('STUDENTS')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                cursor: 'pointer',
                border: activeDirectory === 'STUDENTS' ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                background: activeDirectory === 'STUDENTS' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', padding: '12px', borderRadius: '12px' }}><Users size={24} /></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Students</span><div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{counts.students}</div></div>
            </div>
            
            <div 
              className="card" 
              onClick={() => setActiveDirectory('TEACHERS')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                cursor: 'pointer',
                border: activeDirectory === 'TEACHERS' ? '1.5px solid var(--accent-secondary)' : '1px solid var(--glass-border)',
                background: activeDirectory === 'TEACHERS' ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ background: 'var(--accent-secondary-glow)', color: 'var(--accent-secondary)', padding: '12px', borderRadius: '12px' }}><Users size={24} /></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Faculty</span><div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{counts.teachers}</div></div>
            </div>
            
            <div 
              className="card" 
              onClick={() => setActiveDirectory('CLASSES')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                cursor: 'pointer',
                border: activeDirectory === 'CLASSES' ? '1.5px solid var(--color-present)' : '1px solid var(--glass-border)',
                background: activeDirectory === 'CLASSES' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-present)', padding: '12px', borderRadius: '12px' }}><Layers size={24} /></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Classes</span><div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{counts.classes}</div></div>
            </div>
            
            <div 
              className="card" 
              onClick={() => setActiveDirectory('SUBJECTS')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                cursor: 'pointer',
                border: activeDirectory === 'SUBJECTS' ? '1.5px solid var(--color-late)' : '1px solid var(--glass-border)',
                background: activeDirectory === 'SUBJECTS' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-late)', padding: '12px', borderRadius: '12px' }}><BookOpen size={24} /></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Subjects</span><div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{counts.subjects}</div></div>
            </div>
          </div>

          {/* Directory Tab Selector Buttons */}
          <div className="col-span-12" style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveDirectory('CLASSES')} className={`tab-btn ${activeDirectory === 'CLASSES' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px 16px' }}><Layers size={14} /> Classes</button>
            <button onClick={() => setActiveDirectory('DEPARTMENTS')} className={`tab-btn ${activeDirectory === 'DEPARTMENTS' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px 16px' }}><Landmark size={14} /> Departments</button>
            <button onClick={() => setActiveDirectory('SUBJECTS')} className={`tab-btn ${activeDirectory === 'SUBJECTS' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px 16px' }}><BookOpen size={14} /> Subjects</button>
            <button onClick={() => setActiveDirectory('TEACHERS')} className={`tab-btn ${activeDirectory === 'TEACHERS' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px 16px' }}><Users size={14} /> Faculty</button>
            <button onClick={() => setActiveDirectory('STUDENTS')} className={`tab-btn ${activeDirectory === 'STUDENTS' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px 16px' }}><Users size={14} /> Enrolled Students</button>
            <button onClick={() => setActiveDirectory('TIMETABLE')} className={`tab-btn ${activeDirectory === 'TIMETABLE' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px 16px' }}><Clock size={14} /> Timetable Matrix</button>
          </div>

          {/* Active Directory Listings Table Container */}
          <div className="card col-span-12" style={{ marginTop: '0px' }}>
            {activeDirectory === 'CLASSES' && (
              <>
                <h3 style={{ marginBottom: '16px' }}>Classes Directory ({classes.length} Groups)</h3>
                {classes.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No class groups registered.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="attendance-list">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Class Name</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Department</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Semester</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Enrolled Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((c) => (
                          <tr key={c.id} className="attendance-row">
                            <td className="attendance-cell" style={{ fontWeight: '600' }}>{c.name}</td>
                            <td className="attendance-cell" style={{ color: 'var(--text-secondary)' }}>{c.department}</td>
                            <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent-secondary)' }}>Sem {c.semester}</td>
                            <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '600' }}>{c._count?.students ?? 0} Students</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeDirectory === 'DEPARTMENTS' && (() => {
              const deptSummary = {};
              classes.forEach(c => {
                if (!deptSummary[c.department]) {
                  deptSummary[c.department] = { classesCount: 0, totalStudents: 0, classNames: [] };
                }
                deptSummary[c.department].classesCount += 1;
                deptSummary[c.department].totalStudents += (c._count?.students ?? 0);
                deptSummary[c.department].classNames.push(`${c.name} (Sem ${c.semester})`);
              });
              const deptNames = Object.keys(deptSummary);
              return (
                <>
                  <h3 style={{ marginBottom: '16px' }}>Departments Directory ({deptNames.length} Departments)</h3>
                  {deptNames.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No departments found.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="attendance-list">
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Department Name</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Associated Class Groups</th>
                            <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Total Classes</th>
                            <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Total Students</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptNames.map((deptName) => (
                            <tr key={deptName} className="attendance-row">
                              <td className="attendance-cell" style={{ fontWeight: '600', color: 'var(--color-present)' }}>{deptName}</td>
                              <td className="attendance-cell" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                {deptSummary[deptName].classNames.join(', ')}
                              </td>
                              <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '600' }}>{deptSummary[deptName].classesCount} Classes</td>
                              <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '700' }}>{deptSummary[deptName].totalStudents} Students</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}

            {activeDirectory === 'SUBJECTS' && (
              <>
                <h3 style={{ marginBottom: '16px' }}>Course Subjects Directory ({subjects.length} Subjects)</h3>
                {subjects.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No subjects registered.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="attendance-list">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Subject Name</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Code</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Type</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Semester</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Assigned Faculty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((sub) => (
                          <tr key={sub.id} className="attendance-row">
                            <td className="attendance-cell" style={{ fontWeight: '600' }}>{sub.name}</td>
                            <td className="attendance-cell" style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>{sub.code}</td>
                            <td className="attendance-cell" style={{ textAlign: 'center' }}>
                              <span className={`badge badge-${sub.type?.toLowerCase() === 'lab' ? 'absent' : 'present'}`} style={{ textTransform: 'capitalize' }}>
                                {sub.type?.toLowerCase() || 'Theory'}
                              </span>
                            </td>
                            <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '700' }}>Sem {sub.semester}</td>
                            <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '600' }}>{sub.teacher?.user?.name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeDirectory === 'TEACHERS' && (
              <>
                <h3 style={{ marginBottom: '16px' }}>Faculty Directory ({teachers.length} Instructors)</h3>
                {teachers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No faculty registered.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="attendance-list">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Faculty Name</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Email Address</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Employee ID</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Assigned Courses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((t) => (
                          <tr key={t.id} className="attendance-row">
                            <td className="attendance-cell" style={{ fontWeight: '600' }}>{t.user?.name}</td>
                            <td className="attendance-cell" style={{ color: 'var(--text-secondary)' }}>{t.user?.email}</td>
                            <td className="attendance-cell" style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>{t.employeeId}</td>
                            <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '500' }}>
                              {t.subjects && t.subjects.length > 0 
                                ? t.subjects.map(s => s.code).join(', ') 
                                : 'No subjects assigned'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeDirectory === 'STUDENTS' && (
              <>
                <h3 style={{ marginBottom: '16px' }}>Students Directory ({students.length} Enrolled)</h3>
                {students.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No students registered.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="attendance-list">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Roll No</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Student Name</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Email</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Class Group</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((st) => (
                          <tr key={st.id} className="attendance-row">
                            <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>{st.rollNumber}</td>
                            <td className="attendance-cell" style={{ fontWeight: '600' }}>{st.user?.name}</td>
                            <td className="attendance-cell" style={{ color: 'var(--text-muted)' }}>{st.user?.email}</td>
                            <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '600' }}>{st.class?.name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeDirectory === 'TIMETABLE' && (
              <>
                <h3 style={{ marginBottom: '16px' }}>Weekly Timetable Schedule Matrix ({timetable.length} Slots)</h3>
                {timetable.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No timetable schedule slots configured.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="attendance-list">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Day</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Time Slot</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Course Subject</th>
                          <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Type</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Class Group</th>
                          <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Room</th>
                          <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Faculty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetable.map((slot) => (
                          <tr key={slot.id} className="attendance-row">
                            <td className="attendance-cell" style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>
                              {getDayName(slot.dayOfWeek)}
                            </td>
                            <td className="attendance-cell" style={{ fontWeight: '600' }}>
                              {slot.startTime} - {slot.endTime}
                            </td>
                            <td className="attendance-cell" style={{ fontWeight: '600' }}>
                              {slot.subject.name} ({slot.subject.code})
                            </td>
                            <td className="attendance-cell" style={{ textAlign: 'center' }}>
                              <span className={`badge badge-${slot.subject?.type?.toLowerCase() === 'lab' ? 'absent' : 'present'}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                                {slot.subject?.type?.toLowerCase() || 'Theory'}
                              </span>
                            </td>
                            <td className="attendance-cell" style={{ color: 'var(--text-secondary)' }}>
                              {slot.class.name}
                            </td>
                            <td className="attendance-cell" style={{ fontWeight: '500' }}>
                              {slot.room}
                            </td>
                            <td className="attendance-cell" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                              {slot.subject.teacher?.user?.name || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recent Global Attendance Logs */}
          <div className="card col-span-12">
            <h3>Recent Global Attendance Logs</h3>
            {recentLogs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No attendance logs recorded.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="attendance-list">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Subject</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Student</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="attendance-row">
                        <td className="attendance-cell">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="attendance-cell">{log.subject.name} ({log.subject.code})</td>
                        <td className="attendance-cell">{log.student.user.name} (Roll: {log.student.rollNumber})</td>
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
        </div>
      )}

      {/* TAB 2: CLASSES (FILTERABLE SEMESTER-WISE) */}
      {activeTab === 'CLASSES' && (
        <div className="dashboard-grid">
          {/* Create Class */}
          <div className="card col-span-5">
            <h3>Add Class Group</h3>
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label className="form-label" htmlFor="className">Class Name</label>
                <input id="className" type="text" className="form-input" placeholder="e.g. Computer Science - Year 4" value={className} onChange={(e) => setClassName(e.target.value)} disabled={creatingClass} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="classDept">Department</label>
                <input id="classDept" type="text" className="form-input" placeholder="e.g. Computer Engineering" value={classDept} onChange={(e) => setClassDept(e.target.value)} disabled={creatingClass} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="classSem">Semester Level</label>
                <select id="classSem" className="form-select" value={classSem} onChange={(e) => setClassSem(e.target.value)}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Class</button>
            </form>
          </div>

          {/* Classes Directory list */}
          <div className="card col-span-7">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3>Classes Directory</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester:</span>
                <select 
                  className="form-select" 
                  value={classFilterSem} 
                  onChange={(e) => setClassFilterSem(e.target.value)}
                  style={{ width: '130px', padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                </select>
              </div>
            </div>

            {(() => {
              const filteredClasses = classFilterSem === 'ALL' 
                ? classes 
                : classes.filter(c => c.semester === parseInt(classFilterSem));

              return filteredClasses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No class groups found matching selection.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="attendance-list">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Class Name</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Department</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Semester</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Enrolled Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClasses.map((c) => (
                        <tr key={c.id} className="attendance-row">
                          <td className="attendance-cell" style={{ fontWeight: '600' }}>{c.name}</td>
                          <td className="attendance-cell" style={{ color: 'var(--text-secondary)' }}>{c.department}</td>
                          <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '700', color: 'var(--accent-secondary)' }}>Sem {c.semester}</td>
                          <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '600' }}>{c._count?.students ?? 0} Students</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>

          {/* Departments list */}
          <div className="card col-span-12" style={{ marginTop: '16px' }}>
            <h3 style={{ marginBottom: '16px' }}>Departments Directory</h3>
            {(() => {
              const deptSummary = {};
              classes.forEach(c => {
                if (!deptSummary[c.department]) {
                  deptSummary[c.department] = { classesCount: 0, totalStudents: 0, classNames: [] };
                }
                deptSummary[c.department].classesCount += 1;
                deptSummary[c.department].totalStudents += (c._count?.students ?? 0);
                deptSummary[c.department].classNames.push(`${c.name} (Sem ${c.semester})`);
              });
              const deptNames = Object.keys(deptSummary);
              return deptNames.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No departments found.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="attendance-list">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Department Name</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Associated Class Groups</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Total Classes</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Total Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptNames.map((deptName) => (
                        <tr key={deptName} className="attendance-row">
                          <td className="attendance-cell" style={{ fontWeight: '600', color: 'var(--color-present)' }}>{deptName}</td>
                          <td className="attendance-cell" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {deptSummary[deptName].classNames.join(', ')}
                          </td>
                          <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '600' }}>{deptSummary[deptName].classesCount} Classes</td>
                          <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '700' }}>{deptSummary[deptName].totalStudents} Students</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: COURSES (FILTERABLE SEMESTER-WISE & THEORY/LAB TYPES) */}
      {activeTab === 'COURSES' && (
        <div className="dashboard-grid">
          {/* Create Subject */}
          <div className="card col-span-5">
            <h3>Add Course Subject</h3>
            <form onSubmit={handleCreateSubject}>
              <div className="form-group">
                <label className="form-label" htmlFor="subjName">Subject Name</label>
                <input id="subjName" type="text" className="form-input" placeholder="e.g. Distributed Computing" value={subjName} onChange={(e) => setSubjName(e.target.value)} disabled={creatingSubject} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="subjCode">Subject Code</label>
                <input id="subjCode" type="text" className="form-input" placeholder="e.g. CS401" value={subjCode} onChange={(e) => setSubjCode(e.target.value)} disabled={creatingSubject} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="subjType">Subject Type</label>
                <select id="subjType" className="form-select" value={subjType} onChange={(e) => setSubjType(e.target.value)}>
                  <option value="THEORY">Theory Lecture</option>
                  <option value="LAB">Laboratory Practical (Lab)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="subjSem">Semester</label>
                  <select id="subjSem" className="form-select" value={subjSem} onChange={(e) => setSubjSem(e.target.value)}>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Sem {n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="subjTeacher">Faculty</label>
                  <select id="subjTeacher" className="form-select" value={subjTeacherId} onChange={(e) => setSubjTeacherId(e.target.value)}>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Subject</button>
            </form>
          </div>

          {/* Subjects list */}
          <div className="card col-span-7">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3>Course Subjects Directory</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester:</span>
                <select 
                  className="form-select" 
                  value={subjFilterSem} 
                  onChange={(e) => setSubjFilterSem(e.target.value)}
                  style={{ width: '130px', padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                </select>
              </div>
            </div>

            {(() => {
              const filteredSubjects = subjFilterSem === 'ALL' 
                ? subjects 
                : subjects.filter(s => s.semester === parseInt(subjFilterSem));

              return filteredSubjects.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No subjects found matching selection.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="attendance-list">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Subject Name</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)' }}>Code</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Type</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-muted)' }}>Semester</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)' }}>Faculty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubjects.map((sub) => (
                        <tr key={sub.id} className="attendance-row">
                          <td className="attendance-cell" style={{ fontWeight: '600' }}>{sub.name}</td>
                          <td className="attendance-cell" style={{ fontWeight: '600', color: 'var(--accent-secondary)' }}>{sub.code}</td>
                          <td className="attendance-cell" style={{ textAlign: 'center' }}>
                            <span className={`badge badge-${sub.type?.toLowerCase() === 'lab' ? 'absent' : 'present'}`} style={{ textTransform: 'capitalize' }}>
                              {sub.type?.toLowerCase() || 'Theory'}
                            </span>
                          </td>
                          <td className="attendance-cell" style={{ textAlign: 'center', fontWeight: '700' }}>Sem {sub.semester}</td>
                          <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '600' }}>{sub.teacher?.user?.name || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 4: TIMETABLE (WITH THEORY/LAB AUTO-DURATION CALCS) */}
      {activeTab === 'TIMETABLE' && (
        <div className="dashboard-grid">
          {/* Link class & subject */}
          <div className="card col-span-5">
            <h3>Assign Subject to Class</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Create weekly lecture slots. Lab subjects default to 3 hours, and Theory subjects default to 2 hours (double slots).
            </p>
            <form onSubmit={handleCreateTimetable}>
              <div className="form-group">
                <label className="form-label" htmlFor="ttClass">Select Class Group</label>
                <select id="ttClass" className="form-select" value={ttClassId} onChange={(e) => setTtClassId(e.target.value)}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.department}) - Sem {c.semester}</option>)}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="ttSubject">Select Course Subject</label>
                <select id="ttSubject" className="form-select" value={ttSubjectId} onChange={handleTtSubjectChange}>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code}) [{s.type}] - Sem {s.semester}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ttDuration">Duration (Hours)</label>
                <select 
                  id="ttDuration" 
                  className="form-select" 
                  value={ttDuration} 
                  onChange={(e) => {
                    setTtDuration(e.target.value);
                    autoCalcEndTime(ttStartTime, e.target.value);
                  }}
                >
                  <option value="1">1 Hour (Single hour)</option>
                  <option value="2">2 Hours (Theory Standard / Double hour)</option>
                  <option value="3">3 Hours (Lab Standard Practical)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ttDay">Lecture Day</label>
                <select id="ttDay" className="form-select" value={ttDayOfWeek} onChange={(e) => setTtDayOfWeek(e.target.value)}>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ttStart">Start Time</label>
                  <input 
                    id="ttStart" 
                    type="time" 
                    className="form-input" 
                    value={ttStartTime} 
                    onChange={(e) => {
                      setTtStartTime(e.target.value);
                      autoCalcEndTime(e.target.value, ttDuration);
                    }} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ttEnd">End Time (Auto)</label>
                  <input 
                    id="ttEnd" 
                    type="time" 
                    className="form-input" 
                    value={ttEndTime} 
                    disabled 
                    style={{ opacity: 0.7, cursor: 'not-allowed' }} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ttRoom">Room / Lecture Hall</label>
                <input id="ttRoom" type="text" className="form-input" placeholder="e.g. Room 402, Block C" value={ttRoom} onChange={(e) => setTtRoom(e.target.value)} />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creatingTimetable}>Create Lecture Slot</button>
            </form>
          </div>

          {/* List of links */}
          <div className="card col-span-7">
            <h3>Timetable Matrix List</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
              {timetable.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No timetable connections scheduled. Please assign a subject above.</p>
                </div>
              ) : (
                timetable.map((slot) => (
                  <div key={slot.id} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', background: 'var(--accent-secondary-glow)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          {getDayName(slot.dayOfWeek)}
                        </span>
                        <span className={`badge badge-${slot.subject?.type?.toLowerCase() === 'lab' ? 'absent' : 'present'}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                          {slot.subject?.type?.toLowerCase() || 'Theory'}
                        </span>
                      </div>
                      <h4 style={{ fontWeight: '600', marginTop: '6px' }}>{slot.subject.name} ({slot.subject.code})</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Class: <strong>{slot.class.name}</strong> | Room: <strong>{slot.room}</strong>
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Timing: <strong>{slot.startTime} - {slot.endTime}</strong> | Faculty: {slot.subject.teacher?.user?.name || 'N/A'}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteTimetable(slot.id)} className="btn btn-secondary btn-sm" style={{ padding: '8px', color: 'var(--color-absent)' }} title="Remove Slot">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EXAMS PLANNER */}
      {activeTab === 'EXAMS' && (
        <div className="dashboard-grid">
          {/* Schedule Exam */}
          <div className="card col-span-5">
            <h3>Schedule Course Exam</h3>
            <form onSubmit={handleCreateExam}>
              <div className="form-group">
                <label className="form-label" htmlFor="examName">Exam Name</label>
                <input id="examName" type="text" className="form-input" placeholder="e.g. Final Semester Examination" value={examName} onChange={(e) => setExamName(e.target.value)} disabled={creatingExam} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="examSubj">Course Subject</label>
                <select id="examSubj" className="form-select" value={examSubjId} onChange={(e) => setExamSubjId(e.target.value)}>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code}) - Sem {s.semester}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="examDate">Exam Date</label>
                  <input id="examDate" type="date" className="form-input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="examRoom">Venue / Room</label>
                  <input id="examRoom" type="text" className="form-input" placeholder="Exam Hall B" value={examRoom} onChange={(e) => setExamRoom(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="examStart">Start Time</label>
                  <input id="examStart" type="time" className="form-input" value={examStart} onChange={(e) => setExamStart(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="examEnd">End Time</label>
                  <input id="examEnd" type="time" className="form-input" value={examEnd} onChange={(e) => setExamEnd(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creatingExam}>Schedule Exam</button>
            </form>
          </div>

          {/* List of Exams */}
          <div className="card col-span-7">
            <h3>Registered Exams Calendar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {exams.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No exams scheduled.</p>
              ) : (
                exams.map((ex) => (
                  <div key={ex.id} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: '600' }}>{ex.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {ex.subject.name} ({ex.subject.code}) | Sem {ex.subject.semester}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Date: {new Date(ex.date).toLocaleDateString()} | Time: {ex.startTime} - {ex.endTime} | Venue: {ex.room}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteExam(ex.id)} className="btn btn-secondary btn-sm" style={{ padding: '8px', color: 'var(--color-absent)' }} title="Remove Exam">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: HOLIDAYS RECESS */}
      {activeTab === 'HOLIDAYS' && (
        <div className="dashboard-grid">
          {/* Declare Holiday */}
          <div className="card col-span-5">
            <h3>Declare Break / Recess</h3>
            <form onSubmit={handleCreateHoliday}>
              <div className="form-group">
                <label className="form-label" htmlFor="holName">Holiday Title</label>
                <input id="holName" type="text" className="form-input" placeholder="e.g. Winter Break Recess" value={holidayName} onChange={(e) => setHolidayName(e.target.value)} disabled={creatingHoliday} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="holStart">Start Date</label>
                  <input id="holStart" type="date" className="form-input" value={holidayStart} onChange={(e) => setHolidayStart(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="holEnd">End Date</label>
                  <input id="holEnd" type="date" className="form-input" value={holidayEnd} onChange={(e) => setHolidayEnd(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="holDesc">Description / Notes</label>
                <textarea id="holDesc" className="form-textarea" rows="3" placeholder="Additional details..." value={holidayDesc} onChange={(e) => setHolidayDesc(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creatingHoliday}>Declare Holiday</button>
            </form>
          </div>

          {/* List of Holidays */}
          <div className="card col-span-7">
            <h3>Holiday Schedule Listings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {holidays.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No academic recess declared.</p>
              ) : (
                holidays.map((hol) => (
                  <div key={hol.id} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: '600' }}>{hol.name}</h4>
                      {hol.description && <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0' }}>"{hol.description}"</p>}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Duration: {new Date(hol.startDate).toLocaleDateString()} - {new Date(hol.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteHoliday(hol.id)} className="btn btn-secondary btn-sm" style={{ padding: '8px', color: 'var(--color-absent)' }} title="Remove Break">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FEES DUES */}
      {activeTab === 'FEES' && (
        <div className="dashboard-grid">
          {/* Assign Fee Invoice */}
          <div className="card col-span-5">
            <h3>Invoiced Fee Due Allocation</h3>
            <form onSubmit={handleCreateFee}>
              <div className="form-group">
                <label className="form-label" htmlFor="feeStudent">Select Student</label>
                <select id="feeStudent" className="form-select" value={feeStudentId} onChange={(e) => setFeeStudentId(e.target.value)}>
                  {students.map(st => <option key={st.id} value={st.id}>{st.user.name} ({st.rollNumber})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="feeDesc">Invoice Description</label>
                <input id="feeDesc" type="text" className="form-input" placeholder="e.g. Semester 5 Tuition Fee" value={feeDesc} onChange={(e) => setFeeDesc(e.target.value)} disabled={creatingFee} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="feeAmount">Amount ($)</label>
                  <input id="feeAmount" type="number" step="0.01" className="form-input" placeholder="1250.00" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="feeDueDate">Due Date</label>
                  <input id="feeDueDate" type="date" className="form-input" value={feeDueDate} onChange={(e) => setFeeDueDate(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creatingFee}>Invoice Student</button>
            </form>
          </div>

          {/* Dues Listings */}
          <div className="card col-span-7">
            <h3>Student Fee Balances & Records</h3>
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {fees.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No student fees dues recorded.</p>
              ) : (
                <table className="attendance-list">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Student</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Amount</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((f) => (
                      <tr key={f.id} className="attendance-row">
                        <td className="attendance-cell">
                          <div style={{ fontWeight: '600' }}>{f.student.user.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Roll: {f.student.rollNumber}</div>
                        </td>
                        <td className="attendance-cell">
                          <div style={{ fontWeight: '500' }}>{f.description}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due: {new Date(f.dueDate).toLocaleDateString()}</div>
                        </td>
                        <td className="attendance-cell" style={{ textAlign: 'right', fontWeight: '700' }}>
                          ${f.amount.toFixed(2)}
                        </td>
                        <td className="attendance-cell" style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleFeeStatus(f.id, f.status)}
                            className={`badge ${f.status === 'PAID' ? 'badge-present' : 'badge-absent'}`}
                            style={{ border: 'none', cursor: 'pointer' }}
                            title="Toggle payment status"
                          >
                            {f.status}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: BRANDING */}
      {activeTab === 'BRANDING' && (
        <div className="card col-span-12" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>College Specification Profile</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Modify system-wide institution branding labels. Changes reflect on headers globally.
          </p>

          <form onSubmit={handleUpdateConfig}>
            <div className="form-group">
              <label className="form-label" htmlFor="colName">Institution Name</label>
              <input id="colName" type="text" className="form-input" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="e.g. City Technological University" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="colCode">Institution Code</label>
                <input id="colCode" type="text" className="form-input" value={collegeCode} onChange={(e) => setCollegeCode(e.target.value)} placeholder="e.g. CTU" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="colYear">Academic Year</label>
                <input id="colYear" type="text" className="form-input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g. 2026-2027" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={updatingConfig}>
              Save Specifications
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
