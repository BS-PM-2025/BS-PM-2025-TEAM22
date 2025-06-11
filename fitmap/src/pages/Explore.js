import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import ProfileCard from "../components/social/ProfileCard";
import FeedPost from "../components/social/FeedPost";
import { useAuth } from "../hooks/useAuth";
import styles from "./Explore.module.css";
import { 
  FaSearch, 
  FaArrowRight, 
  FaSpinner, 
  FaExclamationTriangle,
  FaUserFriends,
  FaFire
} from "react-icons/fa";

function Explore() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, postsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, avatar_url, city, fitness_level, followers_count")
          .order("followers_count", { ascending: false })
          .limit(10),
        supabase
          .from("posts")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (postsRes.error) throw postsRes.error;

      const filteredUsers = usersRes.data?.filter(
        (u) => u.id !== userProfile?.id
      ) || [];

      setUsers(filteredUsers);
      setPosts(postsRes.data || []);
    } catch (err) {
      console.error("שגיאה בטעינת נתוני גילוי:", err);
      setError("שגיאה בטעינת הנתונים. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      loadInitialData();
      return;
    }

    setSearchLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, city, fitness_level, followers_count")
        .ilike("name", `%${query}%`);

      if (error) throw error;

      const filteredUsers = data?.filter(
        (u) => u.id !== userProfile?.id
      ) || [];

      setUsers(filteredUsers);
    } catch (err) {
      console.error("שגיאה בחיפוש:", err);
      setError("שגיאה בחיפוש. אנא נסה שוב.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>גלה משתמשים ופוסטים</h2>
          <p className={styles.subtitle}>מצא אנשים חדשים וגלה תוכן מעניין</p>
        </div>
        <button 
          className={styles.backButton} 
          onClick={() => navigate(-1)}
          aria-label="חזור"
        >
          <FaArrowRight />
          חזור
        </button>
      </div>

      <form className={styles.searchBox} onSubmit={handleSearch}>
        <div className={styles.searchInputWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="חפש משתמש לפי שם..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
        </div>
        <button 
          type="submit" 
          className={styles.searchButton}
          disabled={searchLoading}
        >
          {searchLoading ? (
            <>
              <FaSpinner className={styles.spinner} />
              מחפש...
            </>
          ) : (
            <>
              <FaSearch />
              חפש
            </>
          )}
        </button>
      </form>

      {error && (
        <div className={styles.errorAlert}>
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.loadingSpinner} />
          <p>טוען תוכן...</p>
        </div>
      ) : (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <FaUserFriends className={styles.sectionIcon} />
                משתמשים
              </h3>
              {users.length > 0 && (
                <span className={styles.resultCount}>
                  {users.length} תוצאות
                </span>
              )}
            </div>
            {users.length === 0 ? (
              <div className={styles.noResults}>
                <p>לא נמצאו משתמשים תואמים</p>
                {query && (
                  <button 
                    className={styles.clearSearch}
                    onClick={() => {
                      setQuery("");
                      loadInitialData();
                    }}
                  >
                    נקה חיפוש
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.usersGrid}>
                {users.map((user) => (
                  <ProfileCard
                    key={user.id}
                    user={user}
                    showFollowButton={true}
                    onClick={() => navigate(`/profile/${user.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                <FaFire className={styles.sectionIcon} />
                פוסטים פופולריים
              </h3>
              {posts.length > 0 && (
                <span className={styles.resultCount}>
                  {posts.length} פוסטים
                </span>
              )}
            </div>
            {posts.length === 0 ? (
              <div className={styles.noResults}>
                <p>אין פוסטים זמינים כרגע</p>
              </div>
            ) : (
              <div className={styles.postsContainer}>
                {posts.map((post) => (
                  <FeedPost key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Explore;