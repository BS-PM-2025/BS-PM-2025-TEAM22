
// כעת נוכל לייצוא את כל הקומפוננטות דרך קובץ אינדקס:

// index.js בתיקיית profile
import ProfilePage from './ProfilePage'; // זה השם החדש של הקובץ הראשי במקום index.js
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import EditProfileModal from './EditProfileModal';
import TabContent from './TabContent';
import Overview from './Overview';
import WorkoutsTab from './WorkoutsTab';
import ChallengesTab from './ChallengesTab';
import GroupWorkoutsTab from './GroupWorkoutsTab';

export { 
  ProfilePage as default,
  ProfileHeader,
  ProfileTabs,
  EditProfileModal,
  TabContent,
  Overview,
  WorkoutsTab,
  ChallengesTab,
  GroupWorkoutsTab
};


