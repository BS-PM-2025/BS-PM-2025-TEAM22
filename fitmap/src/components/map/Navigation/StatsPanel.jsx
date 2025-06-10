// src/components/map/Navigation/StatsPanel.jsx - Enhanced version
import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  FaChartLine, FaStar, FaRunning, FaMapMarkedAlt, FaFire, 
  FaGem, FaCoins, FaCalendarCheck, FaTrophy, FaCrown,
  FaMedal, FaBullseye, FaInfoCircle, FaChevronDown, FaChevronUp,
  FaHeartbeat} from 'react-icons/fa';
import Tooltip from './common/Tooltip';
import styles from './styles/StatsPanel.module.css';

/**
 * Enhanced statistics panel component with expandable sections,
 * improved visualizations, and comprehensive player statistics
 * 
 * @param {Object} props - props of the component
 * @returns {JSX.Element} - rendered component
 */
function StatsPanel({ playerState, playerLevelInfo, compact = false }) {
  // UI state - expanded sections
  const [expandedSections, setExpandedSections] = useState({
    level: true,
    achievements: false,
    activity: false,
    rewards: false,
    fitness: false
  });
  
  // Track sort order for data that requires sorting
  const [sortOrder] = useState({
    by: 'date', // 'date', 'value'
    direction: 'desc' // 'asc', 'desc'
  });

  // Toggle UI sections
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);
  
  // Helper for K/M/B display of large numbers
  const formatNumber = useCallback((num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }, []);
  
  // Calculate additional statistics
  const additionalStats = useMemo(() => {
    // Assume 330 calories per km on average
    const estimatedCalories = Math.round((playerState.totalDistance || 0) * 0.330);
    
    // Additional stats for advanced calculations
    return {
      estimatedCalories,
      daysActive: Object.keys(playerState.visitedAreas || {}).length,
      starsPerDay: playerState.totalStarsCollected 
        ? Math.round((playerState.totalStarsCollected / Math.max(1, playerState.daysActive || 1)) * 10) / 10
        : 0,
      bestDay: playerState.bestDay || 'אין מידע',
    };
  }, [playerState]);

  // Render achievement list with sorting
  const renderAchievements = useCallback(() => {
    // If no achievements to display
    if (!playerState.achievements || playerState.achievements.length === 0) {
      return (
        <div className={styles.emptyState}>
          עדיין אין הישגים. המשך לשחק כדי לקבל!
        </div>
      );
    }
    
    // Sort copy of the achievements list
    const sortedAchievements = [...(playerState.achievements || [])].sort((a, b) => {
      // Sort by date or value
      if (sortOrder.by === 'date') {
        const dateA = a.unlocked_at ? new Date(a.unlocked_at) : new Date(0);
        const dateB = b.unlocked_at ? new Date(b.unlocked_at) : new Date(0);
        return sortOrder.direction === 'desc' ? dateB - dateA : dateA - dateB;
      }
      
      // Sort by value/points
      return sortOrder.direction === 'desc' 
        ? (b.xp_reward || 0) - (a.xp_reward || 0)
        : (a.xp_reward || 0) - (b.xp_reward || 0);
    });
    
    // Render the achievements list
    return (
      <div className={styles.achievementsList}>
        {sortedAchievements.slice(0, 3).map((achievement, index) => (
          <div key={index} className={styles.achievementItem}>
            <div className={styles.achievementIcon}>
              {achievement.icon || <FaTrophy />}
            </div>
            <div className={styles.achievementContent}>
              <div className={styles.achievementTitle}>{achievement.title}</div>
              <div className={styles.achievementDesc}>{achievement.description}</div>
              <div className={styles.achievementDate}>
                {achievement.unlocked_at 
                  ? new Date(achievement.unlocked_at).toLocaleDateString() 
                  : 'עדיין לא הושג'}
              </div>
            </div>
            <div className={styles.achievementReward}>
              <FaStar /> {achievement.xp_reward || 100}
            </div>
          </div>
        ))}
        {playerState.achievements.length > 3 && (
          <div className={styles.viewMoreLink}>
            <span>צפה בכל {playerState.achievements.length} ההישגים</span>
          </div>
        )}
      </div>
    );
  }, [playerState.achievements, sortOrder]);

  // Render recent activity
  const renderActivity = useCallback(() => {
    if (!playerState.recentActivity || playerState.recentActivity.length === 0) {
      return (
        <div className={styles.emptyState}>
          עדיין אין פעילות. התחל לשחק כדי לראות את הפעילות האחרונה שלך!
        </div>
      );
    }

    return (
      <div className={styles.activityList}>
        {playerState.recentActivity.map((activity, index) => (
          <div key={index} className={styles.activityItem}>
            <div className={styles.activityIcon}>
              {activity.type === 'route' ? <FaMapMarkedAlt /> : 
                activity.type === 'star' ? <FaStar /> : 
                activity.type === 'achievement' ? <FaTrophy /> : <FaRunning />}
            </div>
            <div className={styles.activityContent}>
              <div className={styles.activityTitle}>{activity.title}</div>
              <div className={styles.activityTime}>
                {activity.time ? new Date(activity.time).toLocaleString() : 'לא ידוע'}
              </div>
            </div>
            {activity.reward && (
              <div className={styles.activityReward}>
                <FaStar /> +{activity.reward}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }, [playerState.recentActivity]);

  // Render daily challenge
  const renderDailyChallenge = useCallback(() => {
    if (!playerState.dailyChallenge) return null;

    return (
      <div className={styles.dailyChallenge}>
        <div className={styles.dailyChallengeHeader}>
          <FaFire /> אתגר יומי
        </div>
        <div className={styles.dailyChallengeContent}>
          <div className={styles.dailyChallengeTitle}>
            {playerState.dailyChallenge.title}
          </div>
          <div className={styles.dailyChallengeProgress}>
            <div className={styles.dailyChallengeProgressBar}>
              <div 
                className={styles.dailyChallengeProgressFill}
                style={{ width: `${(playerState.dailyChallenge.progress / playerState.dailyChallenge.target) * 100}%` }}
              />
            </div>
            <div className={styles.dailyChallengeProgressText}>
              {playerState.dailyChallenge.progress}/{playerState.dailyChallenge.target}
            </div>
          </div>
          <div className={styles.dailyChallengeReward}>
            <FaCoins /> {playerState.dailyChallenge.coinReward}
            <span className={styles.xpReward}><FaStar /> {playerState.dailyChallenge.xpReward}</span>
          </div>
        </div>
      </div>
    );
  }, [playerState.dailyChallenge]);

  // Main component render
  return (
    <div className={`${styles.statsPanel} ${compact ? styles.compactMode : ''}`}>
      {/* Header */}
      <div className={styles.statsPanelHeader}>
        <h4 className={styles.statsPanelTitle}>
          <FaChartLine /> סטטיסטיקות שחקן
          <span className={styles.statsSummary}>
            {playerState.level && <span className={styles.levelBadge}>{playerState.level}</span>}
          </span>
        </h4>
      </div>

      {/* Level info - always expanded */}
      <div className={styles.sectionContainer}>
        <div 
          className={styles.sectionHeader}
          onClick={() => toggleSection('level')}
        >
          <h5 className={styles.sectionTitle}>
            <FaCrown /> רמה ונקודות ניסיון
          </h5>
          <button className={styles.expandButton}>
            {expandedSections.level ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.level && (
          <div className={styles.playerLevelInfo}>
            <div className={styles.levelHeader}>
              <div className={styles.levelTitle}>
                <span className={styles.levelIndicator}>רמה {playerLevelInfo.level}</span>
                <Tooltip text="רמה גבוהה יותר מאפשרת יכולות ואזורים חדשים">
                  <FaInfoCircle className={styles.infoIcon} />
                </Tooltip>
              </div>
              <div className={styles.xpValue}>
                {formatNumber(playerState.xp)} XP
              </div>
            </div>
            
            <div className={styles.levelProgressContainer}>
              <div className={styles.levelProgressBar}>
                <div
                  className={styles.levelProgressFill}
                  style={{ width: `${playerLevelInfo.progressPercent}%` }}
                />
                {/* Milestone indicators */}
                <div className={styles.progressMilestones}>
                  <div className={styles.milestone} style={{ left: '25%' }} />
                  <div className={styles.milestone} style={{ left: '50%' }} />
                  <div className={styles.milestone} style={{ left: '75%' }} />
                </div>
              </div>
              <div className={styles.levelProgressInfo}>
                <span>
                  {formatNumber(playerLevelInfo.currentLevelXp)} / {formatNumber(playerLevelInfo.nextLevelRequirement)} XP
                </span>
                <span className={styles.progressPercent}>{playerLevelInfo.progressPercent}%</span>
              </div>
            </div>
            
            <div className={styles.nextLevelInfo}>
              <div className={styles.nextLevelNeeded}>
                {formatNumber(playerLevelInfo.nextLevelRequirement - playerLevelInfo.currentLevelXp)} XP לרמה הבאה
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick stats grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>כוכבים שנאספו</div>
          <div className={styles.statValue}>
            <FaStar className={styles.statValueIcon} /> {formatNumber(playerState.totalStarsCollected || 0)}
          </div>
        </div>

        <div className={styles.statBlock}>
          <div className={styles.statLabel}>מרחק שהלכת</div>
          <div className={styles.statValue}>
            <FaRunning className={styles.statValueIcon} /> {((playerState.totalDistance || 0) / 1000).toFixed(1)}ק"מ
          </div>
        </div>

        <div className={styles.statBlock}>
          <div className={styles.statLabel}>קומבו שיא</div>
          <div className={styles.statValue}>
            <FaFire className={styles.statValueIcon} /> x{playerState.maxCombo || 0}
          </div>
        </div>

        <div className={styles.statBlock}>
          <div className={styles.statLabel}>אזורים שביקרת</div>
          <div className={styles.statValue}>
            <FaMapMarkedAlt className={styles.statValueIcon} /> 
            {Object.keys(playerState.visitedAreas || {}).length}
          </div>
        </div>

        <div className={styles.statBlock}>
          <div className={styles.statLabel}>רצף יומי</div>
          <Tooltip text="מספר הימים הרצופים שאתה משחק">
            <div className={styles.statValue}>
              <FaFire className={styles.statValueIcon} /> {playerState.consecutiveLoginDays || 0} ימים
            </div>
          </Tooltip>
        </div>

        <div className={styles.statBlock}>
          <div className={styles.statLabel}>מטבעות</div>
          <div className={styles.statValue}>
            <FaCoins className={styles.statValueIcon} /> {formatNumber(playerState.coins || 0)}
          </div>
        </div>

        <div className={styles.statBlock}>
          <div className={styles.statLabel}>אבני חן</div>
          <div className={styles.statValue}>
            <FaGem className={styles.statValueIcon} /> {playerState.gems || 0}
          </div>
        </div>
        
        <div className={styles.statBlock}>
          <div className={styles.statLabel}>קלוריות</div>
          <Tooltip text="הערכה מבוססת על המרחק שהלכת">
            <div className={styles.statValue}>
              <FaFire className={styles.statValueIcon} /> {formatNumber(additionalStats.estimatedCalories || 0)}
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Recent achievements section */}
      <div className={styles.sectionContainer}>
        <div 
          className={styles.sectionHeader}
          onClick={() => toggleSection('achievements')}
        >
          <h5 className={styles.sectionTitle}>
            <FaTrophy /> הישגים אחרונים
          </h5>
          <div className={styles.sectionActions}>
            <div className={styles.achievementStats}>
              <span>{(playerState.unlockedAchievements || 0)}/{(playerState.totalAchievements || 0)}</span>
            </div>
            <button className={styles.expandButton}>
              {expandedSections.achievements ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>
        
        {expandedSections.achievements && renderAchievements()}
      </div>

      {/* Recent activity section */}
      <div className={styles.sectionContainer}>
        <div 
          className={styles.sectionHeader}
          onClick={() => toggleSection('activity')}
        >
          <h5 className={styles.sectionTitle}>
            <FaCalendarCheck /> פעילות אחרונה
          </h5>
          <button className={styles.expandButton}>
            {expandedSections.activity ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.activity && renderActivity()}
      </div>

      {/* Special abilities section */}
      <div className={styles.sectionContainer}>
        <div 
          className={styles.sectionHeader}
          onClick={() => toggleSection('rewards')}
        >
          <h5 className={styles.sectionTitle}>
            <FaMedal /> יכולות מיוחדות
          </h5>
          <button className={styles.expandButton}>
            {expandedSections.rewards ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.rewards && (
          <div className={styles.perksSection}>
            {playerState.perks && playerState.perks.length > 0 ? (
              <div className={styles.perksList}>
                {playerState.perks.map((perk, idx) => (
                  <div key={idx} className={styles.perkItem}>
                    <div className={styles.perkIcon}>
                      {perk.icon ? perk.icon : <FaBullseye />}
                    </div>
                    <div className={styles.perkDetails}>
                      <div className={styles.perkName}>{perk.name}</div>
                      <div className={styles.perkDescription}>{perk.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                עדיין אין יכולות מיוחדות. עלה רמה כדי לקבל יכולות חדשות!
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Fitness section */}
      <div className={styles.sectionContainer}>
        <div 
          className={styles.sectionHeader}
          onClick={() => toggleSection('fitness')}
        >
          <h5 className={styles.sectionTitle}>
            <FaHeartbeat /> בריאות וכושר
          </h5>
          <button className={styles.expandButton}>
            {expandedSections.fitness ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        
        {expandedSections.fitness && (
          <div className={styles.fitnessSection}>
            <div className={styles.fitnessStats}>
              <div className={styles.fitnessStat}>
                <div className={styles.fitnessLabel}>מרחק ממוצע ליום</div>
                <div className={styles.fitnessValue}>
                  {additionalStats.daysActive ? ((playerState.totalDistance || 0) / additionalStats.daysActive / 1000).toFixed(2) : 0} ק"מ
                </div>
              </div>
              
              <div className={styles.fitnessStat}>
                <div className={styles.fitnessLabel}>קלוריות לק"מ</div>
                <div className={styles.fitnessValue}>
                  {(playerState.totalDistance || 0) > 0 ? Math.round(additionalStats.estimatedCalories / ((playerState.totalDistance || 0) / 1000)) : 0}
                </div>
              </div>
              
              <div className={styles.fitnessStat}>
                <div className={styles.fitnessLabel}>ימי פעילות</div>
                <div className={styles.fitnessValue}>
                  {additionalStats.daysActive || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Daily challenge */}
      {renderDailyChallenge()}
    </div>
  );
}

StatsPanel.propTypes = {
  playerState: PropTypes.object.isRequired,
  playerLevelInfo: PropTypes.object.isRequired,
  compact: PropTypes.bool
};

StatsPanel.defaultProps = {
  playerState: {
    level: 1,
    xp: 0,
    coins: 0,
    gems: 0,
    totalStarsCollected: 0,
    totalDistance: 0,
    maxCombo: 0,
    visitedAreas: {},
    consecutiveLoginDays: 0,
    perks: []
  },
  playerLevelInfo: {
    level: 1,
    currentLevelXp: 0,
    nextLevelRequirement: 1000,
    progressPercent: 0
  },
  compact: false
};

export default StatsPanel;