import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { History, BookOpen, Clock } from 'lucide-react';

const TeacherHistory = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/teacher/attendance-history');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      showToast('Could not load attendance history logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading History logs...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={24} style={{ color: 'var(--accent-primary)' }} />
          Attendance Submission History
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Roster logs of your marked and submitted student sessions.
        </p>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No attendance sessions marked yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="attendance-list">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Session Date</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Subject</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="attendance-row">
                    <td className="attendance-cell" style={{ fontWeight: '600' }}>
                      {new Date(log.date).toLocaleDateString()}
                    </td>
                    <td className="attendance-cell">
                      <div style={{ fontWeight: '600' }}>{log.subject.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.subject.code}</div>
                    </td>
                    <td className="attendance-cell">
                      <div style={{ fontWeight: '600' }}>{log.student.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roll: {log.student.rollNumber}</div>
                    </td>
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
  );
};

export default TeacherHistory;
