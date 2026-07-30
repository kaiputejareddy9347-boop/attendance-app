import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/Toast';
import { Calendar, BookOpen, User, MapPin } from 'lucide-react';

const Timetable = () => {
  const { showToast } = useToast();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await axios.get('/api/student/timetable');
      setSlots(res.data);
    } catch (err) {
      console.error(err);
      showToast('Could not load timetable.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading Class Schedule...</p>
      </div>
    );
  }

  // Group slots by dayOfWeek (1 = Monday, etc.)
  const getSlotsForDay = (dayIndex) => {
    return slots.filter((slot) => slot.dayOfWeek === dayIndex);
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Calendar size={24} style={{ color: 'var(--accent-primary)' }} />
          Class Weekly Timetable
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Track daily lecture schedules, class instructors, and lecture halls.
        </p>

        <div className="timetable-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {days.map((dayName, index) => {
            const dayIndex = index + 1; // 1-based index matching schema
            const daySlots = getSlotsForDay(dayIndex);

            return (
              <div key={dayName} className="timetable-grid" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
                <div className="timetable-day-header">
                  {dayName}
                </div>
                
                <div className="timetable-slots">
                  {daySlots.length === 0 ? (
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No lectures scheduled.
                    </div>
                  ) : (
                    daySlots.map((slot) => (
                      <div key={slot.id} className="timetable-slot">
                        <span className="timetable-slot-time">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <div className="timetable-slot-subject">
                          {slot.subject.name}
                        </div>
                        <div className="timetable-slot-details">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} /> {slot.subject.teacher.user.name}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {slot.room}
                          </span>
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
  );
};

export default Timetable;
