import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaCoins,
  FaStar,
  FaRunning,
  FaRoute,
  FaMapMarkedAlt,
  FaFilter,
  FaCalendarAlt,
  FaGem,
  FaFire,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaShieldAlt,
  FaTrophy,
  FaDumbbell,
} from "react-icons/fa";
import styles from "./styles/QuestPanel.module.css";

/**
 * פאנל משימות משופר - מציג משימות לפי סטטוס, סוג ודרגת קושי עם מיון
 */
const QuestPanel = ({ quests = [], onQuestClick, onQuestClaim }) => {
  // מצבי סינון
  const [activeFilter, setActiveFilter] = useState("active");
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");
  const [activeDifficultyFilter, setActiveDifficultyFilter] = useState("all");
  const [expandedQuestId, setExpandedQuestId] = useState(null);

  // מצב מיון
  const [sortConfig, setSortConfig] = useState({
    key: "expires_at", // מיון ברירת מחדל לפי תאריך תפוגה
    direction: "asc", // בסדר עולה (הקרובים ביותר קודם)
  });

  // בדיקת תוקף
  const isExpired = (quest) => {
    if (!quest.expires_at) return false;
    return new Date(quest.expires_at) < new Date();
  };

  // פורמט זמן נותר
  const formatTimeRemaining = (expiryDate) => {
    if (!expiryDate) return "ללא הגבלה";

    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - now;

    if (diffMs <= 0) return "פג תוקף";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours < 1) {
      return `${diffMinutes} דקות`;
    } else if (diffHours < 24) {
      return `${diffHours}:${diffMinutes.toString().padStart(2, "0")} שעות`;
    } else {
      const days = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return `${days} ימים ${
        remainingHours > 0 ? `, ${remainingHours} שעות` : ""
      }`;
    }
  };

  // חישוב התקדמות משימה
  const calculateProgress = (quest) => {
    if (!quest?.progress || !quest?.objective_value) return 0;
    return Math.min(
      100,
      Math.floor((quest.progress / quest.objective_value) * 100)
    );
  };

  // אייקון סוג משימה
  const getQuestTypeIcon = (type) => {
    switch (type) {
      case "steps":
        return <FaRunning />;
      case "distance":
        return <FaRoute />;
      case "stars":
        return <FaStar />;
      case "gold_stars":
        return <FaStar style={{ color: "#FFD700" }} />;
      case "zones":
        return <FaMapMarkedAlt />;
      case "combo":
        return <FaFire />;
      case "streak":
        return <FaCalendarAlt />;
      case "achievement":
        return <FaTrophy />;
      default:
        return <FaRunning />;
    }
  };

  // אייקון רמת קושי
  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return <FaShieldAlt style={{ color: "#4CAF50" }} />;
      case "medium":
        return <FaDumbbell style={{ color: "#FFC107" }} />;
      case "hard":
        return <FaFire style={{ color: "#F44336" }} />;
      default:
        return <FaShieldAlt style={{ color: "#4CAF50" }} />;
    }
  };

  // שם תצוגה לסוג משימה
  const getQuestTypeName = (type) => {
    const typeNames = {
      steps: "צעדים",
      distance: "מרחק",
      stars: "כוכבים",
      gold_stars: "כוכבי זהב",
      zones: "אזורים",
      combo: "קומבו",
      streak: "רצף",
      achievement: "הישג",
      daily: "יומי",
      weekly: "שבועי",
    };
    return typeNames[type] || type;
  };

  // שם תצוגה לרמת קושי
  const getDifficultyName = (difficulty) => {
    const difficultyNames = {
      easy: "קל",
      medium: "בינוני",
      hard: "קשה",
    };
    return difficultyNames[difficulty] || "קל";
  };

  // מיון משימות
  const sortedQuests = useMemo(() => {
    const filtered = [...quests].filter((quest) => {
      const expired = isExpired(quest);
      const completed = quest.completed;

      // סינון לפי סטטוס
      if (activeFilter === "active" && (completed || expired)) return false;
      if (activeFilter === "completed" && !completed) return false;
      if (activeFilter === "expired" && (!expired || completed)) return false;

      // סינון לפי סוג
      if (activeTypeFilter !== "all" && quest.type !== activeTypeFilter)
        return false;

      // סינון לפי רמת קושי
      if (
        activeDifficultyFilter !== "all" &&
        quest.difficulty !== activeDifficultyFilter
      )
        return false;

      return true;
    });

    // פונקציית השוואה למיון
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.key) {
        case "title":
          comparison = a.title.localeCompare(b.title, "he");
          break;
        case "progress":
          const progressA = calculateProgress(a);
          const progressB = calculateProgress(b);
          comparison = progressA - progressB;
          break;
        case "expires_at":
          // מיון לפי זמן פקיעה: "ללא הגבלה" בסוף
          if (!a.expires_at && !b.expires_at) comparison = 0;
          else if (!a.expires_at) comparison = 1;
          else if (!b.expires_at) comparison = -1;
          else comparison = new Date(a.expires_at) - new Date(b.expires_at);
          break;
        case "reward":
          const totalRewardA =
            (a.rewards?.coins || 0) + (a.rewards?.xp || 0) * 0.5;
          const totalRewardB =
            (b.rewards?.coins || 0) + (b.rewards?.xp || 0) * 0.5;
          comparison = totalRewardA - totalRewardB;
          break;
        case "difficulty":
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          comparison =
            difficultyOrder[a.difficulty || "easy"] -
            difficultyOrder[b.difficulty || "easy"];
          break;
        default:
          comparison = 0;
      }

      // התאמת כיוון המיון
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [
    quests,
    activeFilter,
    activeTypeFilter,
    activeDifficultyFilter,
    sortConfig,
  ]);

  // מיון על ידי לחיצה על כותרת
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // קבלת סוגי המשימות הייחודיים הקיימים במערכת
  const uniqueQuestTypes = useMemo(() => {
    return [...new Set(quests.map((q) => q.type))];
  }, [quests]);

  // קבלת רמות הקושי הייחודיות הקיימות במערכת
  const uniqueDifficulties = useMemo(() => {
    return [...new Set(quests.map((q) => q.difficulty || "easy"))];
  }, [quests]);

  // טיפול בלחיצה על משימה - הרחבה/סגירה
  const handleQuestClick = (quest) => {
    setExpandedQuestId((prev) => (prev === quest.id ? null : quest.id));
    if (onQuestClick) onQuestClick(quest);
  };

  // טיפול בלחיצה על כפתור קבלת תגמול
  const handleClaimReward = (event, quest) => {
    event.stopPropagation();
    if (onQuestClaim) onQuestClaim(quest);
  };

  // אנימציה לסרגל התקדמות
  const getProgressBarStyle = (progress) => {
    return {
      width: `${progress}%`,
      animation: progress > 0 ? "progress-animation 1s ease-out" : "none",
    };
  };

  // משימות מקובצות לפי קטגוריה (יומיות, שבועיות, רגילות)
  const groupedQuests = useMemo(() => {
    const grouped = {
      daily: [],
      weekly: [],
      other: [],
    };

    sortedQuests.forEach((quest) => {
      if (quest.frequency === "daily") {
        grouped.daily.push(quest);
      } else if (quest.frequency === "weekly") {
        grouped.weekly.push(quest);
      } else {
        grouped.other.push(quest);
      }
    });

    return grouped;
  }, [sortedQuests]);

  // חישוב אחוז השלמה כולל
  const overallCompletionStats = useMemo(() => {
    if (quests.length === 0) return { percent: 0, completed: 0, total: 0 };

    const completed = quests.filter((q) => q.completed).length;
    const percent = Math.round((completed / quests.length) * 100);

    return { percent, completed, total: quests.length };
  }, [quests]);

  // רנדור פאנל אחוזי השלמה
  const renderCompletionStats = () => (
    <div className={styles.completionStats}>
      <div className={styles.completionBar}>
        <div
          className={styles.completionFill}
          style={{ width: `${overallCompletionStats.percent}%` }}
        ></div>
      </div>
      <div className={styles.completionText}>
        <span>
          {overallCompletionStats.completed}/{overallCompletionStats.total}{" "}
          הושלמו
        </span>
        <span className={styles.completionPercent}>
          {overallCompletionStats.percent}%
        </span>
      </div>
    </div>
  );

  // רנדור סמן מיון (חץ מעלה/מטה)
  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) return <FaSort className={styles.sortIcon} />;
    return sortConfig.direction === "asc" ? (
      <FaSortUp className={styles.sortIcon} />
    ) : (
      <FaSortDown className={styles.sortIcon} />
    );
  };

  // רנדור כותרות מיון
  const renderSortHeaders = () => (
    <div className={styles.sortHeaders}>
      <div className={styles.sortHeader} onClick={() => requestSort("title")}>
        משימה {renderSortIndicator("title")}
      </div>
      <div
        className={styles.sortHeader}
        onClick={() => requestSort("progress")}
      >
        התקדמות {renderSortIndicator("progress")}
      </div>
      <div
        className={styles.sortHeader}
        onClick={() => requestSort("expires_at")}
      >
        זמן נותר {renderSortIndicator("expires_at")}
      </div>
      <div className={styles.sortHeader} onClick={() => requestSort("reward")}>
        תגמול {renderSortIndicator("reward")}
      </div>
      <div
        className={styles.sortHeader}
        onClick={() => requestSort("difficulty")}
      >
        קושי {renderSortIndicator("difficulty")}
      </div>
    </div>
  );

  // רנדור רשימת משימות מסוננת
  const renderQuestList = () => {
    // בדיקה האם יש משימות להצגה
    if (sortedQuests.length === 0) {
      return <div className={styles.emptyMessage}>אין משימות מתאימות</div>;
    }

    // רנדור משימות לפי קבוצות
    return (
      <>
        {/* משימות יומיות */}
        {groupedQuests.daily.length > 0 && (
          <div className={styles.questGroup}>
            <div className={styles.questGroupHeader}>
              <FaCalendarAlt /> משימות יומיות ({groupedQuests.daily.length})
            </div>
            {groupedQuests.daily.map(renderQuestItem)}
          </div>
        )}

        {/* משימות שבועיות */}
        {groupedQuests.weekly.length > 0 && (
          <div className={styles.questGroup}>
            <div className={styles.questGroupHeader}>
              <FaCalendarAlt /> משימות שבועיות ({groupedQuests.weekly.length})
            </div>
            {groupedQuests.weekly.map(renderQuestItem)}
          </div>
        )}

        {/* משימות אחרות */}
        {groupedQuests.other.length > 0 && (
          <div className={styles.questGroup}>
            {groupedQuests.daily.length > 0 ||
            groupedQuests.weekly.length > 0 ? (
              <div className={styles.questGroupHeader}>
                <FaTrophy /> משימות נוספות ({groupedQuests.other.length})
              </div>
            ) : null}
            {groupedQuests.other.map(renderQuestItem)}
          </div>
        )}
      </>
    );
  };

  // רנדור פריט משימה בודד
  const renderQuestItem = (quest) => {
    const expired = isExpired(quest);
    const progress = calculateProgress(quest);
    const isExpanded = expandedQuestId === quest.id;

    return (
      <div
        key={quest.id}
        className={`${styles.questItem} ${
          quest.completed ? styles.completed : ""
        } ${expired ? styles.expired : ""} ${
          isExpanded ? styles.expanded : ""
        } ${quest.highlighted ? styles.highlighted : ""}`}
        onClick={() => handleQuestClick(quest)}
      >
        <div className={styles.questSummary}>
          <div className={styles.questTypeIcon}>
            {getQuestTypeIcon(quest.type)}
          </div>
          <div className={styles.questContent}>
            <div className={styles.questHeader}>
              <div className={styles.questTitle}>
                {quest.title}
                {quest.difficulty && (
                  <span
                    className={styles.difficultyIndicator}
                    title={`רמת קושי: ${getDifficultyName(quest.difficulty)}`}
                  >
                    {getDifficultyIcon(quest.difficulty)}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.questDescription}>{quest.description}</div>
            <div className={styles.questProgress}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={getProgressBarStyle(progress)}
                />
              </div>
              <div className={styles.progressText}>
                {quest.progress}/{quest.objective_value}{" "}
                {/* הוספת יחידת המדידה */}
                {quest.unit && (
                  <span className={styles.unitText}> {quest.unit}</span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.questStatus}>
            {quest.completed ? (
              <FaCheckCircle className={styles.completedIcon} />
            ) : expired ? (
              <FaHourglassHalf className={styles.expiredIcon} />
            ) : (
              <div className={styles.timeRemaining}>
                <FaCalendarAlt className={styles.calendarIcon} />
                <span>{formatTimeRemaining(quest.expires_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* פרטים מורחבים */}
        {isExpanded && (
          <div className={styles.questDetails}>
            {quest.rewards && (
              <div className={styles.questRewards}>
                <div className={styles.rewardTitle}>תגמולים:</div>
                <div className={styles.rewardItems}>
                  {quest.rewards.xp > 0 && (
                    <div className={styles.rewardItem}>
                      <FaStar /> {quest.rewards.xp} XP
                    </div>
                  )}
                  {quest.rewards.coins > 0 && (
                    <div className={styles.rewardItem}>
                      <FaCoins /> {quest.rewards.coins}
                    </div>
                  )}
                  {quest.rewards.gems > 0 && (
                    <div className={styles.rewardItem}>
                      <FaGem /> {quest.rewards.gems}
                    </div>
                  )}
                </div>
              </div>
            )}

            {quest.completed && !quest.rewardClaimed && (
              <button
                className={styles.claimButton}
                onClick={(e) => handleClaimReward(e, quest)}
              >
                קבל תגמול
              </button>
            )}

            {quest.tips && (
              <div className={styles.questTips}>
                <div className={styles.tipsTitle}>טיפ:</div>
                <div className={styles.tipsContent}>{quest.tips}</div>
              </div>
            )}

            {quest.related_quests && quest.related_quests.length > 0 && (
              <div className={styles.relatedQuests}>
                <div className={styles.relatedTitle}>משימות קשורות:</div>
                <div className={styles.relatedList}>
                  {quest.related_quests.map((relatedId) => {
                    const relatedQuest = quests.find((q) => q.id === relatedId);
                    return relatedQuest ? (
                      <div key={relatedId} className={styles.relatedQuest}>
                        {getQuestTypeIcon(relatedQuest.type)}{" "}
                        {relatedQuest.title}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.questPanel}>
      {/* סטטיסטיקת השלמה כללית */}
      {quests.length > 0 && renderCompletionStats()}

      {/* פילטרים עליונים */}
      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          {["active", "completed", "expired", "all"].map((filter) => (
            <div
              key={filter}
              className={`${styles.filterButton} ${
                activeFilter === filter ? styles.activeFilter : ""
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {
                {
                  active: "פעילות",
                  completed: "הושלמו",
                  expired: "פג תוקף",
                  all: "הכל",
                }[filter]
              }
            </div>
          ))}
        </div>

        {/* פילטר לפי סוג משימה */}
        <div className={styles.typeFilters}>
          <div className={styles.typeFilterTitle}>
            <FaFilter /> <span>סוג:</span>
          </div>
          <div className={styles.typeFilterButtons}>
            <div
              className={`${styles.typeFilterButton} ${
                activeTypeFilter === "all" ? styles.activeFilter : ""
              }`}
              onClick={() => setActiveTypeFilter("all")}
            >
              הכל
            </div>
            {uniqueQuestTypes.map((type) => (
              <div
                key={type}
                className={`${styles.typeFilterButton} ${
                  activeTypeFilter === type ? styles.activeFilter : ""
                }`}
                onClick={() => setActiveTypeFilter(type)}
                title={getQuestTypeName(type)}
              >
                {getQuestTypeIcon(type)}
              </div>
            ))}
          </div>
        </div>

        {/* פילטר לפי רמת קושי - חדש */}
        <div className={styles.difficultyFilters}>
          <div className={styles.typeFilterTitle}>
            <FaDumbbell /> <span>קושי:</span>
          </div>
          <div className={styles.typeFilterButtons}>
            <div
              className={`${styles.typeFilterButton} ${
                activeDifficultyFilter === "all" ? styles.activeFilter : ""
              }`}
              onClick={() => setActiveDifficultyFilter("all")}
            >
              הכל
            </div>
            {uniqueDifficulties.map((difficulty) => (
              <div
                key={difficulty}
                className={`${styles.typeFilterButton} ${
                  activeDifficultyFilter === difficulty
                    ? styles.activeFilter
                    : ""
                }`}
                onClick={() => setActiveDifficultyFilter(difficulty)}
                title={getDifficultyName(difficulty)}
              >
                {getDifficultyIcon(difficulty)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* כותרות מיון */}
      {sortedQuests.length > 0 && renderSortHeaders()}

      {/* רשימת משימות */}
      <div className={styles.questList}>{renderQuestList()}</div>
    </div>
  );
};

QuestPanel.propTypes = {
  quests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string,
      description: PropTypes.string,
      type: PropTypes.string,
      frequency: PropTypes.string,
      progress: PropTypes.number,
      objective_value: PropTypes.number,
      unit: PropTypes.string,
      completed: PropTypes.bool,
      expires_at: PropTypes.string,
      rewardClaimed: PropTypes.bool,
      difficulty: PropTypes.string,
      highlighted: PropTypes.bool,
      related_quests: PropTypes.array,
      rewards: PropTypes.shape({
        xp: PropTypes.number,
        coins: PropTypes.number,
        gems: PropTypes.number,
      }),
      tips: PropTypes.string,
    })
  ),
  onQuestClick: PropTypes.func,
  onQuestClaim: PropTypes.func,
};

export default QuestPanel;
