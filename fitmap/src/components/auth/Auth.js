// src/components/auth/Auth.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Auth.module.css';

function Auth() {
  const { role: routeRole } = useParams();
  const navigate = useNavigate();

  // מצבים לטופס התחברות והרשמה
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('login');

  // שדות טופס התחברות
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // שדות טופס הרשמה
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('beginner');
  const [preferredWorkouts, setPreferredWorkouts] = useState([]);
  const [role, setRole] = useState(routeRole || 'user');

  const workoutTypes = [
    { id: 'calisthenics', label: 'כושר גופני (מתח, מקבילים)' },
    { id: 'cardio', label: 'אירובי' },
    { id: 'strength', label: 'כוח' },
    { id: 'flexibility', label: 'גמישות' },
    { id: 'seniorFitness', label: 'כושר לגיל השלישי' }
  ];

  useEffect(() => {
    // בדיקה אם המשתמש כבר מחובר וניקוי session
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
    };
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (routeRole) {
      setRole(routeRole);
      setActiveTab('signup');
    }
  }, [routeRole]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      if (error) {
        throw error;
      }

      // בדיקה אם יש פרופיל למשתמש
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, approval_status')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.warn('שגיאה בטעינת פרופיל:', profileError.message);
        }

        // בדיקת סטטוס אישור עבור מנהלי מתקנים
        if (profileData?.role === 'facility_manager' && profileData?.approval_status !== 'approved') {
          navigate('/pending-approval');
          return;
        }

        // ניתוב לפי סוג המשתמש
        if (profileData?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (profileData?.role === 'facility_manager') {
          navigate('/facility/dashboard');
        } else {
          navigate('/fitness-map');
        }
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateSignup = () => {
    if (signupPassword !== confirmPassword) {
      setErrorMessage("סיסמאות אינן תואמות");
      return false;
    }
    if (signupPassword.length < 6) {
      setErrorMessage("הסיסמה חייבת להכיל לפחות 6 תווים");
      return false;
    }
    
    // ולידציה לאימייל
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      setErrorMessage("כתובת אימייל לא תקינה");
      return false;
    }
    
    // ולידציה לת"ז אם הוזן
    if (idNumber && idNumber.length !== 9) {
      setErrorMessage("תעודת זהות חייבת להכיל 9 ספרות");
      return false;
    }
    
    return true;
  };

  const handleWorkoutTypeChange = (e) => {
    const { value, checked } = e.target;
    setPreferredWorkouts(prev =>
      checked ? [...prev, value] : prev.filter(type => type !== value)
    );
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup()) {
      return;
    }
    setLoading(true);
    setErrorMessage('');

    try {
      // בדיקת אדמין יחיד
      if (role === 'admin') {
        const { data: admins, error: adminError } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('role', 'admin');
        
        if (adminError) {
          throw adminError;
        }
        
        if (admins && admins.length > 0) {
          const adminEmail = admins[0]?.email || '';
          throw new Error(`מנהל מערכת כבר קיים במערכת! ${adminEmail ? `ניתן ליצור קשר עם ${adminEmail}` : ''}`);
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
      });
      
      if (error) {
        throw error;
      }

      if (data.user) {
        // סטטוס אישור ראשוני - רק משתמשים רגילים ואדמין מאושרים אוטומטית
        const approvalStatus = (role === 'user' || role === 'admin') ? 'approved' : 'pending';
        
        const profileData = {
          user_id: data.user.id,
          email: signupEmail,
          role,
          name,
          phone,
          id_number: idNumber,
          fitness_level: fitnessLevel,
          preferred_workouts: preferredWorkouts,
          approval_status: approvalStatus,
          approved_at: (role === 'user' || role === 'admin') ? new Date().toISOString() : null
        };
        
        const { error: insertError } = await supabase.from('profiles').insert([profileData]);
        if (insertError) {
          throw insertError;
        }

        if (role === 'facility_manager') {
          setErrorMessage('החשבון נוצר! חשבונך יבדק ויאושר על ידי מנהל המערכת. נעדכן אותך באימייל כאשר חשבונך יאושר.');
        } else {
          setErrorMessage('החשבון נוצר! אנא בדוק את האימייל שלך לאישור החשבון.');
        }
        setActiveTab('login');
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
      <img 
          src="/Fmap1.png" 
          alt="Urban Fitness" 
        />
        <h1>מתקני כושר עירוניים</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'login' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('login')}
        >
          התחברות
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'signup' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('signup')}
        >
          הרשמה
        </button>
      </div>

      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}

      {activeTab === 'login' ? (
        // eslint-disable-next-line jsx-a11y/no-redundant-roles
        <form onSubmit={handleLogin} className={styles.form}  role="form" 
        aria-label="טופס התחברות" >
          <input
            type="email"
            className={styles.input}
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            placeholder="אימייל"
            required

            dir="rtl"
          />
          <input
            type="password"
            className={styles.input}
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            placeholder="סיסמה"
            required
            dir="rtl"
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>
      ) : (
        // eslint-disable-next-line jsx-a11y/no-redundant-roles
        <form onSubmit={handleSignup} className={styles.form}role="form"
        aria-label="טופס הרשמה">
          <input
            type="email"
            className={styles.input}
            value={signupEmail}
            onChange={e => setSignupEmail(e.target.value)}
            placeholder="אימייל"
            required
            dir="rtl"
          />
          <input
            type="password"
            className={styles.input}
            value={signupPassword}
            onChange={e => setSignupPassword(e.target.value)}
            placeholder="סיסמה"
            required
            dir="rtl"
          />
          <input
            type="password"
            className={styles.input}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="אימות סיסמה"
            required
            dir="rtl"
          />
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="שם מלא"
            required
            dir="rtl"
          />
          <input
            type="tel"
            className={styles.input}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="טלפון"
            dir="rtl"
          />
          <input
            type="text"
            id="idNumber"
            className={styles.input}
            value={idNumber}
            onChange={e => setIdNumber(e.target.value)}
            placeholder="תעודת זהות (9 ספרות)"
            dir="rtl"
          />
          <div className={styles.fieldGroup}>
            <label className={styles.label}>רמת כושר</label>
            <select
              className={styles.select}
              value={fitnessLevel}
              onChange={e => setFitnessLevel(e.target.value)}
              dir="rtl"
            >
              <option value="beginner">מתחיל</option>
              <option value="intermediate">בינוני</option>
              <option value="advanced">מתקדם</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>סוגי אימון מועדפים</label>
            <div className={styles.checkboxGroup}>
              {workoutTypes.map(type => (
                <div key={type.id} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    id={type.id}
                    value={type.id}
                    checked={preferredWorkouts.includes(type.id)}
                    onChange={handleWorkoutTypeChange}
                  />
                  <label htmlFor={type.id}>{type.label}</label>
                </div>
              ))}
            </div>
          </div>
          {!routeRole && (
            <select
              className={styles.select}
              value={role}
              onChange={e => setRole(e.target.value)}
              dir="rtl"
            >
              <option value="user">משתמש רגיל</option>
              <option value="facility_manager">מנהל מתקן</option>
              <option value="admin">מנהל מערכת</option>
            </select>
          )}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'מעבד...' : 'הרשמה'}
          </button>
        </form>
      )}
    </div>
  );
}

export default Auth;