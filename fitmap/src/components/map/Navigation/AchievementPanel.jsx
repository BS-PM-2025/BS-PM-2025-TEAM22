// AchievementPanel.jsx
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaTrophy, FaLock, FaUnlock, FaStar, FaCoins } from 'react-icons/fa';
import styles from './styles/AchievementPanel.module.css';
import { showAchievementAnimation } from './utils/AnimationUtils';

/**
 * Achievement panel component - מתקדם
 */
function AchievementPanel({ achievements, calculateProgress, onAchievementClick }) {
  const groupedAchievements = useMemo(() => {
    const groups = {};
    achievements.forEach(achievement => {
      const category = achievement.category || 'general';
      if (!groups[category]) groups[category] = [];
      groups[category].push(achievement);
    });
    return groups;
  }, [achievements]);

  const hasUnlockedAchievements = useMemo(
    () => achievements.some(a => a.unlocked),
    [achievements]
  );

  return (
    <div className={styles.achievements}>
      <h4>
        <FaTrophy /> הישגים{' '}
        {hasUnlockedAchievements && (
          <span className={styles.unlockedCount}>
            {achievements.filter(a => a.unlocked).length}/{achievements.length}
          </span>
        )}
      </h4>

      {Object.entries(groupedAchievements).map(([category, items]) => (
        <div key={category} className={styles.achievementCategory}>
          {Object.keys(groupedAchievements).length > 1 && (
            <h5 className={styles.categoryTitle}>{getCategoryTitle(category)}</h5>
          )}

          {items.map((achievement) => {
            const progressPercent = calculateProgress(achievement);
            const levelClass = styles[achievement.level === 4 ? 'platinum' :
                                     achievement.level === 3 ? 'gold' :
                                     achievement.level === 2 ? 'silver' : 'bronze'];

            return (
              <div
                key={achievement.id}
                className={`${styles.achievementItem} ${levelClass} ${
                  achievement.unlocked ? styles.achievementUnlocked : ''
                }`}
                onClick={() => {
                  onAchievementClick?.(achievement);
                  if (achievement.unlocked) {
                    showAchievementAnimation(achievement, styles);
                  }
                }}
              >
                <div className={styles.achievementIcon}>{achievement.icon}</div>

                <div className={styles.achievementText}>
                  <div className={styles.achievementTitle}>
                    {achievement.unlocked ? <FaUnlock /> : <FaLock />} {achievement.title}
                  </div>
                  <div className={styles.achievementDescription}>{achievement.description}</div>
                  <div className={styles.achievementProgressWrapper}>
                    <span className={styles.achievementProgressText}>
                      {achievement.progress}/{achievement.target}
                    </span>
                    <div className={styles.achievementProgress}>
                      <div
                        className={styles.achievementProgressBar}
                        style={{ width: `${progressPercent}%` }}
                        data-percent={progressPercent}
                      ></div>
                    </div>
                  </div>
                </div>

                {achievement.unlocked && (
                  <div className={styles.achievementUnlockedBadge}>
                    <FaStar />
                  </div>
                )}

                {(achievement.xp_reward > 0 || achievement.coins_reward > 0) && (
                  <div className={styles.achievementReward}>
                    {achievement.xp_reward > 0 && (
                      <span title="XP תגמול">
                        +{achievement.xp_reward} XP
                      </span>
                    )}
                    {achievement.coins_reward > 0 && (
                      <span title="מטבעות">
                        <FaCoins /> {achievement.coins_reward}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {achievements.length === 0 && (
        <div className={styles.emptyAchievements}>
          אין הישגים זמינים כרגע. המשך לשחק כדי לפתוח הישגים חדשים!
        </div>
      )}
    </div>
  );
}

// מתרגם קטגוריה לשם תצוגה
function getCategoryTitle(category) {
  const titles = {
    general: 'כללי',
    steps: 'צעדים',
    stars: 'כוכבים',
    stars_gold: 'כוכבי זהב',
    distance: 'מרחק',
    streak: 'רצף',
    level: 'רמות',
    zones: 'אזורים',
    routes: 'מסלולים',
    community: 'קהילה',
  };
  return titles[category] || category;
}

AchievementPanel.propTypes = {
  achievements: PropTypes.array.isRequired,
  calculateProgress: PropTypes.func.isRequired,
  onAchievementClick: PropTypes.func,
};

export default AchievementPanel;
