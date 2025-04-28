// src/components/facility/FacilityDashboard.js - קוד מתוקן
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../styles/Dashboard.module.css';

function FacilityDashboard() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManagedFacilities = async () => {
      if (!user) {
        setLoading(false);
        return; 
      }
      
      try {
        setLoading(true);
        
        // שלב 1: טעינת המתקנים המנוהלים
        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from('facilities')
          .select('*')
          .eq('managed_by', user.id);
        
        if (facilitiesError) {
          throw facilitiesError;
        }
        
        if (!facilitiesData || facilitiesData.length === 0) {
          setFacilities([]);
          setLoading(false);
          return;
        }
        
        // שלב 2: טעינת מספר הביקורות לכל מתקן בנפרד
        const facilityIds = facilitiesData.map(facility => facility.id);
        let facilitiesWithReviews = [...facilitiesData];
        
        try {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('facility_id, id')
            .in('facility_id', facilityIds);
            
          if (!reviewsError && reviewsData) {
            // נספור כמה ביקורות יש לכל מתקן
            const reviewCounts = {};
            reviewsData.forEach(review => {
              reviewCounts[review.facility_id] = (reviewCounts[review.facility_id] || 0) + 1;
            });
            
            // נוסיף את הספירה למתקנים
            facilitiesWithReviews = facilitiesData.map(facility => ({
              ...facility,
              reviews_count: reviewCounts[facility.id] || 0
            }));
          }
        } catch (reviewErr) {
          console.warn("שגיאה בטעינת ביקורות:", reviewErr);
          // ממשיכים גם אם נכשלה טעינת הביקורות
          facilitiesWithReviews = facilitiesData.map(facility => ({
            ...facility,
            reviews_count: 0
          }));
        }
        
        setFacilities(facilitiesWithReviews);
      } catch (error) {
        console.error('שגיאה בטעינת מתקנים:', error);
        setError('אירעה שגיאה בטעינת המתקנים');
      } finally {
        setLoading(false);
      }
    };

    fetchManagedFacilities();
  }, [user]);

  return (
    <div className={styles.container}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.title}>לוח בקרה - ניהול מתקנים</h1>
        <Link to="/facility/new" className={styles.addButton}>
          <i className="fas fa-plus"></i> הוסף מתקן חדש
        </Link>
      </header>
      {error && (
        <div className={styles.errorMessage}>{error}</div>
      )}

      {loading ? (
        <div className={styles.loading}>טוען מתקנים...</div>
      ) : facilities.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-dumbbell"></i>
          </div>
          <h3>אין לך מתקנים לניהול עדיין</h3>
          <p>הוסף את המתקן הראשון שלך כדי להתחיל לנהל אותו</p>
          <Link to="/facility/new" className={styles.emptyActionButton}>
            <i className="fas fa-plus"></i> הוסף מתקן חדש
          </Link>
        </div>
      ) : (
        <div className={styles.facilitiesList}>
          <div className={styles.tableHeader}>
            <div className={styles.nameColumn}>שם המתקן</div>
            <div className={styles.addressColumn}>כתובת</div>
            <div className={styles.typeColumn}>סוג</div>
            <div className={styles.statsColumn}>ביקורות</div>
            <div className={styles.ratingColumn}>דירוג</div>
            <div className={styles.actionsColumn}>פעולות</div>
          </div>
          
          {facilities.map(facility => (
            <div key={facility.id} className={styles.tableRow}>
              <div className={styles.nameColumn}>{facility.name}</div>
              <div className={styles.addressColumn}>{facility.address}</div>
              <div className={styles.typeColumn}>
                <span className={styles.facilityType}>{facility.type}</span>
              </div>
              <div className={styles.statsColumn}>{facility.reviews_count}</div>
              <div className={styles.ratingColumn}>
                <div className={styles.stars}>
                  {Array(5).fill(0).map((_, i) => (
                    <i 
                      key={i} 
                      className={`fas fa-star ${i < Math.round(facility.rating || 0) ? styles.filledStar : styles.emptyStar}`}
                    ></i>
                  ))}
                </div>
              </div>
              <div className={styles.actionsColumn}>
                <Link 
                  to={`/facility/edit/${facility.id}`} 
                  className={styles.editAction}
                  title="ערוך מתקן"
                >
                  <i className="fas fa-edit"></i>
                </Link>
                <Link 
                  to={`/facility/events/${facility.id}`} 
                  className={styles.eventsAction}
                  title="נהל אירועים"
                >
                  <i className="fas fa-calendar-alt"></i>
                </Link>
                <Link 
                  to={`/fitness-map?facility=${facility.id}`} 
                  className={styles.viewAction}
                  title="צפה במפה"
                >
                  <i className="fas fa-map-marked-alt"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FacilityDashboard;