// src/components/social/FollowersList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFollow } from '../../hooks/useFollow'; // שימוש בהוק במקום בשירות
import { Link } from 'react-router-dom';
import FollowButton from './FollowButton';
import {
  FaUserFriends,
  FaSpinner,
  FaSearch,
  FaUser,
  FaExclamationTriangle,
} from 'react-icons/fa';
import styles from './styles/FollowersList.module.css';

/**
 * רכיב להצגת רשימת עוקבים או נעקבים
 *
 * @param {Object} props
 * @param {string} props.userId - מזהה המשתמש שעבורו מציגים את הרשימה
 * @param {string} props.listType - סוג הרשימה: 'followers' או 'following'
 * @param {number} props.initialLimit - מספר פריטים לטעינה ראשונית
 * @param {boolean} props.showSearch - האם להציג חיפוש
 * @param {boolean} props.showHeader - האם להציג כותרת
 */
function FollowersList({
  userId,
  listType = "followers",
  initialLimit = 10,
  showSearch = true,
  showHeader = true,
}) {
  const { userProfile } = useAuth();
  const { getFollowers, getFollowing } = useFollow(); // שימוש בהוק
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // פונקציה לטעינת המשתמשים
  const loadUsers = useCallback(async (newOffset = 0, limit = initialLimit) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      let result;

      if (listType === "followers") {
        // טעינת עוקבים
        result = await getFollowers(userId, limit, newOffset);
      } else {
        // טעינת נעקבים
        result = await getFollowing(userId, limit, newOffset);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      // בטעינה ראשונה או לאחר ריענון, החלף את הרשימה הקיימת
      if (newOffset === 0) {
        setUsers(result.data);
        setFilteredUsers(result.data);
      } else {
        // אחרת, הוסף לרשימה הקיימת
        const newUsers = [...users, ...result.data];
        setUsers(newUsers);

        // עדכון רשימת המסוננים על פי חיפוש נוכחי
        if (searchQuery.trim()) {
          filterUsersBySearch(newUsers, searchQuery);
        } else {
          setFilteredUsers(newUsers);
        }
      }

      setTotalCount(result.count);
      setOffset(newOffset + limit);
      setHasMore(
        result.data.length === limit && newOffset + limit < result.count
      );
    } catch (err) {
      console.error(
        `שגיאה בטעינת ${listType === "followers" ? "עוקבים" : "נעקבים"}:`,
        err
      );
      setError(
        err.message ||
          `שגיאה בטעינת ${listType === "followers" ? "עוקבים" : "נעקבים"}`
      );
    } finally {
      setLoading(false);
    }
  }, [userId, listType, initialLimit, users, searchQuery, getFollowers, getFollowing]);

  // פונקציה לסינון משתמשים לפי מחרוזת חיפוש
  const filterUsersBySearch = (usersToFilter, query) => {
    if (!query.trim()) {
      setFilteredUsers(usersToFilter);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = usersToFilter.filter(
      (user) =>
        user.name?.toLowerCase().includes(lowerQuery) ||
        user.city?.toLowerCase().includes(lowerQuery)
    );

    setFilteredUsers(filtered);
  };

  // טעינה ראשונית
  useEffect(() => {
    if (userId) {
      loadUsers(0);
    }
  }, [userId, listType, loadUsers]);

  // פונקציה לחיפוש
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterUsersBySearch(users, query);
  };

  // פונקציה לטעינת משתמשים נוספים (infinite scroll)
  const loadMore = () => {
    if (!loading && hasMore) {
      loadUsers(offset);
    }
  };

  // טיפול בעדכון סטטוס עקיבה
  const handleFollowChange = (userId, isFollowing) => {
    // עדכון סטטוס העקיבה ברשימה המקומית
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, isFollowing } : user
      )
    );

    setFilteredUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, isFollowing } : user
      )
    );
  };

  return (
    <div className={styles.container}>
      {showHeader && (
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <FaUserFriends className={styles.titleIcon} />
            <h3 className={styles.title}>
              {listType === "followers" ? "עוקבים" : "נעקבים"}
              {totalCount > 0 && (
                <span className={styles.count}>({totalCount})</span>
              )}
            </h3>
          </div>

          {showSearch && (
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder={`חיפוש ${
                  listType === "followers" ? "עוקבים" : "נעקבים"
                }...`}
                className={styles.searchInput}
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className={styles.loading}>
          <FaSpinner className={styles.spinner} />
          <p>טוען {listType === "followers" ? "עוקבים" : "נעקבים"}...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className={styles.empty}>
          {searchQuery.trim() ? (
            <>
              <p>לא נמצאו תוצאות לחיפוש "{searchQuery}"</p>
              <button
                className={styles.clearSearch}
                onClick={() => {
                  setSearchQuery("");
                  setFilteredUsers(users);
                }}
              >
                נקה חיפוש
              </button>
            </>
          ) : (
            <p>
              {listType === "followers"
                ? "אין עוקבים להצגה"
                : "המשתמש אינו עוקב אחרי אף אחד"}
            </p>
          )}
        </div>
      ) : (
        <>
          <ul className={styles.userList}>
            {filteredUsers.map((user) => (
              <li key={user.id} className={styles.userItem}>
                <Link to={`/profile/${user.id}`} className={styles.userLink}>
                  <div className={styles.userAvatar}>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || "משתמש"}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        <FaUser />
                      </div>
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <h4 className={styles.userName}>{user.name || "משתמש"}</h4>
                    {user.city && (
                      <p className={styles.userCity}>{user.city}</p>
                    )}
                    {user.fitness_level && (
                      <p className={styles.fitnessLevel}>
                        {user.fitness_level === "beginner"
                          ? "מתחיל"
                          : user.fitness_level === "intermediate"
                          ? "בינוני"
                          : "מתקדם"}
                      </p>
                    )}
                  </div>
                </Link>

                {userProfile?.user_id !== user.id && (
                  <div className={styles.followButtonContainer}>
                    <FollowButton
                      targetUserId={user.id}
                      size="sm"
                      onFollowChange={(isFollowing) =>
                        handleFollowChange(user.id, isFollowing)
                      }
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <button
                className={styles.loadMoreButton}
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className={styles.spinner} />
                    <span>טוען...</span>
                  </>
                ) : (
                  <span>טען עוד</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FollowersList;