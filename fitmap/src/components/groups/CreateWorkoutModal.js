import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import styles from './styles/CreateWorkoutModal.module.css';

function CreateWorkoutModal({ onClose }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState('all');
  const [workoutType, setWorkoutType] = useState('mixed');
  const [locationName, setLocationName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile) return;
  
    setLoading(true);
  
    const { data, error } = await supabase
      .from("group_workouts")
      .insert({
        title,
        description,
        start_time: new Date(startTime).toISOString(),
        duration_minutes: duration,
        difficulty,
        workout_type: workoutType,
        facility_name: locationName,
        creator_id: userProfile.user_id,
        max_participants: maxParticipants,
        is_public: true,
      })
      .select()
      .single();
  
    if (error) {
      alert("❌ שגיאה ביצירת אימון: " + error.message);
    } else {
      alert("✅ האימון נוצר בהצלחה!");
      navigate(`/group-workouts/${data.id}`);
      onClose();
    }
  
    setLoading(false);
  };
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>יצירת אימון חדש</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>שם האימון:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>תיאור:</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

          <label>מיקום:</label>
          <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} required />

          <label>זמן התחלה:</label>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />

          <label>משך (בדקות):</label>
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={10} max={180} required />

          <label>רמת קושי:</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="beginner">מתחיל</option>
            <option value="intermediate">בינוני</option>
            <option value="advanced">מתקדם</option>
            <option value="all">כל הרמות</option>
          </select>

          <label>סוג אימון:</label>
          <select value={workoutType} onChange={(e) => setWorkoutType(e.target.value)}>
            <option value="strength">חיזוק</option>
            <option value="cardio">סיבולת</option>
            <option value="flexibility">גמישות</option>
            <option value="mixed">משולב</option>
          </select>

          <label>מספר משתתפים מקסימלי:</label>
          <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} min={1} max={100} />

          <div className={styles.actions}>
            <button type="submit" disabled={loading}>{loading ? 'יוצר...' : 'צור אימון'}</button>
            <button type="button" onClick={onClose}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateWorkoutModal;
