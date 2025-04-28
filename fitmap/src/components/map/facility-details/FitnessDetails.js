// src/components/facility-details/FitnessDetails.js
import React, { useState } from 'react';
import ImageGallery from './ImageGallery';
import FacilityInfo from './FacilityInfo';
import EquipmentList from './EquipmentList';
import FeaturesList from './FeaturesList';
import ActionButtons from './ActionButtons';
import ReviewForm from './ReviewForm';
import ReviewsList from './ReviewsList';
import ShareFacility from './ShareFacility';
import FacilityTraffic from './FacilityTraffic';
import EmbeddedMap from './EmbeddedMap';
import styles from '../../../styles/FitnessDetails.module.css';

function FitnessDetails({ facility, onClose, userProfile }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsShouldRefresh, setReviewsShouldRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'traffic', 'reviews'
  
  const isGoogleSource = facility.source === 'google';

  // סיים את הוספת הביקורת בהצלחה, סגור את הטופס ורענן את הביקורות
  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setReviewsShouldRefresh(true);
    setActiveTab('reviews'); // עבור ללשונית ביקורות אחרי הוספת ביקורת
  };

  // וידוא שיש לנו מתקן תקין
  if (!facility) {
    return <div className={styles.errorMessage}>לא נמצאו פרטי מתקן</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'traffic':
        return <FacilityTraffic facilityId={facility.id} />;
      case 'reviews':
        return (
          <>
            {userProfile && !isGoogleSource && (
              <>
                {!showReviewForm ? (
                  <button 
                    onClick={() => setShowReviewForm(true)} 
                    className={styles.secondaryButton}
                  >
                    <i className="fas fa-pen"></i> כתוב ביקורת
                  </button>
                ) : (
                  <ReviewForm 
                    facilityId={facility.id}
                    userProfile={userProfile}
                    onSubmitted={handleReviewSubmitted}
                    onCancel={() => setShowReviewForm(false)}
                  />
                )}
              </>
            )}

            {!isGoogleSource && (
              <ReviewsList 
                facilityId={facility.id}
                shouldRefresh={reviewsShouldRefresh}
                onRefreshComplete={() => setReviewsShouldRefresh(false)}
              />
            )}
          </>
        );
      case 'details':
      default:
        return (
          <>
            <FacilityInfo 
              facility={facility} 
              isGoogleSource={isGoogleSource} 
            />

            {facility.description && (
              <div className={styles.section}>
                <h4>תיאור</h4>
                <p>{facility.description}</p>
              </div>
            )}

            <EquipmentList equipment={facility.equipment} />
            
            <FeaturesList features={facility.features} />

            {/* מפה מוטמעת */}
            <div className={styles.section}>
              <h4>מיקום</h4>
              <EmbeddedMap facility={facility} />
            </div>
          </>
        );
    }
  };

  // הדפסת מידע לדיבאג
  console.log('מציג מתקן:', facility);

  return (
    <div className={styles.detailsContainer}>
      <div className={styles.header}>
        <h2>{facility.name}</h2>
        <button onClick={onClose}>×</button>
      </div>

      {/* גלריית תמונות */}
      {facility.images && facility.images.length > 0 && (
        <ImageGallery images={facility.images} name={facility.name} />
      )}

      {/* כרטיסיות */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <i className="fas fa-info-circle"></i> פרטים
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'traffic' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('traffic')}
        >
          <i className="fas fa-users"></i> עומס
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <i className="fas fa-star"></i> ביקורות
          {!isGoogleSource && facility.review_count !== undefined && (
            <span className={styles.reviewCount}>{facility.review_count || 0}</span>
          )}
        </button>
      </div>

      {/* תוכן הכרטיסייה הפעילה */}
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>

      {/* כפתורי פעולה */}
      <div className={styles.actions}>
        <ActionButtons 
          facility={facility}
          userProfile={userProfile}
        />
        <ShareFacility facility={facility} />
      </div>
    </div>
  );
}

export default FitnessDetails;