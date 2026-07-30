import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { Settings, Plus, Users, BookOpen, Layers, History } from 'lucide-react';

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Listings data
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Create class form fields
  const [className, setClassName] = useState('');
  const [classDept, setClassDept] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  // Create subject form fields
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjTeacherId, setSubjTeacherId] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const statsRes = await axios.get('/api/admin/stats');
      setStats(statsRes.data);

      const classesRes = await axios.get('/api/admin/classes');
      setClasses(classesRes.data);

      const teachersRes = await axios.get('/api/admin/teachers');
      setTeachers(teachersRes.data);
      if (teachersRes.data.length > 0) setSubjTeacherId(teachersRes.data[0].id);

      const subjectsRes = await axios.get('/api/admin/subjects');
      setSubjects(subjectsRes.data);
    } catch (err) {
      console.error(err);
      showToast('Could not load administrative details.', 'error');
    } finally {
      setLoading(false);
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
      await axios.post('/api/admin/classes', { name: className, department: classDept });
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
      await axios.post('/api/admin/subjects', { name: subjName, code: subjCode, teacherId: subjTeacherId });
      showToast('New subject added.', 'success');
      setSubjName('');
      setSubjCode('');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to create subject.', 'error');
    } finally {
      setCreatingSubject(false);
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

  return (
    <div className="app-container">
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={28} style={{ color: 'var(--accent-primary)' }} />
        Registrar Control Panel
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        System-wide database management and logs.
      </p>

      {/* Counts Grid */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="card col-span-3" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', padding: '12px', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Students</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{counts.students}</div>
          </div>
        </div>
        
        <div className="card col-span-3" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--accent-secondary-glow)', color: 'var(--accent-secondary)', padding: '12px', borderRadius: '12px' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Faculty</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{counts.teachers}</div>
          </div>
        </div>

        <div className="card col-span-3" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-present)', padding: '12px', borderRadius: '12px' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Classes</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{counts.classes}</div>
          </div>
        </div>

        <div className="card col-span-3" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-late)', padding: '12px', borderRadius: '12px' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Subjects</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{counts.subjects}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Create Class Form */}
        <div className="card col-span-4">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Plus size={20} style={{ color: 'var(--accent-primary)' }} />
            Add Class Group
          </h3>
          <form onSubmit={handleCreateClass}>
            <div className="form-group">
              <label className="form-label" htmlFor="className">Class Name</label>
              <input
                id="className"
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science - Year 4"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={creatingClass}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="classDept">Department</label>
              <input
                id="classDept"
                type="text"
                className="form-input"
                placeholder="e.g. Computer Engineering"
                value={classDept}
                onChange={(e) => setClassDept(e.target.value)}
                disabled={creatingClass}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creatingClass}>
              Add Class
            </button>
          </form>
        </div>

        {/* Create Subject Form */}
        <div className="card col-span-4">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Plus size={20} style={{ color: 'var(--accent-secondary)' }} />
            Add Subject
          </h3>
          <form onSubmit={handleCreateSubject}>
            <div className="form-group">
              <label className="form-label" htmlFor="subjName">Subject Name</label>
              <input
                id="subjName"
                type="text"
                className="form-input"
                placeholder="e.g. Distributed Computing"
                value={subjName}
                onChange={(e) => setSubjName(e.target.value)}
                disabled={creatingSubject}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="subjCode">Subject Code</label>
              <input
                id="subjCode"
                type="text"
                className="form-input"
                placeholder="e.g. CS401"
                value={subjCode}
                onChange={(e) => setSubjCode(e.target.value)}
                disabled={creatingSubject}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="subjTeacher">Assign Instructor</label>
              <select
                id="subjTeacher"
                className="form-select"
                value={subjTeacherId}
                onChange={(e) => setSubjTeacherId(e.target.value)}
                disabled={creatingSubject}
              >
                {teachers.length === 0 ? (
                  <option value="">No teachers registered</option>
                ) : (
                  teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} ({t.employeeId})
                    </option>
                  ))
                )}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={creatingSubject}>
              Add Subject
            </button>
          </form>
        </div>

        {/* System Subjects List */}
        <div className="card col-span-4">
          <h3>Registered Subjects</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>Active courses & assigned faculty.</p>
          <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {subjects.map((sub) => (
              <div key={sub.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{sub.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Code: {sub.code}</span>
                  <span>Faculty: {sub.teacher.user.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Roster Logs */}
        <div className="card col-span-12">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <History size={20} style={{ color: 'var(--accent-primary)' }} />
            Recent Global Attendance Logs
          </h3>
          {recentLogs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No attendance sessions logged in the system yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="attendance-list">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Subject</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Student</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
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
    </div>
  );
};

export default AdminDashboard;
