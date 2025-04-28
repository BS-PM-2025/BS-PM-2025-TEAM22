// src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// קומפוננטות משותפות
import Navbar from "./components/shared/Navbar";
import Footer from "./components/shared/Footer";
import LoadingSpinner from "./components/shared/LoadingSpinner"; // רכיב חדש לטעינה

// דפים
import RoleSelection from "./components/auth/RoleSelection";
import Auth from "./components/auth/Auth";
import PendingApproval from "./components/auth/PendingApproval"; // דף חדש למשתמשים ממתינים לאישור
import About from "./components/shared/About";
import Profile from "./components/user/Profile";
import Favorites from "./components/user/Favorites";
import FitnessMap from "./components/map/FitnessMap";
import AdminDashboard from "./components/admin/AdminDashboard";
import FacilityDashboard from "./components/facility/FacilityDashboard";
// הוק אימות
import { useAuth } from "./hooks/useAuth";
import CookiesPolicy from "./components/legal/CookiesPolicy";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import TermsOfService from "./components/legal/TermsOfService";
import CookieConsent from "./components/Cookie/CookieConsent";
import ContactPage from "./components/Contact/ContactPage";
// סגנונות
import "./App.css";

// קומפוננטת ניתוב פרטי עם אפשרות לבדיקת אישור
const PrivateRoute = ({ children, requiredRole, requireApproved = true }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="טוען..." />;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  // בדיקת תפקיד אם נדרש
  if (requiredRole && (!userProfile || userProfile.role !== requiredRole)) {
    return <Navigate to="/auth" />;
  }

  // בדיקת אישור - רק אם נדרש אישור
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
    setTheme((prevTheme) => {
      return prevTheme === "dark" ? "light" : "dark";
    });
  };

  return (
    <Router>
      <div className={`app ${theme}`}>
        <Navbar toggleTheme={toggleTheme} theme={theme} />
        <main className="main-content">
        <CookieConsent />
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup/:role" element={<Auth />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* דף מפה עם הגנה */}
            <Route
              path="/fitness-map"
              element={
                <PrivateRoute requireApproved={true}>
                  <FitnessMap />
                </PrivateRoute>
              }
            />

            <Route path="/about" element={<About />} />

            {/* דפי משתמש מוגנים */}
            <Route
              path="/profile"
              element={
                <PrivateRoute requireApproved={false}>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <PrivateRoute requireApproved={true}>
                  <Favorites />
                </PrivateRoute>
              }
            />
            <Route
              path="/facility/:id"
              element={
                <PrivateRoute requireApproved={true}>
                  <FacilityDashboard />
                </PrivateRoute>
              }
            />
            {/* דף אדמין מוגן */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiesPolicy />} />
            <Route path="/Contact" element={<ContactPage />} />

          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
