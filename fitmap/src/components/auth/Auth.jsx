// src/components/auth/Auth.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import styles from './styles/Auth.module.css';
import { FaGoogle, FaUser, FaLock, FaEnvelope, FaPhone, FaIdCard, FaBuilding, FaMapMarkerAlt } from 'react-icons/fa';

export default function Auth() {
  const { role: routeRole } = useParams();
  const navigate = useNavigate();
  const { handleOAuthLogin, handleOAuthRedirect, user } = useAuth();

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
  const [facilityName, setFacilityName] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');

  const workoutTypes = [
    { id: 'calisthenics', label: 'כושר גופני (מתח, מקבילים)', icon: '🏋️' },
    { id: 'cardio', label: 'אירובי', icon: '🏃' },
    { id: 'strength', label: 'כוח', icon: '💪' },
    { id: 'flexibility', label: 'גמישות', icon: '🧘' },
    { id: 'seniorFitness', label: 'כושר לגיל השלישי', icon: '👴' }
  ];

  // אפקט להפניה למסך הבית אם המשתמש כבר מחובר
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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
      const { data, error } = await supabase.auth.signInWithPassword({
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

      if (data.user) {
        console.log('התחברות מוצלחת:', data.user);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.error('שגיאה בקבלת פרופיל:', profileError);
        } else {
          console.log('פרופיל נטען:', profileData);
          
          if (profileData.role === 'facility_manager' && profileData.approval_status === 'pending') {
            setErrorMessage('החשבון שלך ממתין לאישור מנהל המערכת');
            await supabase.auth.signOut();
            return;
          }
        }

        navigate('/');
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
      const workoutsStr = JSON.stringify(preferredWorkouts);
      
      console.log("רישום משתמש חדש עם תפקיד:", role);
      
      const userData = {
        name,
        phone,
        id_number: idNumber,
        fitness_level: fitnessLevel,
        preferred_workouts: preferredWorkouts,
        role: role
      };
      
      if (role === 'facility_manager') {
        userData.facility_name = facilityName || '';
        userData.facility_address = facilityAddress || '';
      }
  
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: userData
        }
      });
      
      if (error) {
        throw error;
      }
  
      const { user } = data;
      if (user) {
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
        
        if (profileData && profileData.length > 0) {
          console.log("פרופיל נשמר:", profileData[0]);
          console.log("תפקיד שנשמר:", profileData[0].role);
          console.log("סטטוס אישור שנשמר:", profileData[0].approval_status);
        }
  
        if (isFacilityManager) {
          setErrorMessage('נרשמת בהצלחה! חשבונך ממתין לאישור מנהל המערכת.');
          setActiveTab('login');
        } else {
          setErrorMessage('נרשמת בהצלחה! בדוק/י את המייל לאישור.');
          setActiveTab('login');
          
          if (user.email_confirmed_at) {
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        }
      }
    } catch (err) {
      console.error('שגיאה ב-signup:', err);
      setErrorMessage(err.message || 'אירעה שגיאה. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLoginWithRedirect = async (provider) => {
    try {
      setLoading(true);
      await handleOAuthLogin(provider);
    } catch (error) {
      console.error('שגיאה בהתחברות OAuth:', error);
      setErrorMessage('שגיאה בהתחברות עם Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <img src='/Fmap.png' alt='Urban Fitness' />
        <h1>FitMap</h1>
      </div>

      <div className={styles.formContainer}>
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

        {errorMessage && (
          <div className={`${styles.errorMessage} ${
            errorMessage.includes('נרשמת בהצלחה') ? styles.successMessage : ''
          }`}>
            {errorMessage}
          </div>
        )}

        <div className={styles.oauthButtons}>
          <button 
            onClick={() => handleOAuthLoginWithRedirect('google')} 
            disabled={loading} 
            className={styles.oauthButton}
          >
            <FaGoogle size={20}/> התחבר עם Google
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <FaEnvelope className={styles.inputIcon} />
              <input 
                type='email' 
                placeholder='אימייל' 
                required 
                dir='rtl' 
                className={styles.input} 
                value={loginEmail} 
                onChange={e => setLoginEmail(e.target.value)} 
              />
            </div>
            <div className={styles.inputGroup}>
              <FaLock className={styles.inputIcon} />
              <input 
                type='password' 
                placeholder='סיסמה' 
                required 
                dir='rtl' 
                className={styles.input} 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
              />
            </div>
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
            <div className={styles.inputGroup}>
              <FaEnvelope className={styles.inputIcon} />
              <input 
                type='email' 
                placeholder='אימייל' 
                required 
                dir='rtl' 
                className={styles.input} 
                value={signupEmail} 
                onChange={e => setSignupEmail(e.target.value)} 
              />
            </div>
            <div className={styles.inputGroup}>
              <FaLock className={styles.inputIcon} />
              <input 
                type='password' 
                placeholder='סיסמה' 
                required 
                dir='rtl' 
                className={styles.input} 
                value={signupPassword} 
                onChange={e => setSignupPassword(e.target.value)} 
              />
            </div>
            <div className={styles.inputGroup}>
              <FaLock className={styles.inputIcon} />
              <input 
                type='password' 
                placeholder='אימות סיסמה' 
                required 
                dir='rtl' 
                className={styles.input} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
              />
            </div>
            <div className={styles.inputGroup}>
              <FaUser className={styles.inputIcon} />
              <input 
                type='text' 
                placeholder='שם מלא (לא חובה)' 
                dir='rtl' 
                className={styles.input} 
                value={name} 
                onChange={e => setName(e.target.value)} 
              />
            </div>
            <div className={styles.inputGroup}>
              <FaPhone className={styles.inputIcon} />
              <input 
                type='tel' 
                placeholder='טלפון (לא חובה)' 
                dir='rtl' 
                className={styles.input} 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
              />
            </div>
            <div className={styles.inputGroup}>
              <FaIdCard className={styles.inputIcon} />
              <input 
                type='text' 
                placeholder='תעודת זהות (לא חובה)' 
                dir='rtl' 
                className={styles.input} 
                value={idNumber} 
                onChange={e => setIdNumber(e.target.value)} 
              />
            </div>
            
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
                    <label htmlFor={type.id}>
                      <span className={styles.workoutIcon}>{type.icon}</span>
                      {type.label}
                    </label>
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
            
            {role === 'facility_manager' && (
              <div className={styles.facilityFields}>
                <h3 className={styles.facilityTitle}>פרטי המתקן</h3>
                <div className={styles.inputGroup}>
                  <FaBuilding className={styles.inputIcon} />
                  <input 
                    type='text' 
                    placeholder='שם המתקן' 
                    required 
                    dir='rtl' 
                    className={styles.input} 
                    value={facilityName} 
                    onChange={e => setFacilityName(e.target.value)} 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <FaMapMarkerAlt className={styles.inputIcon} />
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
    </div>
  );
}