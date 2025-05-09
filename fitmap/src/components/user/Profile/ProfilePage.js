import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";
import { useAuth } from "../../../hooks/useAuth";
import ProfileHeader from "./ProfileHeader";
import ProfileTabs from "./ProfileTabs";
import EditProfileModal from "./EditProfileModal";
import TabContent from "./TabContent";

import { FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

import styles from "./Profile.module.css";

function ProfilePage() {
  const { user, userProfile, loading: authLoading,  } = useAuth();
  const navigate = useNavigate();

  // טאבים במסך הפרופיל
  const [activeTab, setActiveTab] = useState("overview");

  // פרטי פרופיל
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    fitnessLevel: "beginner",
    preferredWorkouts: [],
    birthDate: "",
    gender: "",
    idNumber: "",
    city: "",
    avatarUrl: "",
  });

  // עריכת פרופיל
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // נתונים עבור המסך
  const [userData, setUserData] = useState({
    workoutHistory: [],
    achievements: [],
    challenges: [],
    groupWorkouts: [],
    stats: {
      totalWorkouts: 0,
      totalMinutes: 0,
      totalCalories: 0,
      favoriteWorkoutType: "",
      longestStreak: 0,
      currentStreak: 0,
      completedChallenges: 0,
      achievementCount: 0,
    },
    loading: true,
  });

  // רשימת סוגי אימונים
  const workoutTypes = [
    {
      id: "calisthenics",
      label: "כושר גופני (מתח, מקבילים)",
      icon: "running",
    },
    { id: "cardio", label: "אירובי", icon: "heartbeat" },
    { id: "strength", label: "כוח", icon: "dumbbell" },
    { id: "flexibility", label: "גמישות", icon: "running" },
    { id: "seniorFitness", label: "כושר לגיל השלישי", icon: "running" },
  ];

  useEffect(() => {
    // ניקוי הודעת הצלחה אחרי 3 שניות
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate("/auth");
      return;
    }

    if (userProfile) {
      console.log("User profile loaded:", userProfile);

      // עדכון פרטי הפרופיל
      setProfileData({
        name: userProfile.name || "",
        phone: userProfile.phone || "",
        fitnessLevel: userProfile.fitness_level || "beginner",
        preferredWorkouts: userProfile.preferred_workouts || [],
        birthDate: userProfile.birth_date || "",
        gender: userProfile.gender || "",
        idNumber: userProfile.id_number || "",
        city: userProfile.city || "",
        avatarUrl: userProfile.avatar_url || "",
      });

      // טעינת נתונים נוספים
      fetchUserData();
    }
  }, [user, userProfile, authLoading, navigate]);

  // פונקציות עזר
  const isYesterday = (date, referenceDate) => {
    if (!date || !referenceDate) return false;

    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);

    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  };

  const isConsecutiveDay = (earlier, later) => {
    if (!earlier || !later) return false;

    const oneDayLater = new Date(earlier);
    oneDayLater.setDate(oneDayLater.getDate() + 1);

    return (
      oneDayLater.getDate() === later.getDate() &&
      oneDayLater.getMonth() === later.getMonth() &&
      oneDayLater.getFullYear() === later.getFullYear()
    );
  };

  const translateWorkoutType = (type) => {
    const types = {
      strength: "חיזוק",
      cardio: "סיבולת",
      flexibility: "גמישות",
      mixed: "משולב",
    };

    return types[type] || type;
  };

  const formatDateHebrew = (dateStr) => {
    if (!dateStr) {
      return "";
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleDateString("he-IL");
    } catch (error) {
      console.error("שגיאה בפורמט תאריך:", error);
      return "";
    }
  };

  // פונקציה לעיבוד וניקוי נתוני אתגרים
  const processChallengeData = (challenges) => {
    if (!challenges || !Array.isArray(challenges)) {
      console.error("Invalid challenges data:", challenges);
      return [];
    }
    
    console.log("Processing challenges:", challenges);
    
    return challenges.map(challenge => {
      // המרת שדות מספריים
      const currentValue = parseFloat(challenge.current_value) || 0;
      const targetValue = parseFloat(challenge.target_value) || 100;
      
      // חישוב התקדמות
      const progress = targetValue > 0 
        ? Math.min(100, Math.round((currentValue / targetValue) * 100)) 
        : 0;
      
      // הוספת מטריקה אם לא קיימת
      const metric = challenge.metric || getDefaultMetric(challenge);
      
      // יצירת אובייקט נקי
      return {
        ...challenge,
        current_value: currentValue,
        target_value: targetValue,
        progress: progress,
        metric: metric,
        name: challenge.name || challenge.title || "אתגר",
        description: challenge.description || "",
        icon: challenge.icon || "trophy",
        reward_points: Number(challenge.reward_points) || 0
      };
    });
  };
  
  // פונקציית עזר לקביעת מטריקה ברירת מחדל לפי סוג האתגר
  const getDefaultMetric = (challenge) => {
    // ניסיון לנחש את המטריקה לפי שם או תיאור
    const text = (challenge.name || "") + " " + (challenge.description || "");
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes("ריצה") || lowerText.includes("ק\"מ") || lowerText.includes("מרחק")) {
      return "km";
    } else if (lowerText.includes("זמן") || lowerText.includes("דקות") || lowerText.includes("שעות")) {
      return "minutes";
    } else if (lowerText.includes("אימון") || lowerText.includes("פעילות")) {
      return "workouts";
    } else if (lowerText.includes("צעד")) {
      return "steps";
    } else if (lowerText.includes("קלורי")) {
      return "calories";
    }
    
    // ברירת מחדל
    return "workouts";
  };



  // טעינת נתוני משתמש מורחבים
  const fetchUserData = async () => {
    if (!userProfile || !user) {
      console.log("No user profile or user available");
      return;
    }

    console.log("Fetching user data for:", user.id);
    setUserData((prev) => ({ ...prev, loading: true }));
    setError(null);

    try {
      // טעינת היסטוריית אימונים
      console.log("Fetching workout history...");
      const { data: workouts, error: workoutsError } = await supabase
        .from("user_workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: false });

      if (workoutsError) {
        console.error("Error fetching workouts:", workoutsError);
        throw workoutsError;
      }

      console.log(`Found ${workouts?.length || 0} workouts`);

      // טעינת אתגרים המשתמש
      console.log("Fetching user challenges...");
      let activeChallenges = [];
      try {
        // בדיקה אם טבלת האתגרים קיימת (מבלי לקרוא לטבלה שייתכן ואינה קיימת)
        const { error: checkTableError } =
          await supabase
            .from("challenges")
            .select("*", { count: "exact", head: true });

        if (checkTableError) {
          console.error("Error checking challenges table:", checkTableError);
          // נמשיך עם מידע על אתגרים כדוגמה
          console.log("Using sample challenge data for demonstration");
        } else {
          const { data: userChallenges, error: challengesError } =
            await supabase
              .from("user_challenge_progress")
              .select("*")
              .eq("user_id", userProfile.id)

          if (challengesError) {
            console.error("Error fetching user challenges:", challengesError);
            throw challengesError;
          }

          // מערך של מזהי אתגרים שהמשתמש משתתף בהם
          const challengeIds = (userChallenges || []).map(
            (uc) => uc.challenge_id
          );

          if (challengeIds.length > 0) {
            console.log(`Found ${challengeIds.length} challenge IDs for user`);

            // טעינת פרטי האתגרים
            const { data: challenges, error: challengeDetailsError } =
              await supabase
                .from("challenges")
                .select("*")
                .in("id", challengeIds);

            if (challengeDetailsError) {
              console.error(
                "Error fetching challenge details:",
                challengeDetailsError
              );
              throw challengeDetailsError;
            }

            if (challenges && challenges.length > 0) {
              console.log(`Fetched ${challenges.length} challenge details`);

              // שילוב נתונים
              activeChallenges = challenges.map((challenge) => {
                const userChallenge = userChallenges.find(
                  (uc) => uc.challenge_id === challenge.id
                );
                const currentValue = userChallenge
                  ? userChallenge.current_value
                  : 0;
                const targetValue = challenge.target_value || 100; // ערך ברירת מחדל למקרה שחסר

                return {
                  ...challenge,
                  current_value: currentValue,
                  target_value: targetValue, // וידוא שיש ערך יעד
                  progress: Math.min(
                    100,
                    Math.round((currentValue / targetValue) * 100)
                  ),
                  hasJoined: true,
                  icon: challenge.icon || "trophy", // וידוא שיש אייקון כלשהו
                };
              });
            } else {
              console.log("No challenge details found for the provided IDs");
            }
          }

          // אם אין אתגרים פעילים או שלא נמצאו פרטים, ננסה לטעון אתגרים זמינים כללית
          if (activeChallenges.length === 0) {
            console.log(
              "No active challenges found, fetching available challenges"
            );
            const {
              data: availableChallenges,
              error: availableChallengesError,
            } = await supabase.from("challenges").select("*").limit(5); // הגבלה ל-5 אתגרים זמינים

            if (availableChallengesError) {
              console.error(
                "Error fetching available challenges:",
                availableChallengesError
              );
            } else if (availableChallenges && availableChallenges.length > 0) {
              console.log(
                `Found ${availableChallenges.length} available challenges`
              );

              // עיבוד אתגרים זמינים (שהמשתמש עדיין לא הצטרף אליהם)
              activeChallenges = availableChallenges.map((challenge) => ({
                ...challenge,
                current_value: 0,
                progress: 0,
                target_value: challenge.target_value || 100,
                hasJoined: false,
                icon: challenge.icon || "trophy", // וידוא שיש אייקון כלשהו
              }));
            } else {
              console.log("No available challenges found");
            }
          }
        }

        console.log(
          `Processed ${activeChallenges.length} total challenges:`,
          activeChallenges
        );
      } catch (challengeError) {
        console.error("Error processing challenges:", challengeError);
        setError((prev) => prev || "שגיאה בטעינת אתגרים");
      }

      // טעינת הישגים
      console.log("Fetching user achievements...");
      let userAchievements = [];
      try {
        // קבלת רשימת ההישגים של המשתמש
        const { data: userAchievementsData, error: userAchievementsError } =
          await supabase
            .from("user_achievements")
            .select("*, achievement_id")
            .eq("user_id", user.id);

        if (userAchievementsError) {
          console.error(
            "Error fetching user achievements:",
            userAchievementsError
          );
          throw userAchievementsError;
        }

        const userAchievementIds = (userAchievementsData || []).map(
          (ua) => ua.achievement_id
        );
        console.log(`Found ${userAchievementIds.length} achieved achievements`);

        // קבלת רשימת ההישגים הכללית
        const { data: allAchievements, error: achievementsError } =
          await supabase.from("achievements").select("*");

        if (achievementsError) {
          console.error("Error fetching all achievements:", achievementsError);
          throw achievementsError;
        }

        console.log(
          `Found ${allAchievements?.length || 0} total achievements in system`
        );

        // סימון הישגים שהושגו ואלו שעדיין לא הושגו
        if (allAchievements && allAchievements.length > 0) {
          userAchievements = allAchievements.map((achievement) => {
            const userAchievement = userAchievementsData?.find(
              (ua) => ua.achievement_id === achievement.id
            );

            const isAchieved = !!userAchievement;

            return {
              ...achievement,
              earned_date: userAchievement?.earned_date || null,
              is_achieved: isAchieved,
            };
          });

          // לתצוגה בטאב יתכן שנרצה לסנן רק את אלו שכבר הושגו
          const achievedAchievements = userAchievements.filter(
            (a) => a.is_achieved
          );
          console.log(
            `User has achieved ${achievedAchievements.length} out of ${userAchievements.length} achievements`
          );

          // כאן נחליט מה להציג - לדוגמה, נציג את כל ההישגים (גם אלו שטרם הושגו)
          // אם מעוניינים להציג רק את אלו שהושגו, אפשר להשתמש ב-achievedAchievements
          // userAchievements = achievedAchievements; // תלוי בדרישות
        }
      } catch (achievementError) {
        console.error("Error processing achievements:", achievementError);
        setError((prev) => prev || "שגיאה בטעינת הישגים");
      }

      // טעינת אימונים קבוצתיים
      console.log("Fetching group workouts...");
      let userGroupWorkouts = [];
      try {
        const { data: groupParticipations, error: groupError } = await supabase
          .from("group_participants")
          .select("workout_id")
          .eq("user_id", user.id);

        if (groupError) {
          console.error("Error fetching group participants:", groupError);
          throw groupError;
        }

        if (groupParticipations && groupParticipations.length > 0) {
          console.log(
            `Found ${groupParticipations.length} group workout participations`
          );

          // קבלת מזהי אימונים קבוצתיים
          const workoutIds = groupParticipations.map((gp) => gp.workout_id);

          if (workoutIds.length > 0) {
            // טעינת פרטי האימונים הקבוצתיים
            const { data: groupWorkouts, error: groupWorkoutsError } =
              await supabase
                .from("group_workouts")
                .select("*")
                .in("id", workoutIds);

            if (groupWorkoutsError) {
              console.error(
                "Error fetching group workouts:",
                groupWorkoutsError
              );
              throw groupWorkoutsError;
            }

            userGroupWorkouts = groupWorkouts || [];
            console.log(
              `Loaded ${userGroupWorkouts.length} group workout details`
            );
          }
        } else {
          console.log("No group workouts found for user");
        }
      } catch (groupWorkoutError) {
        console.error("Error processing group workouts:", groupWorkoutError);
        setError((prev) => prev || "שגיאה בטעינת אימונים קבוצתיים");
      }

      // חישוב סטטיסטיקות
      console.log("Calculating stats...");
      const stats = calculateStats(
        workouts || [],
        userAchievements,
        activeChallenges
      );

      // בדיקה אם יש לנו אתגרים, אם לא נשתמש בנתוני דוגמה
      if (activeChallenges.length === 0) {
        console.log("No challenges found, using sample data");
        activeChallenges = [
          {
            id: "1",
            name: "אתגר 5 אימונים",
            description: "השלם 5 אימונים",
            target_value: 5,
            current_value: 3,
            progress: 60,
            hasJoined: true,
            icon: "trophy",
            reward_points: 100,
            metric: "workouts"
          },
          {
            id: "2",
            name: 'אתגר 10 ק"מ',
            description: 'רוץ מרחק מצטבר של 10 ק"מ',
            target_value: 10,
            current_value: 4,
            progress: 40,
            hasJoined: true,
            icon: "running",
            reward_points: 200,
            metric: "km"
          },
          {
            id: "3",
            name: "שבוע של כושר",
            description: "התאמן 7 ימים ברציפות",
            target_value: 7,
            current_value: 5,
            progress: 71,
            hasJoined: true,
            icon: "calendar",
            reward_points: 300,
            metric: "workouts"
          },
        ];
      } else {
        // וידוא ערכים נכונים בכל האתגרים
        activeChallenges = activeChallenges.map((challenge) => {
          const currentValue =
            typeof challenge.current_value === "number"
              ? challenge.current_value
              : parseInt(challenge.current_value) || 0;
          const targetValue =
            typeof challenge.target_value === "number"
              ? challenge.target_value
              : parseInt(challenge.target_value) || 100;

          // וידוא שלא מחלקים באפס או מקבלים NaN
          let progress = 0;
          if (targetValue > 0) {
            progress = Math.min(
              100,
              Math.round((currentValue / targetValue) * 100)
            );
            // וידוא שהערך הוא מספר תקין
            if (isNaN(progress)) progress = 0;
          }

          return {
            ...challenge,
            current_value: currentValue,
            target_value: targetValue,
            progress,
            hasJoined: !!challenge.hasJoined,
          };
        });
      }

      // עיבוד האתגרים לפני אחסון ב-state
      activeChallenges = processChallengeData(activeChallenges);
      console.log("Final processed challenges with metrics:", activeChallenges);

      // עדכון state
      setUserData({
        workoutHistory: workouts || [],
        achievements: userAchievements,
        challenges: activeChallenges,
        groupWorkouts: userGroupWorkouts,
        stats,
        loading: false,
      });

      console.log("User data loading complete!");
    } catch (error) {
      console.error("שגיאה בטעינת נתוני משתמש:", error);
      setError("לא ניתן היה לטעון את נתוני המשתמש");
      setUserData((prev) => ({ ...prev, loading: false }));
    }
  };

  // חישוב סטטיסטיקות משתמש
  const calculateStats = (workouts, achievements, challenges) => {
    console.log("Calculating stats from:", {
      workoutsCount: workouts.length,
      achievementsCount: achievements.length,
      challengesCount: challenges.length,
    });

    // סך הכל אימונים
    const totalWorkouts = workouts.length;

    // סך דקות אימון
    const totalMinutes = workouts.reduce(
      (total, workout) => total + (parseInt(workout.duration_minutes) || 0),
      0
    );

    // סך קלוריות משוער (300 קלוריות לשעת אימון בממוצע)
    const totalCalories = Math.round(totalMinutes * (300 / 60));

    // סוג אימון מועדף
    const workoutTypeCount = workouts.reduce((acc, workout) => {
      const type = workout.workout_type || "";
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});

    let favoriteWorkoutType = "";
    let maxCount = 0;

    Object.entries(workoutTypeCount).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteWorkoutType = translateWorkoutType(type);
      }
    });

    // חישוב רצף אימונים
    const { currentStreak, longestStreak } = calculateStreaks(workouts);

    // אתגרים שהושלמו - וידוא שיש שדה target_value
    const completedChallenges = challenges.filter(
      (challenge) =>
        challenge.current_value >= (challenge.target_value || Infinity)
    ).length;

    // מספר הישגים - רק אלו שהושגו
    const achievementCount = achievements.filter((a) => a.is_achieved).length;

    return {
      totalWorkouts,
      totalMinutes,
      totalCalories,
      favoriteWorkoutType,
      currentStreak,
      longestStreak,
      completedChallenges,
      achievementCount,
    };
  };

  // חישוב רצף אימונים
  const calculateStreaks = (workouts) => {
    if (!workouts || !workouts.length) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // מיון לפי תאריך ויצירת מערך של תאריכים תקינים
    const sortedDates = workouts
      .map((w) => (w.workout_date ? new Date(w.workout_date) : null))
      .filter((date) => date instanceof Date && !isNaN(date))
      .sort((a, b) => b - a);

      if (sortedDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
      }
  
      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 1;
  
      // בדיקה אם האימון האחרון היה היום או אתמול
      const today = new Date();
      const lastWorkoutDate = sortedDates[0];
  
      const isRecent =
        lastWorkoutDate &&
        ((lastWorkoutDate.getDate() === today.getDate() &&
          lastWorkoutDate.getMonth() === today.getMonth() &&
          lastWorkoutDate.getFullYear() === today.getFullYear()) ||
          isYesterday(lastWorkoutDate, today));
  
      if (isRecent) {
        currentStreak = 1;
  
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = sortedDates[i - 1];
          const currDate = sortedDates[i];
  
          if (prevDate && currDate && isConsecutiveDay(currDate, prevDate)) {
            streak++;
            currentStreak = streak;
          } else {
            if (streak > longestStreak) {
              longestStreak = streak;
            }
            streak = 1;
            break;
          }
        }
      }
  
      // חישוב רצף ארוך ביותר
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = sortedDates[i - 1];
        const currDate = sortedDates[i];
  
        if (prevDate && currDate && isConsecutiveDay(currDate, prevDate)) {
          streak++;
        } else {
          if (streak > longestStreak) {
            longestStreak = streak;
          }
          streak = 1;
        }
      }
  
      if (streak > longestStreak) {
        longestStreak = streak;
      }
  
      return { currentStreak, longestStreak };
    };
  
    // שינוי בבחירת סוגי אימונים מועדפים
    const handleWorkoutTypeChange = (e) => {
      const { value, checked } = e.target;
      setProfileData((prev) => ({
        ...prev,
        preferredWorkouts: checked
          ? [...prev.preferredWorkouts, value]
          : prev.preferredWorkouts.filter((type) => type !== value),
      }));
    };
  
    // שליחת טופס עדכון פרופיל
    const handleSubmit = async (updatedData) => {
      if (!user) return;
  
      try {
        setSubmitting(true);
        setError(null);
  
        // המרת שדות לפורמט המתאים למסד הנתונים
        const formattedData = {
          name: updatedData.name,
          phone: updatedData.phone,
          fitness_level: updatedData.fitnessLevel,
          preferred_workouts: updatedData.preferredWorkouts,
          birth_date: updatedData.birthDate,
          gender: updatedData.gender,
          id_number: updatedData.idNumber,
          city: updatedData.city,
        };
  
        const { error } = await supabase
          .from("profiles")
          .update(formattedData)
          .eq("user_id", user.id);
  
        if (error) throw error;
  
        setIsEditing(false);
        setProfileData(updatedData);
        setSuccess("הפרופיל עודכן בהצלחה");
      } catch (err) {
        console.error("שגיאה בעדכון הפרופיל:", err);
        setError("אירעה שגיאה בעדכון הפרופיל");
      } finally {
        setSubmitting(false);
      }
    };
  
    // טיפול בשינוי תמונת פרופיל
    const handleProfileImageChange = async (file) => {
      if (!file || !user) return;
  
      try {
        // העלאת התמונה לאחסון
        const fileExt = file.name.split(".").pop();
        const filePath = `profiles/${user.id}/avatar.${fileExt}`;
  
        // העלאה לסופאבייס סטורג'
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });
  
        if (uploadError) throw uploadError;
  
        // קבלת URL ציבורי
        const { data } = await supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
  
        if (!data || !data.publicUrl) {
          throw new Error("לא ניתן היה לקבל את כתובת התמונה");
        }
  
        const newAvatarUrl = data.publicUrl;
  
        // עדכון פרופיל המשתמש
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: newAvatarUrl })
          .eq("user_id", user.id);
  
        if (updateError) throw updateError;
  
        setProfileData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
        setSuccess("תמונת הפרופיל עודכנה בהצלחה");
      } catch (error) {
        console.error("שגיאה בעדכון תמונת פרופיל:", error);
        setError("לא ניתן היה לעדכן את תמונת הפרופיל");
      }
    };
  
 
  
    // טעינה מחדש של מידע המשתמש
    const refreshUserData = () => {
      setUserData((prev) => ({ ...prev, loading: true }));
      setError(null);
      fetchUserData();
    };
  
    if (authLoading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>טוען נתוני פרופיל...</p>
        </div>
      );
    }
  
    if (!user) {
      return (
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <p>יש להתחבר כדי לצפות בפרופיל</p>
            <button
              className={styles.authButton}
              onClick={() => navigate("/auth")}
            >
              התחברות / הרשמה
            </button>
          </div>
        </div>
      );
    }
  
    return (
      <div className={styles.container}>
        {/* כותרת וכרטיס פרופיל */}
        <ProfileHeader
          profileData={profileData}
          user={user}
          userProfile={userProfile}
          onEditProfile={() => setIsEditing(true)}
          onImageChange={handleProfileImageChange}
          formatDateHebrew={formatDateHebrew}
        />
  
        {success && (
          <div className={styles.successMessage}>
            <FaCheckCircle className={styles.successIcon} />
            <p>{success}</p>
          </div>
        )}
  
        {error && (
          <div className={styles.errorMessage}>
            <FaExclamationTriangle className={styles.errorIcon} />
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className={styles.errorCloseButton}
              aria-label="סגור הודעת שגיאה"
            >
              &times;
            </button>
          </div>
        )}
  
        {/* כפתור רענון */}
        <div className={styles.refreshSection}>
          <button
            className={styles.refreshButton}
            onClick={refreshUserData}
            disabled={userData.loading}
          >
            {userData.loading ? "טוען נתונים..." : "רענן נתונים"}
          </button>
        </div>
  
        {/* טאבים */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
  
        {/* עריכת פרופיל - דיאלוג מודאלי */}
        {isEditing && (
          <EditProfileModal
            profileData={profileData}
            user={user}
            submitting={submitting}
            workoutTypes={workoutTypes}
            onWorkoutTypeChange={handleWorkoutTypeChange}
            onSubmit={handleSubmit}
            onCancel={() => setIsEditing(false)}
          />
        )}
  
        {/* תוכן הטאב הנבחר */}
        <TabContent
          activeTab={activeTab}
          userData={userData}
          profileData={profileData}
          user={user}
          formatDateHebrew={formatDateHebrew}
          navigate={navigate}
          refreshUserData={refreshUserData}
        />
      </div>
    );
  }
  
  export default ProfilePage;