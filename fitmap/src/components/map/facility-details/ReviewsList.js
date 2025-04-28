// src/components/facility-details/ReviewsList.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import styles from './ReviewsList.module.css';

function ReviewsList({ facilityId, shouldRefresh, onRefreshComplete }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // טעינת ביקורות
  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setReviews(data || []);
      setError(null);
    } catch (err) {
      console.error('שגיאה בטעינת ביקורות:', err);
      setError('לא ניתן היה לטעון את הביקורות');
    } finally {
      setLoading(false);
      if (shouldRefresh) {
        onRefreshComplete();
      }
    }
  };

  // טעינה ראשונית של ביקורות
  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  // רענון ביקורות כאשר נדרש
  useEffect(() => {
    if (shouldRefresh) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRefresh]);

  const renderReviewContent = () => {
    if (loading) {
      return <p>טוען ביקורות...</p>;
    }
    
    if (error) {
      return <p className={styles.errorMessage}>{error}</p>;
    }
    
    if (reviews.length === 0) {
      return <p>אין עדיין ביקורות על מתקן זה.</p>;
    }

    return (
      <ul className={styles.reviewList}>
        {reviews.map((review) => (
          <li key={review.id} className={styles.reviewItem}>
            <div className={styles.reviewHeader}>
              <strong>{review.user_name}</strong>
              <span className={styles.reviewDate}>
                {new Date(review.created_at).toLocaleDateString('he-IL')}
              </span>
            </div>
            <div className={styles.reviewRating}>
              {"⭐".repeat(review.rating)}
            </div>
            <p className={styles.reviewComment}>{review.comment}</p>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.section}>
      <h4>ביקורות</h4>
      {renderReviewContent()}
    </div>
  );
}

export default ReviewsList;