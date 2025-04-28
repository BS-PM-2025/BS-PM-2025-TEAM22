import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import styles from "../../styles/Favorites.module.css";
import {
  FaStar,
  FaRegStar,
  FaMapMarkedAlt,
  FaDirections,
  FaTrashAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

function Favorites() {
  // משתמשים ב- userProfile במקום user כדי להתאים ל-Supabase
  const { userProfile } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userProfile) {
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", userProfile.id)
          .order("created_at", { ascending: false });

        console.log("DATA:", data);
        console.log("👤 USER PROFILE ID:", userProfile.id);

        if (error) {
          throw error;
        }

        console.log("✅ מועדפים נטענו:", data);
        setFavorites(data);
      } catch (err) {
        console.error("❌ שגיאה בטעינת מועדפים:", err);
        setError("אירעה שגיאה בטעינת המועדפים");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userProfile]);

  const handleRemoveFavorite = async (id) => {
    try {
      const { error } = await supabase.from("favorites").delete().eq("id", id);
      if (error) {
        throw error;
      }
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError("אירעה שגיאה בהסרת המתקן");
    }
  };

  const navigateToMap = (favorite) => {
    const url = `/fitness-map?facility=${favorite.google_place_id || favorite.id}&lat=${favorite.latitude}&lng=${favorite.longitude}`;
    window.location.href = url;
  };

  const navigateToDirections = (favorite) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${favorite.latitude},${favorite.longitude}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return <div className={styles.loading}>טוען מועדפים...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>המתקנים המועדפים שלי</h1>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {favorites.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FaStar size={48} /></div>
          <h3>אין לך מתקנים מועדפים</h3>
          <p>הוסף מתקנים למועדפים דרך דף המפה</p>
          <Link to="/fitness-map" className={styles.exploreButton}>
            <FaMapMarkerAlt /> גלה מתקנים
          </Link>
        </div>
      ) : (
        <div className={styles.favoritesList}>
          {favorites.map((favorite) => (
            <div key={favorite.id} className={styles.favoriteCard}>
              <div className={styles.cardContent}>
                <h3 className={styles.facilityName}>
                  {favorite.name}
                  {favorite.source === "google" && (
                    <span className={styles.googleTag}>מגוגל</span>
                  )}
                </h3>
                <p className={styles.facilityAddress}>{favorite.address}</p>
                <div className={styles.facilityType}>סוג: {favorite.type}</div>
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
                  onClick={() => handleRemoveFavorite(favorite.id)}
                >
                  <FaTrashAlt /> הסר
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
