// src/components/facility-details/ActionButtons.js
import React from 'react';
import { supabase } from '../../../utils/supabaseClient';
import styles from './ActionButtons.module.css';

function ActionButtons({ facility, userProfile }) {
  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
    window.open(url, '_blank');
  };

  const handleAddToFavorites = async () => {
    try {
      if (!userProfile || !facility) {
        return;
      }
  
      const { data: existing, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userProfile.id)
        .eq('google_place_id', facility.google_place_id);
  
      if (checkError) {
        throw checkError;
      }
  
      if (existing.length > 0) {
        alert('כבר קיים במועדפים');
        return;
      }
  
      const { error } = await supabase.from('favorites').insert([
        {
          user_id: userProfile.id,
          name: facility.name,
          address: facility.address,
          type: facility.type,
          rating: facility.rating || 0,
          latitude: facility.latitude,
          longitude: facility.longitude,
          google_place_id: facility.google_place_id,
          source: facility.source || 'google',
        }
      ]);
  
      if (error) {
        throw error;
      }
  
      alert("✅ נוסף למועדפים");
    } catch (err) {
      console.error("❌ שגיאה בהוספה:", err);
      alert("שגיאה בהוספה למועדפים");
    }
  };

  return (
    <div className={styles.buttonContainer}>
      <button className={styles.primaryButton} onClick={handleNavigate}>
        <i className="fas fa-directions"></i> נווט
      </button>
      {userProfile && (
        <button className={styles.secondaryButton} onClick={handleAddToFavorites}>
          <i className="fas fa-star"></i> שמור
        </button>
      )}
    </div>
  );
}

export default ActionButtons;