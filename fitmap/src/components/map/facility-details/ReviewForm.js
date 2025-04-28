// src/components/facility-details/ReviewForm.js
import React, { useState } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import styles from './ReviewForm.module.css';

function ReviewForm({ facilityId, userProfile, onSubmitted, onCancel }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      return setError('התחבר כדי לכתוב ביקורת');
    }

    try {
      setSubmitting(true);
      
      const { error } = await supabase.from('reviews').insert({
        facility_id: facilityId,
        user_id: userProfile.id,
        user_name: userProfile.name,
        rating,
        comment,
        created_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      setComment('');
      setRating(5);
      alert('הביקורת נשלחה בהצלחה!');
      onSubmitted();
    } catch (err) {
      console.error('שגיאה בשליחת ביקורת:', err);
      setError('שגיאה בשליחת הביקורת');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.reviewForm}>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="כתוב ביקורת..."
        required
      />
      <div>
        דרג:
        {[1, 2, 3, 4, 5].map(i => (
          <i
            key={i}
            className={`fas fa-star ${i <= rating ? styles.selectedStar : styles.emptyStar}`}
            onClick={() => setRating(i)}
          ></i>
        ))}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <div className={styles.formButtonContainer}>
        <button type="submit" disabled={submitting} className={styles.primaryButton}>
          {submitting ? 'שולח...' : 'שלח ביקורת'}
        </button>
        <button 
          type="button" 
          className={styles.secondaryButton} 
          onClick={onCancel}
          disabled={submitting}
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

export default ReviewForm;