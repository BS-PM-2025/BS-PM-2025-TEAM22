// src/components/auth/Auth.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../styles/Auth.module.css';
import { FaGoogle } from 'react-icons/fa';

export default function Auth() {
  const { role: routeRole } = useParams();
  const { handleOAuthLogin, handleOAuthRedirect } = useAuth();

  const [activeTab, setActiveTab] = useState(routeRole || 'login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('beginner');
  const [preferredWorkouts, setPreferredWorkouts] = useState([]);
  const [role, setRole] = useState(routeRole || 'user');
  // הוספת המשתנים החסרים
  const [facilityName, setFacilityName] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');

  const workoutTypes = [
    { id: 'calisthenics', label: 'כושר גופני (מתח, מקבילים)' },
    { id: 'cardio', label: 'אירובי' },
    { id: 'strength', label: 'כוח' },
    { id: 'flexibility', label: 'גמישות' },
    { id: 'seniorFitness', label: 'כושר לגיל השלישי' }
  ];

  useEffect(() => { 
    setErrorMessage(''); 
  }, [activeTab]);
  
  useEffect(() => { 
    handleOAuthRedirect(); 
  }, [handleOAuthRedirect]);

  const handleWorkoutTypeChange = (e) => {
    const { value, checked } = e.target;
    setPreferredWorkouts(prev =>
      checked ? [...prev, value] : prev.filter(v => v !== value)
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        if (error.status === 400) {
          setErrorMessage('אימייל או סיסמה שגויים');
        } else {
          setErrorMessage('אירעה שגיאה בהתחברות. נסה שוב מאוחר יותר.');
        }
        throw error;
      }
    } catch (err) {
      console.error('שגיאה ב-login:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateSignup = () => {
    if (signupPassword !== confirmPassword) {
      setErrorMessage('סיסמאות אינן תואמות');
      return false;
    }
    if (signupPassword.length < 6) {
      setErrorMessage('הסיסמה חייבת לפחות 6 תווים');
      return false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(signupEmail)) {
      setErrorMessage('אימייל לא תקין');
      return false;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      setErrorMessage('מספר טלפון לא תקין');
      return false;
    }
    if (idNumber && !/^\d{9}$/.test(idNumber)) {
      setErrorMessage('תעודת זהות לא תקינה');
      return false;
    }
    // בדיקות נוספות למנהלי מתקן
    if (role === 'facility_manager') {
      if (!facilityName) {
        setErrorMessage('יש למלא שם מתקן');
        return false;
      }
      if (!facilityAddress) {
        setErrorMessage('יש למלא כתובת מתקן');
        return false;
      }
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup()) {
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      // המרת המערך לפורמט מתאים לפי סוג העמודה ב-Supabase
      const workoutsStr = JSON.stringify(preferredWorkouts);
      
      console.log("רישום משתמש חדש עם תפקיד:", role);
      
      // נתונים למטא-דאטה של המשתמש
      const userData = {
        name,
        phone,
        id_number: idNumber,
        fitness_level: fitnessLevel,
        preferred_workouts: preferredWorkouts,
        role: role // חשוב! לוודא שהתפקיד נשמר כראוי
      };
      
      // אם מדובר במנהל מתקן, הוסף גם את פרטי המתקן למטא-דאטה
      if (role === 'facility_manager') {
        userData.facility_name = facilityName || '';
        userData.facility_address = facilityAddress || '';
      }
  
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: userData // שמירת כל הנתונים במטא-דאטה של המשתמש
        }
      });
      
      if (error) {
        throw error;
      }
  
      // יצירת פרופיל עם הנתונים הנוספים
      const { user } = data;
      if (user) {
        // קביעת סטטוס אישור לפי סוג המשתמש
        const isFacilityManager = role === 'facility_manager';
        const approval_status = isFacilityManager ? 'pending' : 'approved';
        const approved_at = isFacilityManager ? null : new Date().toISOString();
  
        const newProfile = {
          user_id: user.id,
          email: signupEmail,
          name,
          phone,
          id_number: idNumber,
          fitness_level: fitnessLevel,
          preferred_workouts: workoutsStr,
          role,
          approval_status,
          approved_at,
          // הוספת נתונים למנהלי מתקן
          ...(isFacilityManager && {
            facility_name: facilityName || '',
            facility_address: facilityAddress || ''
          })
        };
        
        console.log("יוצר פרופיל עם נתונים:", newProfile);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select();
          
        if (profileError) {
          console.error('שגיאה בהכנסת פרופיל:', profileError);
          throw profileError;
        }
        
        // בדיקה שהנתונים נשמרו נכון
        if (profileData && profileData.length > 0) {
          console.log("פרופיל נשמר:", profileData[0]);
          console.log("תפקיד שנשמר:", profileData[0].role);
          console.log("סטטוס אישור שנשמר:", profileData[0].approval_status);
        }
  
        // הודעת הצלחה מותאמת לפי סוג המשתמש
        if (isFacilityManager) {
          setErrorMessage('נרשמת בהצלחה! חשבונך ממתין לאישור מנהל המערכת.');
        } else {
          setErrorMessage('נרשמת בהצלחה! בדוק/י את המייל לאישור.');
        }
        
        setActiveTab('login');
      }
    } catch (err) {
      console.error('שגיאה ב-signup:', err);
      setErrorMessage(err.message || 'אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <img src='/Fmap1.png' alt='Urban Fitness' />
        <h1>FitMap</h1>
      </div>

      <div className={styles.tabs}>
        <button 
          onClick={() => setActiveTab('login')} 
          className={activeTab === 'login' ? styles.activeTab : ''}
        >
          התחברות
        </button>
        <button 
          onClick={() => setActiveTab('signup')} 
          className={activeTab === 'signup' ? styles.activeTab : ''}
        >
          הרשמה
        </button>
      </div>

      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

      <div className={styles.oauthButtons}>
        <button 
          onClick={() => handleOAuthLogin('google')} 
          disabled={loading} 
          className={styles.oauthButton}
        >
          <FaGoogle size={20}/> התחבר עם Google
        </button>
      </div>

      {activeTab === 'login' ? (
        <form onSubmit={handleLogin} className={styles.form}>
          <input 
            type='email' 
            placeholder='אימייל' 
            required 
            dir='rtl' 
            className={styles.input} 
            value={loginEmail} 
            onChange={e => setLoginEmail(e.target.value)} 
          />
          <input 
            type='password' 
            placeholder='סיסמה' 
            required 
            dir='rtl' 
            className={styles.input} 
            value={loginPassword} 
            onChange={e => setLoginPassword(e.target.value)} 
          />
          <button 
            type='submit' 
            className={styles.button} 
            disabled={loading}
          >
            {loading ? 'מתחבר...' : 'התחבר'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignup} className={styles.form}>
          <input 
            type='email' 
            placeholder='אימייל' 
            required 
            dir='rtl' 
            className={styles.input} 
            value={signupEmail} 
            onChange={e => setSignupEmail(e.target.value)} 
          />
          <input 
            type='password' 
            placeholder='סיסמה' 
            required 
            dir='rtl' 
            className={styles.input} 
            value={signupPassword} 
            onChange={e => setSignupPassword(e.target.value)} 
          />
          <input 
            type='password' 
            placeholder='אימות סיסמה' 
            required 
            dir='rtl' 
            className={styles.input} 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
          />
          <input 
            type='text' 
            placeholder='שם מלא (לא חובה)' 
            dir='rtl' 
            className={styles.input} 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
          <input 
            type='tel' 
            placeholder='טלפון (לא חובה)' 
            dir='rtl' 
            className={styles.input} 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
          />
          <input 
            type='text' 
            placeholder='תעודת זהות (לא חובה)' 
            dir='rtl' 
            className={styles.input} 
            value={idNumber} 
            onChange={e => setIdNumber(e.target.value)} 
          />
          <div className={styles.fieldGroup}>
            <label className={styles.label}>רמת כושר</label>
            <select 
              value={fitnessLevel} 
              onChange={e => setFitnessLevel(e.target.value)} 
              dir='rtl' 
              className={styles.select}
            >
              <option value='beginner'>מתחיל</option>
              <option value='intermediate'>בינוני</option>
              <option value='advanced'>מתקדם</option>
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>סוגי אימון מועדפים</label>
            <div className={styles.checkboxGroup}>
              {workoutTypes.map(type => (
                <div key={type.id} className={styles.checkbox}>
                  <input 
                    type='checkbox' 
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
            <div className={styles.fieldGroup}>
              <label className={styles.label}>תפקיד</label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                dir='rtl' 
                className={styles.select}
              >
                <option value='user'>משתמש רגיל</option>
                <option value='facility_manager'>מנהל מתקן</option>
                <option value='admin'>מנהל מערכת</option>
              </select>
            </div>
          )}
          
          {/* שדות נוספים למנהלי מתקן */}
          {role === 'facility_manager' && (
            <div className={styles.facilityFields}>
              <input 
                type='text' 
                placeholder='שם המתקן' 
                required 
                dir='rtl' 
                className={styles.input} 
                value={facilityName} 
                onChange={e => setFacilityName(e.target.value)} 
              />
              <input 
                type='text' 
                placeholder='כתובת המתקן' 
                required 
                dir='rtl' 
                className={styles.input} 
                value={facilityAddress} 
                onChange={e => setFacilityAddress(e.target.value)} 
              />
            </div>
          )}
          
          <button 
            type='submit' 
            className={styles.button} 
            disabled={loading}
          >
            {loading ? 'מעבד...' : 'הרשם'}
          </button>
        </form>
      )}
    </div>
  );
}