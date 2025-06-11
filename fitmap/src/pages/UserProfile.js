// src/pages/UserProfile.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import FollowButton from "../components/social/FollowButton";
import FeedPost from "../components/social/FeedPost";
import ProfileCard from "../components/social/ProfileCard";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import FollowersList from "../components/social/FollowersList";
import UserProgressBar from "../components/challenges/UserProgressBar";

import styles from "./UserProfile.module.css";

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [userData, setUserData] = useState({
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
    workoutHistory: [],
    challenges: [],
    achievements: [],
    loading: true,
  });

  useEffect(() => {
    if (userId) {
      checkAndLoadProfile();
      loadPosts();
      loadUserData();
    }
  }, [userId]);

  const checkAndLoadProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("שגיאה בטעינת פרופיל:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          user:user_id!inner(id, name, avatar_url),
          post_likes!left(count),
          post_comments!left(count)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error) setPosts(data || []);
    } catch (error) {
      console.error("שגיאה בטעינת פוסטים:", error);
    }
  };

  const loadUserData = async () => {
    setUserData((prev) => ({ ...prev, loading: true }));
    try {
      const { data: userChallengeProgress, error: challengeProgressError } =
        await supabase
          .from("user_challenge_progress")
          .select("*")
          .eq("user_id", userId);

      let userChallenges = [];

      if (!challengeProgressError && userChallengeProgress?.length > 0) {
        const challengeIds = userChallengeProgress.map((uc) => uc.challenge_id);
        const { data: challenges, error: challengeDetailsError } =
          await supabase.from("challenges").select("*").in("id", challengeIds);

        if (!challengeDetailsError && challenges) {
          userChallenges = challenges.map((challenge) => {
            const userChallenge = userChallengeProgress.find(
              (uc) => uc.challenge_id === challenge.id
            );
            return {
              ...challenge,
              current_value: userChallenge?.current_value || 0,
              progress: Math.min(
                100,
                Math.round(
                  ((userChallenge?.current_value || 0) /
                    challenge.target_value) *
                    100
                )
              ),
            };
          });
        }
      }

      setUserData({
        stats: userData.stats,
        workoutHistory: [],
        challenges: userChallenges || [],
        achievements: [],
        loading: false,
      });
    } catch (error) {
      console.error("שגיאה בטעינת נתוני משתמש:", error);
      setUserData((prev) => ({ ...prev, loading: false }));
    }
  };

  const challenges = userData.challenges || [];

  if (loading) {
    return <LoadingSpinner fullScreen text="טוען פרופיל..." />;
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <h2>פרופיל לא נמצא</h2>
        <p>ייתכן והמשתמש לא קיים או הוגדר כפרטי.</p>
        <button className="btn btn-secondary mt-4" onClick={() => navigate(-1)}>
          ← חזור
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className="btn btn-secondary mb-6" onClick={() => navigate(-1)}>
        ← חזור
      </button>

      <div className={styles.header}>
        <ProfileCard user={profile} showFollowButton={false} />
        {userProfile?.user_id !== userId && (
          <div className={styles.followAction}>
            <FollowButton targetUserId={profile.id} />
          </div>
        )}
      </div>

      <div className={styles.tabs}>
        {["overview", "posts", "followers", "following"].map((tabKey) => (
          <button
            key={tabKey}
            className={`${styles.tab} ${
              activeTab === tabKey ? styles.active : ""
            }`}
            onClick={() => setActiveTab(tabKey)}
          >
            {
              {
                overview: "סקירה",
                posts: "פוסטים",
                followers: "עוקבים",
                following: "נעקבים",
              }[tabKey]
            }
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === "overview" && (
          <div className={styles.overviewSection}>
            {userData.loading ? (
              <div className={styles.loadingData}>
                <div className={styles.loadingSpinner}></div>
                <p>טוען נתונים...</p>
              </div>
            ) : challenges.length > 0 ? (
              <div className={styles.activeChallengesSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>אתגרים פעילים</h2>
                  <button
                    className={styles.viewAllButton}
                    onClick={() => navigate("/challenges")}
                  >
                    הצג הכל
                  </button>
                </div>
                <div className={styles.challengesProgress}>
                  {challenges.map((challenge) => (
                    <div
                      className={styles.challengeProgressItem}
                      key={challenge.id}
                    >
                      <h3 className={styles.challengeTitle}>
                        {challenge.title || challenge.name}
                      </h3>
                      <UserProgressBar
                        currentValue={parseFloat(challenge.current_value) || 0}
                        targetValue={parseFloat(challenge.target_value) || 100}
                        metric={challenge.metric}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>אין אתגרים פעילים להצגה</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className={styles.posts}>
            <h3>פוסטים אחרונים</h3>
            {loading ? (
              <LoadingSpinner />
            ) : posts.length === 0 ? (
              <p>אין פוסטים להצגה</p>
            ) : (
              posts.map((post) => (
                <FeedPost
                  key={post.id}
                  post={post}
                  currentUserId={userProfile?.user_id}
                />
              ))
            )}
          </div>
        )}
        {activeTab === "followers" && (
          <FollowersList
            userId={userId}
            listType="followers"
            initialLimit={12}
            showSearch={true}
            showHeader={false}
          />
        )}

        {activeTab === "following" && (
          <FollowersList
            userId={userId}
            listType="following"
            initialLimit={12}
            showSearch={true}
            showHeader={false}
          />
        )}
      </div>
    </div>
  );
}

export default UserProfile;
