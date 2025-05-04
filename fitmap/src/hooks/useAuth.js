// src/hooks/useAuth.js
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

const userProfileCache = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (userObj) => {
    if (!userObj) {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      return null;
    }
    
    try {
      setUser(userObj);
      const cache = userProfileCache[userObj.id];
      if (cache && Date.now() - cache.timestamp < CACHE_EXPIRY) {
        setUserProfile(cache.data);
        setLoading(false);
        return cache.data;
      }
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*", { head: false })
        .eq("user_id", userObj.id)
        .order("created_at", { ascending: false })
        .limit(1);
        
      const profile = data?.[0] || null;
      
      if (error) {
        console.error("שגיאה בטעינת פרופיל:", error);
        setUserProfile(null);
        return null;
      } 
      
      if (profile) {
        // בדיקת אישור מדויקת לפי תפקיד
        const isApproved = profile.approval_status === "approved" || 
                          profile.role === "admin";
        const enriched = { ...profile, isApproved };
        userProfileCache[userObj.id] = { data: enriched, timestamp: Date.now() };
        setUserProfile(enriched);
        return enriched;
      }
      
      setUserProfile(null);
      return null;
    } catch (err) {
      console.error("שגיאה כללית ב-fetchUserProfile:", err);
      setUserProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
            scope: "openid email profile",
          },
        },
      });
      
      if (error) {
        console.error("שגיאה ב-OAuth login:", error.message);
        throw error;
      }
    } catch (err) {
      console.error("שגיאה ב-OAuth login:", err);
    } finally {
      setLoading(false);
    }
  };

  const createProfileIfMissing = useCallback(async (userObj) => {
    if (!userObj?.id) {
      console.warn("ניסיון ליצירת פרופיל ללא משתמש תקף");
      return null;
    }
    
    try {
      const { data: arr, error: selectError } = await supabase
        .from("profiles")
        .select("*", { head: false })
        .eq("user_id", userObj.id)
        .limit(1);

      if (selectError) {
        console.error("שגיאה בשליפת פרופיל:", selectError);
        throw selectError;
      }

      let profile = arr?.[0] || null;

      if (!profile) {
        // שימוש בנתוני המשתמש כדי לקבוע את התפקיד והסטטוס
        const userRole = userObj.user_metadata?.role || "user";
        const isManager = userRole === "facility_manager";
        
        const newProfile = {
          user_id: userObj.id,
          email: userObj.email,
          name: userObj.user_metadata?.name || "",
          avatar_url: userObj.user_metadata?.picture || null,
          phone: userObj.user_metadata?.phone || "",
          id_number: userObj.user_metadata?.id_number || "",
          fitness_level: userObj.user_metadata?.fitness_level || "beginner",
          preferred_workouts: userObj.user_metadata?.preferred_workouts || "{}",
          role: userRole, // שימוש בתפקיד שנשמר במטא-דאטה
          approval_status: isManager ? "pending" : "approved", // מנהלי מתקן צריכים אישור
          approved_at: isManager ? null : new Date().toISOString(),
          // הוספת נתונים נוספים של מנהלי מתקן אם קיימים
          ...(isManager && userObj.user_metadata?.facility_name && {
            facility_name: userObj.user_metadata.facility_name
          }),
          ...(isManager && userObj.user_metadata?.facility_address && {
            facility_address: userObj.user_metadata.facility_address
          })
        };

        console.log("יוצר פרופיל חדש עם תפקיד:", userRole);
        console.log("האם מנהל מתקן?", isManager);
        console.log("סטטוס אישור שנקבע:", newProfile.approval_status);

        const { data: insertData, error: insertErr } = await supabase
          .from("profiles")
          .insert([{ ...newProfile }])
          .select("*");

        if (insertErr) {
          console.error("שגיאה בהכנסת פרופיל חדש:", insertErr);
          throw insertErr;
        }

        profile = insertData?.[0] || newProfile;
        console.log("פרופיל שנוצר:", profile);
      }

      return profile;
    } catch (err) {
      console.error("שגיאה כללית ב-createProfileIfMissing:", err);
      throw err;
    }
  }, []);

  const handleOAuthRedirect = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) {
        throw sessErr;
      }
      
      const userObj = session?.user;
      if (!userObj) {
        setLoading(false);
        return;
      }

      const profile = await createProfileIfMissing(userObj);
      await fetchUserProfile(userObj);

      if (!profile) {
        console.error("לא נמצא פרופיל אחרי יצירה/טעינה");
        setLoading(false);
        return;
      }

      const { role } = profile;
      const status = profile.approval_status;
      
      console.log("ניתוב המשתמש לפי תפקיד:", role);
      console.log("סטטוס אישור:", status);
      
      if (role === "facility_manager" && status !== "approved") {
        console.log("מנתב מנהל מתקן לדף המתנה לאישור");
        navigate("/pending-approval");
      } else if (role === "admin") {
        console.log("מנתב מנהל מערכת ללוח הבקרה");
        navigate("/admin/dashboard");
      } else if (role === "facility_manager") {
        console.log("מנתב מנהל מתקן מאושר ללוח הבקרה");
        navigate("/facility/dashboard");
      } else {
        console.log("מנתב משתמש רגיל למפת הכושר");
        navigate("/fitness-map");
      }
    } catch (err) {
      console.error("שגיאה ב-handleOAuthRedirect:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate, createProfileIfMissing, fetchUserProfile]);

  const updateProfile = async (updates) => {
    if (!user?.id) {
      console.error("ניסיון לעדכן פרופיל ללא משתמש מחובר");
      return { data: null, error: new Error("משתמש לא מחובר") };
    }
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select("*");

      if (error) {
        console.error("שגיאה בעדכון פרופיל:", error);
        throw error;
      }

      // עדכון הפרופיל במצב (state)
      await fetchUserProfile({ id: user.id });
      return { data, error: null };
    } catch (err) {
      console.error("שגיאה כללית ב-updateProfile:", err);
      return { data: null, error: err };
    }
  };

  const clearUserCache = (userId) => {
    if (userId && userProfileCache[userId]) {
      delete userProfileCache[userId];
      return true;
    }
    return false;
  };
  
  const clearCache = () => {
    Object.keys(userProfileCache).forEach((k) => delete userProfileCache[k]);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await createProfileIfMissing(session.user);
          await fetchUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("שגיאה באתחול משתמש:", err);
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("אירוע מצב אימות:", event);
      if (session?.user) {
        createProfileIfMissing(session.user).then(() => fetchUserProfile(session.user));
      } else {
        fetchUserProfile(null);
      }
    });

    return () => {
      if (listener?.subscription?.unsubscribe) {
        listener.subscription.unsubscribe();
      }
    };
  }, [createProfileIfMissing, fetchUserProfile]);

  return {
    user,
    userProfile,
    loading,
    updateProfile,
    clearUserCache,
    clearCache,
    handleOAuthLogin,
    handleOAuthRedirect,
  };
};