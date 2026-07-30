import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { FileText, Send, Calendar } from 'lucide-react';

const StudentLeaves = () => {
  const { showToast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form Fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/api/student/leaves');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
      showToast('Could not load leaves history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/student/leaves', { startDate, endDate, reason });
      showToast('Leave request submitted successfully.', 'success');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err) {
      showToast('Failed to submit leave request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading Leave Registry...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="dashboard-grid">
        {/* Request Form */}
        <div className="card col-span-5">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
            Request Absence Leave
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Submit a request to clear attendance flags for sick/event days.
          </p>

          <form onSubmit={handleRequestLeave}>
            <div className="form-group">
              <label className="form-label" htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
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
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reason">Reason / Notes</label>
              <textarea
                id="reason"
                className="form-textarea"
                rows="4"
                placeholder="Explain the emergency or event details..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Submitting Request...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Request History List */}
        <div className="card col-span-7">
          <h2>My Leave Requests</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Audited history of your leave submissions.
          </p>

          {leaves.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No leave requests filed yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
              {leaves.map((leave) => (
                <div key={leave.id} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{leave.reason}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${leave.status.toLowerCase()}`}>
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLeaves;
