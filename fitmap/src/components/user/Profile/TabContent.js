import React from 'react';
import Overview from './Overview';
import WorkoutsTab from './WorkoutsTab';
import ChallengesTab from './ChallengesTab';
import GroupWorkoutsTab from './GroupWorkoutsTab';
import ProfileChatsTab from './ProfileChatsTab'; // ייבוא קומפוננטת הצ'אטים החדשה
import styles from "./Profile.module.css";

function TabContent({ activeTab, userData, profileData, user, formatDateHebrew, navigate, refreshUserData }) {
  // פונקציה להמרת דקות לפורמט קריא
  const formatMinutes = (minutes) => {
    if (!minutes) return '0 דקות';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} דקות`;
    if (mins === 0) return `${hours} שעות`;
    
    return `${hours} שעות ו-${mins} דקות`;
  };

  // בעת החלפת טאב, אם הטאב הוא 'challenges' ויש דאטה, עבד את הנתונים
  React.useEffect(() => {
    if (activeTab === 'challenges' && userData.challenges) {
      // כאן אפשר להוסיף לוגיקה נוספת במידת הצורך
      console.log("Challenges tab activated, challenges data:", userData.challenges);
    }
  }, [activeTab, userData.challenges]);

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <Overview 
            userData={userData} 
            formatMinutes={formatMinutes}
            navigate={navigate}
          />
        );
      case 'workouts':
        return (
          <WorkoutsTab 
            workoutHistory={userData.workoutHistory}
            loading={userData.loading}
            navigate={navigate}
          />
        );
    
      case 'challenges':
        return (
          <ChallengesTab 
            challenges={userData.challenges}
            loading={userData.loading}
            navigate={navigate}
            formatDateHebrew={formatDateHebrew}
          />
        );
      case 'groups':
        return (
          <GroupWorkoutsTab 
            groupWorkouts={userData.groupWorkouts}
            loading={userData.loading}
            navigate={navigate}
            formatDateHebrew={formatDateHebrew}
          />
        );
      
      case 'chats':
        return (
          <ProfileChatsTab 
            chats={userData.chats}
            navigate={navigate}
            refreshData={refreshUserData}
          />
        );
        
      default:
        return <div>תוכן לא זמין</div>;
    }
  };

  return (
    <div className={styles.tabContent}>
      {renderContent()}
    </div>
  );
}

export default TabContent;