// src/hooks/useAuth.js
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

// מטמון מקומי למניעת שאילתות מיותרות
const userProfileCache = {};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user) => {
    if (!user) {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      setUser(user);
      
      // בדיקה אם הפרופיל כבר במטמון
      if (userProfileCache[user.id] && Date.now() - userProfileCache[user.id].timestamp < 300000) { // תוקף של 5 דקות
        console.log("✅ משתמש נטען מהמטמון");
        setUserProfile(userProfileCache[user.id].data);
        setLoading(false);
        return;
      }
      
      // אם לא במטמון, טען מהשרת
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        // הוספת שדה נוח לבדיקת אישור
        const isApproved = data.approval_status === 'approved' || data.role === 'user' || data.role === 'admin';
        
        const profileWithApprovalStatus = {
          ...data,
          isApproved
        };
        
        // שמירה במטמון
        userProfileCache[user.id] = { 
          data: profileWithApprovalStatus, 
          timestamp: Date.now() 
        };
        
        setUserProfile(profileWithApprovalStatus);
      } else {
        console.warn('⚠️ שגיאה בפרופיל:', error?.message);
        setUserProfile(null);
      }
    } catch (err) {
      console.error('❌ שגיאה כללית:', err.message);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // פונקציה לעדכון פרופיל משתמש
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        throw new Error("לא ניתן לעדכן פרופיל: משתמש לא מחובר");
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select();
      
      if (error) {
        throw error;
      }
      
      // עדכון המטמון והמצב המקומי
      if (data && data.length > 0) {
        // עדכון שדה isApproved
        const isApproved = data[0].approval_status === 'approved' || data[0].role === 'user' || data[0].role === 'admin';
        
        const updatedProfile = {
          ...data[0],
          isApproved
        };
        
        // עדכון המטמון
        userProfileCache[user.id] = {
          data: updatedProfile,
          timestamp: Date.now()
        };
        
        setUserProfile(updatedProfile);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('שגיאה בעדכון פרופיל:', error.message);
      return { data: null, error };
    }
  };

  // פונקציה לניקוי מטמון משתמש מסוים
  const clearUserCache = (userId) => {
    if (userId && userProfileCache[userId]) {
      delete userProfileCache[userId];
    }
  };

  // פונקציה לניקוי כל המטמון
  const clearCache = () => {
    Object.keys(userProfileCache).forEach(key => {
      delete userProfileCache[key];
    });
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserProfile(session?.user || null);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { 
    user, 
    userProfile, 
    loading,
    updateProfile,
    clearUserCache,
    clearCache
  };
};