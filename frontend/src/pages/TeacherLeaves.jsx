import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { FileText, Check, X, Calendar } from 'lucide-react';

const TeacherLeaves = () => {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/api/teacher/leaves');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
      showToast('Could not load leaves request list.', 'error');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading leave registry...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
          Student Leave Registry
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Process or review leave requests submitted by class students.
        </p>

        {leaves.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No leave requests filed in the system.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leaves.map((leave) => (
              <div key={leave.id} style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.015)',
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
                      {leave.student.rollNumber}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <strong>Reason:</strong> "{leave.reason}"
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>Duration: {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherLeaves;
