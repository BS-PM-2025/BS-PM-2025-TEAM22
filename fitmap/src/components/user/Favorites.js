import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import styles from "./styles/Favorites.module.css";
import ExerciseCard from "../workouts/ExerciseCard";

import {
  FaStar,
  FaRegStar,
  FaMapMarkedAlt,
  FaDirections,
  FaTrashAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

function Favorites() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [facilityFavorites, setFacilityFavorites] = useState([]);
  const [exerciseFavorites, setExerciseFavorites] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userProfile) {
      fetchFacilityFavorites();
      fetchExerciseFavorites();
    } else {
      setLoadingFacilities(false);
      setLoadingExercises(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const fetchFacilityFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFacilityFavorites(data || []);
    } catch (err) {
      setError("שגיאה בטעינת מתקנים מועדפים");
    } finally {
      setLoadingFacilities(false);
    }
  };

  const fetchExerciseFavorites = async () => {
    try {
      console.log("מביא מועדפים למשתמש:", user?.id);

      if (!user?.id) {
        console.error("אין מזהה משתמש זמין");
        setExerciseFavorites([]);
        setLoadingExercises(false);
        return;
      }

      const { data: favData, error: favError } = await supabase
        .from("exercise_favorites")
        .select("exercise_id")
        .eq("user_id", user.id);

      console.log("מועדפים שנמצאו:", favData);

      if (favError) throw favError;

      if (!favData || favData.length === 0) {
        console.log("אין מועדפים כלל");
        setExerciseFavorites([]);
        setLoadingExercises(false);
        return;
      }

      const favoriteIds = favData.map((item) => item.exercise_id);
      console.log("מזהי תרגילים:", favoriteIds);

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("exercises")
        .select("*")
        .in("id", favoriteIds);

      if (exercisesError) throw exercisesError;

      console.log("תרגילים שמצאתי:", exercisesData);

      // המרה לשדה videoUrl
      const formattedExercises = (exercisesData || []).map((exercise) => ({
        ...exercise,
        videoUrl: exercise.video_url, // יצירת videoUrl אם קיים
      }));

      setExerciseFavorites(formattedExercises);
    } catch (err) {
      console.error("שגיאה בטעינת תרגילים מועדפים:", err.message);
      setError("שגיאה בטעינת תרגילים מועדפים");
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleRemoveFacility = async (id) => {
    try {
      const { error } = await supabase.from("favorites").delete().eq("id", id);
      if (error) throw error;
      setFacilityFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError("שגיאה בהסרת מתקן");
    }
  };

  const handleRemoveExercise = async (id) => {
    try {
      const { error } = await supabase
        .from("exercise_favorites")
        .delete()
        .eq("user_id", userProfile.id)
        .eq("exercise_id", id);
      if (error) throw error;
      setExerciseFavorites((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      setError("שגיאה בהסרת תרגיל");
    }
  };

  const navigateToMap = (favorite) => {
    const url = `/fitness-map?facility=${
      favorite.google_place_id || favorite.id
    }&lat=${favorite.latitude}&lng=${favorite.longitude}`;
    window.location.href = url;
  };

  const navigateToDirections = (favorite) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${favorite.latitude},${favorite.longitude}`;
    window.open(url, "_blank");
  };

  if (loadingFacilities || loadingExercises) {
    return <div className={styles.loading}>טוען מועדפים...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>המועדפים שלי</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* מתקנים מועדפים */}
      <section>
        <h2>🗺️ מתקני כושר</h2>
        {!loadingFacilities && facilityFavorites.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FaMapMarkerAlt size={48} />
            </div>
            <h3>אין מתקנים שמורים</h3>
            <p>הוסף מתקנים דרך דף המפה</p>
            <Link to="/fitness-map" className={styles.exploreButton}>
              <FaMapMarkedAlt /> גלה מתקנים
            </Link>
          </div>
        ) : (
          <div className={styles.favoritesList}>
            {facilityFavorites.map((favorite) => (
              <div key={favorite.id} className={styles.favoriteCard}>
                <div className={styles.cardContent}>
                  <h3 className={styles.facilityName}>
                    {favorite.name}
                    {favorite.source === "google" && (
                      <span className={styles.googleTag}>מגוגל</span>
                    )}
                  </h3>
                  <p className={styles.facilityAddress}>{favorite.address}</p>
                  <div className={styles.facilityType}>
                    סוג: {favorite.type}
                  </div>
                  <div className={styles.ratingContainer}>
                    <div className={styles.stars}>
                      {Array(5)
                        .fill(0)
                        .map((_, i) =>
                          i < Math.round(favorite.rating || 0) ? (
                            <FaStar key={i} className={styles.filledStar} />
                          ) : (
                            <FaRegStar key={i} className={styles.emptyStar} />
                          )
                        )}
                    </div>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => navigateToMap(favorite)}
                  >
                    <FaMapMarkedAlt /> הצג במפה
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => navigateToDirections(favorite)}
                  >
                    <FaDirections /> ניווט
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.removeButton}`}
                    onClick={() => handleRemoveFacility(favorite.id)}
                  >
                    <FaTrashAlt /> הסר
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* תרגילים מועדפים */}
      <section style={{ marginTop: "4rem" }}>
        <h2>🏋️‍♂️ תרגילים מועדפים</h2>
        <div className={styles.favoritesList}>
          {exerciseFavorites.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => navigate(`/exercises/${exercise.id}`)}
              isFavorite={true}
              onToggleFavorite={() => handleRemoveExercise(exercise.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Favorites;
