import React, { useMemo, useState, useEffect } from 'react';
import { FaTrophy, FaMedal, FaUser, FaChevronDown, FaChevronUp, FaCrown, FaSearch, FaFireAlt } from 'react-icons/fa';
import styles from './styles/LeaderboardSection.module.css';

/**
 * רכיב לוח מובילים משודרג - מציג את דירוג המשתמשים באתגר
 * @param {Array} participants - מערך של משתתפים עם פרטיהם
 * @param {String} userId - מזהה המשתמש הנוכחי
 * @param {String} metric - יחידת המדידה של האתגר
 * @param {Boolean} isCollapsible - האם הרכיב ניתן לכיווץ
 * @param {Number} initialVisibleCount - מספר השורות שיוצגו בתחילה
 */
function LeaderboardSection({ 
  participants = [], 
  userId, 
  metric = '', 
  isCollapsible = false,
  initialVisibleCount = 10
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [highlightedUser, setHighlightedUser] = useState(null);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasNewRanking, setHasNewRanking] = useState(false);
  
  // לוח המובילים ממויין
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => b.value - a.value);
  }, [participants]);
  
  // המיקום של המשתמש הנוכחי
  const userRank = useMemo(() => {
    return sortedParticipants.findIndex(p => p.user_id === userId) + 1;
  }, [sortedParticipants, userId]);
  
  // סימולציה של שינוי בדירוג - מציג אנימציה כאשר המיקום של המשתמש משתנה
  useEffect(() => {
    if (userRank > 0) {
      setHasNewRanking(true);
      const timer = setTimeout(() => {
        setHasNewRanking(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userRank]);
  
  // סינון משתתפים לפי שם
  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return sortedParticipants;
    
    const searchLower = searchTerm.toLowerCase();
    return sortedParticipants.filter(p => 
      p.name.toLowerCase().includes(searchLower)
    );
  }, [sortedParticipants, searchTerm]);
  
  // המשתתפים שיוצגו בטבלה
  const displayParticipants = useMemo(() => {
    if (showAllParticipants || searchTerm) return filteredParticipants;
    return filteredParticipants.slice(0, initialVisibleCount);
  }, [filteredParticipants, showAllParticipants, initialVisibleCount, searchTerm]);
  
  // עיצוב ערך המטריקה בפורמט קריא
  const formatMetric = (value, metric) => {
    const formatted = value.toLocaleString('he-IL');
    switch (metric) {
      case 'km': return `${formatted} ק"מ`;
      case 'minutes': return `${formatted} דקות`;
      case 'workouts': return `${formatted} אימונים`;
      case 'steps': return `${formatted} צעדים`;
      case 'calories': return `${formatted} קלוריות`;
      default: return `${formatted} ${metric}`;
    }
  };
  
  // קבלת צבע מדליה לפי דירוג
  const getMedalColor = (rank) => {
    return ['#ffd700', '#c0c0c0', '#cd7f32'][rank - 1] || '#a0a0a0';
  };
  
  // קבלת אייקון המדליה לפי דירוג
  const getRankIcon = (rank) => {
    if (rank === 1) return <FaCrown className={styles.crownIcon} style={{ color: getMedalColor(rank) }} title="מקום ראשון" />;
    if (rank <= 3) return <FaMedal style={{ color: getMedalColor(rank) }} title={`מקום ${rank}`} />;
    return <span className={styles.rankNumber}>{rank}</span>;
  };
  
  // השפעת המעבר מעל שורה
  const handleRowMouseEnter = (participantId) => {
    setHighlightedUser(participantId);
  };
  
  // סיום השפעת המעבר מעל שורה
  const handleRowMouseLeave = () => {
    setHighlightedUser(null);
  };
  
  // טיפול בשינוי חיפוש
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowAllParticipants(true);
  };
  
  // האם זהו המשתמש הנוכחי
  const isCurrentUser = (participantId) => {
    return participantId === userId;
  };
  
  if (participants.length === 0) {
    return (
      <div className={styles.emptyLeaderboard}>
        <FaTrophy className={styles.emptyIcon} />
        <p>אין משתתפים בלוח המובילים עדיין</p>
      </div>
    );
  }

  return (
    <div className={styles.leaderboardContainer}>
      {isCollapsible && (
        <div
          className={styles.leaderboardHeader}
          onClick={() => setIsCollapsed(!isCollapsed)}
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
        >
          <h3>
            <FaTrophy className={styles.headerIcon} />
            לוח מובילים
          </h3>
          <button className={styles.collapseButton} aria-label={isCollapsed ? "הרחב" : "כווץ"}>
            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
          </button>
        </div>
      )}

      {!isCollapsed && (
        <>
          {participants.length > 10 && (
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="חיפוש משתתפים..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="חיפוש משתתפים"
              />
            </div>
          )}
          
          <div className={styles.leaderboardTable}>
            <div className={styles.leaderboardHead}>
              <div className={styles.rankColumn}>מקום</div>
              <div className={styles.nameColumn}>שם</div>
              <div className={styles.valueColumn}>התקדמות</div>
            </div>

            <div className={styles.leaderboardBody}>
              {displayParticipants.map((p, i) => {
                // קבל את הדירוג האמיתי (במקרה של חיפוש)
                const actualRank = sortedParticipants.findIndex(sp => sp.user_id === p.user_id) + 1;
                
                return (
                  <div
                    key={p.user_id}
                    className={`${styles.leaderboardRow} 
                      ${isCurrentUser(p.user_id) ? styles.currentUserRow : ''} 
                      ${actualRank <= 3 ? styles.topThreeRow : ''}
                      ${highlightedUser === p.user_id ? styles.highlightedRow : ''}
                      ${isCurrentUser(p.user_id) && hasNewRanking ? styles.newRankingAnimation : ''}
                    `}
                    onMouseEnter={() => handleRowMouseEnter(p.user_id)}
                    onMouseLeave={handleRowMouseLeave}
                  >
                    <div className={styles.rankColumn}>
                      {getRankIcon(actualRank)}
                      {isCurrentUser(p.user_id) && actualRank <= 10 && (
                        <FaFireAlt className={styles.userRankIcon} />
                      )}
                    </div>

                    <div className={styles.nameColumn}>
                      <div className={styles.userAvatar}>
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={`אווטאר של ${p.name}`}
                            className={styles.avatarImage}
                          />
                        ) : (
                          <div className={styles.defaultAvatarContainer}>
                            <FaUser className={styles.defaultAvatar} title="משתמש" />
                          </div>
                        )}
                      </div>
                      <span className={styles.userName}>
                        {p.name}
                        {isCurrentUser(p.user_id) && <span className={styles.youBadge}>אתה</span>}
                      </span>
                    </div>

                    <div className={styles.valueColumn}>
                      <span className={styles.valueText}>
                        {formatMetric(p.value, metric)}
                      </span>
                      {actualRank <= 3 && (
                        <div 
                          className={`${styles.rankBadge} ${styles['rank' + actualRank]}`}
                          style={{ backgroundColor: getMedalColor(actualRank) }}
                        >
                          מקום {actualRank}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {userId && userRank > initialVisibleCount && !showAllParticipants && !searchTerm && (
            <div className={styles.currentUserSection}>
              <div className={styles.currentUserDivider}>
                <span>...</span>
              </div>
              <div className={`${styles.leaderboardRow} ${styles.currentUserRow} ${hasNewRanking ? styles.newRankingAnimation : ''}`}>
                <div className={styles.rankColumn}>
                  {getRankIcon(userRank)}
                </div>
                <div className={styles.nameColumn}>
                  <div className={styles.userAvatar}>
                    {sortedParticipants.find(p => p.user_id === userId)?.avatar_url ? (
                      <img
                        src={sortedParticipants.find(p => p.user_id === userId).avatar_url}
                        alt="האווטאר שלך"
                        className={styles.avatarImage}
                      />
                    ) : (
                      <div className={styles.defaultAvatarContainer}>
                        <FaUser className={styles.defaultAvatar} />
                      </div>
                    )}
                  </div>
                  <span className={styles.userName}>
                    {sortedParticipants.find(p => p.user_id === userId)?.name || 'אתה'}
                    <span className={styles.youBadge}>אתה</span>
                  </span>
                </div>
                <div className={styles.valueColumn}>
                  <span className={styles.valueText}>
                    {formatMetric(
                      sortedParticipants.find(p => p.user_id === userId)?.value || 0,
                      metric
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.leaderboardFooter}>
            <div className={styles.participantsCount}>
              {participants.length} משתתפים באתגר
            </div>
            
            {participants.length > initialVisibleCount && !searchTerm && (
              <button 
                className={styles.showMoreButton}
                onClick={() => setShowAllParticipants(!showAllParticipants)}
                aria-expanded={showAllParticipants}
              >
                {showAllParticipants ? 'הצג פחות' : `הצג את כל ${participants.length} המשתתפים`}
                {showAllParticipants ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default LeaderboardSection;