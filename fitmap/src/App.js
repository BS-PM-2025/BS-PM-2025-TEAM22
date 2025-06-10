// src/App.js
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
// קונטקסט חברתי
import { SocialProvider } from "./contexts/SocialContext";

// קומפוננטות משותפות
import Navbar from "./components/shared/Navbar";
import BottomNavbar from "./components/shared/BottomNavbar";
import Footer from "./components/shared/Footer";
import LoadingSpinner from "./components/shared/LoadingSpinner";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/legal/CookieConsent";

// אימות והגדרות
import { useAuth } from "./hooks/useAuth";
import RoleSelection from "./components/auth/RoleSelection";
import Auth from "./components/auth/Auth";
import PendingApproval from "./components/auth/PendingApproval";

// דפים סטטיים
import About from "./components/shared/About";
import CookiesPolicy from "./components/legal/CookiesPolicy";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import TermsOfService from "./components/legal/TermsOfService";
import ContactPage from "./components/Contact/ContactPage";

// פרופיל, מועדפים ומפה
import Profile from "./components/user/Profile/Profile";
import Favorites from "./components/user/Favorites";
import FitnessMap from "./components/map/FitnessMap";

// אימונים
import WorkoutGenerator from "./components/workouts/WorkoutGenerator";
import ExerciseLibrary from "./components/workouts/ExerciseLibrary";
import ExerciseDetail from "./components/workouts/ExerciseDetail";
import FavoriteExercises from "./components/workouts/FavoriteExercises";
import WorkoutTracker from "./components/workouts/WorkoutTracker";
import WorkoutCalendar from "./components/workouts/WorkoutCalendar";

// מאמן אישי
import PersonalTrainer from "./components/personaltrainer/PersonalTrainer";
import ConversationHistory from "./components/personaltrainer/ConversationHistory";
import ConversationDetail from "./components/personaltrainer/ConversationDetail";

// קבוצות
import GroupWorkouts from "./components/groups/GroupWorkouts";
import WorkoutDetailPage from "./components/groups/WorkoutDetailPage";
import EditWorkoutPage from "./components/groups/EditWorkoutPage";

// אתגרים
import CommunityChallenge from "./components/challenges/CommunityChallenge";
import ChallengeDetail from "./components/challenges/ChallengeDetail";
import CreateChallengeForm from "./components/challenges/CreateChallengeForm";

// רשת חברתית - דפים
import SocialFeed from "./pages/SocialFeed";
import Explore from "./pages/Explore";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";
// רשת חברתית - רכיבים נוספים
import ActivityFeed from "./components/social/ActivityFeed";
import FollowersList from "./components/social/FollowersList";
import FollowingList from "./components/social/FollowingList";
import AdminDashboard from "./components/admin/AdminDashboard";
import FacilityDashboard from "./components/facility/FacilityDashboard";

//צאט
import ChatList from "./components/chat/ChatList";
import PrivateChatRoom from "./components/chat/PrivateChatRoom";
import { OnlineStatusProvider } from "./contexts/OnlineStatusContext";

// ניתוב מוגן
const PrivateRoute = ({ children, requiredRole, requireApproved = true }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen text="טוען..." />;
  if (!user) return <Navigate to="/auth" />;

  if (requiredRole && userProfile?.role !== requiredRole) {
    return <Navigate to="/auth" />;
  }

  if (
    requireApproved &&
    userProfile?.approval_status !== "approved" &&
    userProfile?.role !== "user" &&
    userProfile?.role !== "admin"
  ) {
    return <Navigate to="/pending-approval" />;
  }

  return children;
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <SocialProvider>
      <OnlineStatusProvider>
        <div className={`app ${theme}`}>
          <Navbar toggleTheme={toggleTheme} theme={theme} />
          <main className="main-content">
            <CookieConsent />
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<RoleSelection />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/signup/:role" element={<Auth />} />
              <Route path="/pending-approval" element={<PendingApproval />} />

              {/* כללי */}
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiesPolicy />} />
              <Route path="/Contact" element={<ContactPage />} />

              {/* משתמשים */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <PrivateRoute>
                    <Favorites />
                  </PrivateRoute>
                }
              />
              <Route
                path="/fitness-map"
                element={
                  <PrivateRoute>
                    <FitnessMap />
                  </PrivateRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <PrivateRoute>
                    <ActivityFeed />
                  </PrivateRoute>
                }
              />

              {/* אימונים */}
              <Route
                path="/facility/:facilityId/workout-generator"
                element={
                  <PrivateRoute>
                    <WorkoutGenerator />
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises"
                element={
                  <PrivateRoute>
                    <ExerciseLibrary />
                  </PrivateRoute>
                }
              />
              <Route
                path="/exercises/:exerciseId"
                element={
                  <PrivateRoute>
                    <ExerciseDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/workout-tracker"
                element={
                  <PrivateRoute>
                    <WorkoutTracker />
                  </PrivateRoute>
                }
              />
              <Route
                path="/workout-tracker/:workoutId"
                element={
                  <PrivateRoute>
                    <WorkoutCalendar />
                  </PrivateRoute>
                }
              />
              <Route
                path="/favorites-exercises/:exerciseId"
                element={
                  <PrivateRoute>
                    <FavoriteExercises />
                  </PrivateRoute>
                }
              />

              {/* מאמן אישי */}
              <Route
                path="/personal-trainer"
                element={
                  <PrivateRoute>
                    <PersonalTrainer />
                  </PrivateRoute>
                }
              />
              <Route
                path="/conversation-history"
                element={
                  <PrivateRoute>
                    <ConversationHistory />
                  </PrivateRoute>
                }
              />
              <Route
                path="/conversation/:conversationId"
                element={
                  <PrivateRoute>
                    <ConversationDetail />
                  </PrivateRoute>
                }
              />
              {/* צאט */}
              <Route path="/chats" element={<ChatList />} />
              <Route path="/chat/:chatId" element={<PrivateChatRoom />} />
              {/* קבוצות */}
              <Route
                path="/group-workouts"
                element={
                  <PrivateRoute>
                    <GroupWorkouts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/group-workouts/:workoutId"
                element={
                  <PrivateRoute>
                    <WorkoutDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/group-workouts/edit/:workoutId"
                element={
                  <PrivateRoute>
                    <EditWorkoutPage />
                  </PrivateRoute>
                }
              />

              {/* אתגרים */}
              <Route
                path="/challenges"
                element={
                  <PrivateRoute>
                    <CommunityChallenge />
                  </PrivateRoute>
                }
              />
              <Route
                path="/challenges/:challengeId"
                element={
                  <PrivateRoute>
                    <ChallengeDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/challenges/create"
                element={
                  <PrivateRoute requiredRole="admin">
                    <CreateChallengeForm />
                  </PrivateRoute>
                }
              />

              {/* רשת חברתית */}
              <Route
                path="/community"
                element={
                  <PrivateRoute>
                    <SocialFeed />
                  </PrivateRoute>
                }
              />
              <Route
                path="/explore"
                element={
                  <PrivateRoute>
                    <Explore />
                  </PrivateRoute>
                }
              />
              <Route
                path="/user/:userId"
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/followers/:userId"
                element={
                  <PrivateRoute>
                    <FollowersList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/following/:userId"
                element={
                  <PrivateRoute>
                    <FollowingList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <Notifications />
                  </PrivateRoute>
                }
              />

              {/* אדמין / מנהל מתקן */}
              <Route
                path="/facility/:id"
                element={
                  <PrivateRoute>
                    <FacilityDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <PrivateRoute requiredRole="admin">
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
          <BottomNavbar />
          <Footer />
        </div>
      </OnlineStatusProvider>
    </SocialProvider>
  );
}

export default App;