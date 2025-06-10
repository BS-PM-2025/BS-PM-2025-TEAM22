// src/components/map/Navigation/GameHUD.jsx - Enhanced version with more features
import React, {
  useState,
  useEffect,
  memo,
  useMemo,
  useCallback,
  useRef,
} from "react";
import PropTypes from "prop-types";
import {
  FaChartLine,
  FaTrophy,
  FaMapMarkedAlt,
  FaCog,
  FaTimes,
  FaCoins,
  FaFire,
  FaTasks,
  FaBell,
  FaGem,
  FaAngleUp,
  FaAngleDown,
  FaSlidersH,
  FaRunning,
  FaStar,
  FaHistory,
  FaInfoCircle,
} from "react-icons/fa";
import styles from "./styles/GameHUD.module.css";
import StatsPanel from "./StatsPanel";
import AchievementPanel from "./AchievementPanel";
import MiniMap from "./MiniMap";
import QuestPanel from "./QuestPanel";
import Tooltip from "./common/Tooltip";
import {
  showAchievementAnimation,
} from "./utils/AnimationUtils";

/**
 * Enhanced GameHUD component - Heads Up Display for the game with multiple panels
 * Displays player information, stats, achievements, quests, and minimap
 *
 * @param {Object} props Component props
 * @returns {JSX.Element} Rendered component
 */
const GameHUD = memo(
  ({
    showStats,
    showQuests,
    showAchievements,
    showMinimap,
    showActivity,
    isLoading,
    error,
    achievements,
    playerState,
    playerLevelInfo,
    starsData,
    quests,
    activities,
    position,
    onSettingsClick,
    onClosePanel,
    onQuestClick,
    onQuestClaim,
    onProfileClick,
    onNotificationClick,
    onAchievementClick,
    gameMode,
  }) => {
    // State for UI animations and interactions
    const [animatingPanel, setAnimatingPanel] = useState(null);
    const [, setActivePanels] = useState({
      stats: showStats,
      achievements: showAchievements,
      minimap: showMinimap,
      quests: showQuests,
      activity: showActivity,
    });
    const [notificationCount, setNotificationCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [panelPositions, setPanelPositions] = useState({});
    const [isCompactMode, setIsCompactMode] = useState(false);
    const [showControlBar, ] = useState(true);
    const [showTooltips, ] = useState(true);
    const [showQuickStats, ] = useState(true);
    const [activeToast, setActiveToast] = useState(null);
    const [toastQueue, setToastQueue] = useState([]);

    // Refs for panel elements to handle drag & drop
    const panelRefs = {
      stats: useRef(null),
      achievements: useRef(null),
      minimap: useRef(null),
      quests: useRef(null),
      activity: useRef(null),
    };

    // Keep track of mounted state for safe async operations
    const isMounted = useRef(true);

    // Clean up mounted flag on unmount
    useEffect(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);

    /**
     * Check if panel should be showing based on props and state
     * @param {string} panelName The panel identifier
     * @returns {boolean} Whether the panel should be visible
     */
    const isPanelVisible = useCallback(
      (panelName) => {
        // First check if explicitly shown in props
        switch (panelName) {
          case "stats":
            return showStats;
          case "achievements":
            return showAchievements;
          case "minimap":
            return showMinimap;
          case "quests":
            return showQuests;
          case "activity":
            return showActivity;
          default:
            return false;
        }
      },
      [showStats, showAchievements, showMinimap, showQuests, showActivity]
    );

    /**
     * Calculate achievement progress percentage
     * @param {Object} achievement Achievement object
     * @returns {number} Progress percentage (0-100)
     */
    const calculateAchievementProgress = useCallback((achievement) => {
      if (
        !achievement ||
        typeof achievement.progress !== "number" ||
        typeof achievement.target !== "number" ||
        achievement.target === 0
      ) {
        return 0;
      }
      return Math.min(
        100,
        Math.max(0, (achievement.progress / achievement.target) * 100)
      );
    }, []);

    /**
     * Filter stars that are within a certain distance of the player
     */
    const activeStars = useMemo(() => {
      if (!starsData || !position) return [];

      return starsData
        .filter((star) => !star.collected)
        .map((star) => {
          const distance = Math.sqrt(
            Math.pow((star.lat - position.lat) * 111000, 2) +
              Math.pow(
                (star.lng - position.lng) *
                  111000 *
                  Math.cos((position.lat * Math.PI) / 180),
                2
              )
          );
          return { ...star, distance };
        })
        .filter((star) => star.distance < 300);
    }, [starsData, position]);

    /**
     * Calculate completed quests that have rewards to claim
     */
    const claimableQuests = useMemo(() => {
      if (!quests) return [];
      return quests.filter((quest) => quest.completed && !quest.rewardClaimed);
    }, [quests]);

    /**
     * Calculate recent achievements unlocked but not shown
     */
    const newAchievements = useMemo(() => {
      if (!achievements) return [];
      return achievements.filter(
        (achievement) => achievement.unlocked && !achievement.notificationShown
      );
    }, [achievements]);

    /**
     * Update notification count based on claimable quests and new achievements
     */
    useEffect(() => {
      const count = claimableQuests.length + newAchievements.length;
      setNotificationCount(count);
    }, [claimableQuests, newAchievements]);

    /**
     * Handle closing a panel with animation
     * @param {string} panelName Panel identifier
     */
    const handleCloseClick = useCallback(
      (panelName) => {
        setAnimatingPanel(panelName);

        // Delay actual closing for animation
        setTimeout(() => {
          if (isMounted.current) {
            onClosePanel?.(panelName);
            setAnimatingPanel(null);
          }
        }, 300);
      },
      [onClosePanel]
    );

    /**
     * Handle achievement click - show animation if unlocked
     * @param {Object} achievement Achievement that was clicked
     */
    const handleAchievementClick = useCallback(
      (achievement) => {
        if (achievement.unlocked) {
          showAchievementAnimation(achievement, styles);
        }

        if (onAchievementClick) {
          onAchievementClick(achievement);
        }
      },
      [onAchievementClick]
    );


    /**
     * Start drag operation for a panel
     * @param {Object} e Mouse event
     * @param {string} panelName Panel identifier
     */
    const handlePanelDragStart = useCallback(
      (e, panelName) => {
        if (isCompactMode) return; // No dragging in compact mode

        setIsDragging(true);
        setDragStartPos({
          x: e.clientX,
          y: e.clientY,
          panel: panelName,
          initialLeft: panelPositions[panelName]?.left || 0,
          initialTop: panelPositions[panelName]?.top || 0,
        });

        // Prevent default behavior
        e.preventDefault();
      },
      [isCompactMode, panelPositions]
    );

    /**
     * Process mouse movement during panel drag
     * @param {Object} e Mouse event
     */
    const handleMouseMove = useCallback(
      (e) => {
        if (!isDragging || !dragStartPos.panel) return;

        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;

        // Update panel position
        setPanelPositions((prev) => ({
          ...prev,
          [dragStartPos.panel]: {
            left: dragStartPos.initialLeft + deltaX,
            top: dragStartPos.initialTop + deltaY,
          },
        }));

        // Prevent text selection during drag
        e.preventDefault();
      },
      [isDragging, dragStartPos]
    );

    /**
     * End dragging operation
     */
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    /**
     * Save panel positions to local storage
     */
    useEffect(() => {
      if (Object.keys(panelPositions).length > 0) {
        try {
          localStorage.setItem(
            "gamePanelPositions",
            JSON.stringify(panelPositions)
          );
        } catch (e) {
          console.warn("Failed to save panel positions:", e);
        }
      }
    }, [panelPositions]);

    /**
     * Load panel positions from local storage
     */
    useEffect(() => {
      try {
        const savedPositions = JSON.parse(
          localStorage.getItem("gamePanelPositions") || "{}"
        );
        setPanelPositions(savedPositions);
      } catch (e) {
        console.warn("Failed to load saved panel positions:", e);
      }
    }, []);

    /**
     * Handle global mouse events for dragging
     */
    useEffect(() => {
      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    /**
     * Process the toast notification queue
     */
    useEffect(() => {
      // Show next toast if not showing one and queue not empty
      if (!activeToast && toastQueue.length > 0) {
        const nextToast = toastQueue[0];
        setActiveToast(nextToast);
        setToastQueue((prev) => prev.slice(1));

        // Set timeout to clear the toast
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, nextToast.duration || 3000);

        return () => clearTimeout(timer);
      }
    }, [activeToast, toastQueue]);

    /**
     * Initialize panel visibility from props
     */
    useEffect(() => {
      setActivePanels({
        stats: showStats,
        achievements: showAchievements,
        minimap: showMinimap,
        quests: showQuests,
        activity: showActivity,
      });

      setAnimatingPanel(null);
    }, [showStats, showAchievements, showMinimap, showQuests, showActivity]);

    /**
     * Render toast notification
     */
    const renderToast = () => {
      if (!activeToast) return null;

      return (
        <div className={`${styles.toast} ${styles.toastShow}`}>
          {activeToast.icon && (
            <div className={styles.toastIcon}>{activeToast.icon}</div>
          )}
          <div className={styles.toastContent}>
            {activeToast.title && (
              <div className={styles.toastTitle}>{activeToast.title}</div>
            )}
            <div className={styles.toastMessage}>{activeToast.message}</div>
          </div>
          <button
            className={styles.toastClose}
            onClick={() => setActiveToast(null)}
          >
            <FaTimes />
          </button>
        </div>
      );
    };

    /**
     * Render player info bar at the top
     */
    const renderPlayerSummary = () => (
      <div className={styles.playerSummary}>
        {/* Player avatar + level */}
        <div className={styles.playerAvatar} onClick={onProfileClick}>
          <div className={styles.playerLevel}>{playerState?.level ?? 1}</div>
        </div>

        {/* Player stats */}
        <div className={styles.playerStats}>
          <Tooltip text="נקודות ניסיון" disabled={!showTooltips}>
            <span className={styles.xpStat}>
              <FaStar className={styles.statIcon} />
              {playerState?.xp ?? 0}
            </span>
          </Tooltip>

          <Tooltip text="מטבעות" disabled={!showTooltips}>
            <span className={styles.coinStat}>
              <FaCoins className={styles.statIcon} />
              {playerState?.coins ?? 0}
            </span>
          </Tooltip>

          <Tooltip text="אבני חן" disabled={!showTooltips}>
            <span className={styles.gemStat}>
              <FaGem className={styles.statIcon} />
              {playerState?.gems ?? 0}
            </span>
          </Tooltip>

          <Tooltip text="רצף כניסות יומי" disabled={!showTooltips}>
            <span className={styles.streakStat}>
              <FaFire className={styles.statIcon} />
              {playerState?.consecutiveLoginDays ?? 0}
            </span>
          </Tooltip>
        </div>

        {/* Notification icon */}
        <div className={styles.notificationArea}>
          <button
            className={styles.notificationButton}
            onClick={onNotificationClick}
            aria-label="התראות"
          >
            <FaBell />
            {notificationCount > 0 && (
              <span className={styles.notificationBadge}>
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    );

    /**
     * Render stats panel
     */
    const renderStatsPanel = () => {
      if (!isPanelVisible("stats")) return null;

      const positionStyle = isCompactMode ? {} : panelPositions.stats || {};

      return (
        <div
          ref={panelRefs.stats}
          className={`${styles.hudPanel} ${styles.statsPanel} ${
            animatingPanel === "stats" ? styles.panelClosing : ""
          } ${isCompactMode ? styles.compactPanel : ""}`}
          style={positionStyle}
          onMouseDown={(e) => handlePanelDragStart(e, "stats")}
        >
          <div className={styles.panelHeader}>
            <h3>
              <FaChartLine /> סטטיסטיקות שחקן
            </h3>
            <div className={styles.panelControls}>
              {onSettingsClick && (
                <button
                  className={styles.settingsButton}
                  onClick={onSettingsClick}
                  title="הגדרות"
                >
                  <FaCog />
                </button>
              )}
              <button
                className={styles.closeButton}
                onClick={() => handleCloseClick("stats")}
                title="סגור"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <StatsPanel
            playerState={playerState}
            playerLevelInfo={playerLevelInfo}
            compact={isCompactMode}
          />
        </div>
      );
    };

    /**
     * Render achievements panel
     */
    const renderAchievementsPanel = () => {
      if (!isPanelVisible("achievements")) return null;

      const positionStyle = isCompactMode
        ? {}
        : panelPositions.achievements || {};

      return (
        <div
          ref={panelRefs.achievements}
          className={`${styles.hudPanel} ${styles.achievementsPanel} ${
            animatingPanel === "achievements" ? styles.panelClosing : ""
          } ${isCompactMode ? styles.compactPanel : ""}`}
          style={positionStyle}
          onMouseDown={(e) => handlePanelDragStart(e, "achievements")}
        >
          <div className={styles.panelHeader}>
            <h3>
              <FaTrophy /> הישגים
            </h3>
            <button
              className={styles.closeButton}
              onClick={() => handleCloseClick("achievements")}
              title="סגור"
            >
              <FaTimes />
            </button>
          </div>

          <AchievementPanel
            achievements={achievements || []}
            calculateProgress={calculateAchievementProgress}
            onAchievementClick={handleAchievementClick}
            compact={isCompactMode}
          />
        </div>
      );
    };

    /**
     * Render quests panel
     */
    const renderQuestsPanel = () => {
      if (!isPanelVisible("quests")) return null;

      const positionStyle = isCompactMode ? {} : panelPositions.quests || {};

      return (
        <div
          ref={panelRefs.quests}
          className={`${styles.hudPanel} ${styles.questsPanel} ${
            animatingPanel === "quests" ? styles.panelClosing : ""
          } ${isCompactMode ? styles.compactPanel : ""}`}
          style={positionStyle}
          onMouseDown={(e) => handlePanelDragStart(e, "quests")}
        >
          <div className={styles.panelHeader}>
            <h3>
              <FaTasks /> משימות
              {claimableQuests.length > 0 && (
                <span className={styles.claimableBadge}>
                  {claimableQuests.length}
                </span>
              )}
            </h3>
            <button
              className={styles.closeButton}
              onClick={() => handleCloseClick("quests")}
              title="סגור"
            >
              <FaTimes />
            </button>
          </div>

          <QuestPanel
            quests={quests || []}
            onQuestClick={onQuestClick}
            onQuestClaim={onQuestClaim}
            compact={isCompactMode}
          />
        </div>
      );
    };

    /**
     * Render minimap panel
     */
    const renderMinimapPanel = () => {
      if (!isPanelVisible("minimap")) return null;

      const positionStyle = isCompactMode ? {} : panelPositions.minimap || {};

      return (
        <div
          ref={panelRefs.minimap}
          className={`${styles.hudPanel} ${styles.minimapPanel} ${
            animatingPanel === "minimap" ? styles.panelClosing : ""
          } ${isCompactMode ? styles.compactPanel : ""}`}
          style={positionStyle}
          onMouseDown={(e) => handlePanelDragStart(e, "minimap")}
        >
          <div className={styles.panelHeader}>
            <h3>
              <FaMapMarkedAlt /> מפה מוקטנת
            </h3>
            <div className={styles.starCount}>
              {activeStars.length} כוכבים בסביבה
            </div>
            <button
              className={styles.closeButton}
              onClick={() => handleCloseClick("minimap")}
              title="סגור"
            >
              <FaTimes />
            </button>
          </div>

          <MiniMap
            position={position}
            starsData={activeStars}
            compact={isCompactMode}
          />
        </div>
      );
    };

    /**
     * Render activity panel (new)
     */
    const renderActivityPanel = () => {
      if (!isPanelVisible("activity")) return null;

      const positionStyle = isCompactMode ? {} : panelPositions.activity || {};

      return (
        <div
          ref={panelRefs.activity}
          className={`${styles.hudPanel} ${styles.activityPanel} ${
            animatingPanel === "activity" ? styles.panelClosing : ""
          } ${isCompactMode ? styles.compactPanel : ""}`}
          style={positionStyle}
          onMouseDown={(e) => handlePanelDragStart(e, "activity")}
        >
          <div className={styles.panelHeader}>
            <h3>
              <FaHistory /> פעילות אחרונה
            </h3>
            <button
              className={styles.closeButton}
              onClick={() => handleCloseClick("activity")}
              title="סגור"
            >
              <FaTimes />
            </button>
          </div>

          <div className={styles.activityList}>
            {activities && activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {activity.type === "star" ? (
                      <FaStar />
                    ) : activity.type === "quest" ? (
                      <FaTasks />
                    ) : activity.type === "achievement" ? (
                      <FaTrophy />
                    ) : (
                      <FaRunning />
                    )}
                  </div>
                  <div className={styles.activityDetails}>
                    <div className={styles.activityTitle}>{activity.title}</div>
                    <div className={styles.activityTime}>
                      {typeof activity.time === "string"
                        ? new Date(activity.time).toLocaleTimeString()
                        : ""}
                    </div>
                  </div>
                  {activity.reward && (
                    <div className={styles.activityReward}>
                      <FaCoins /> {activity.reward}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.emptyActivityMessage}>
                <FaInfoCircle />
                <p>אין פעילות אחרונה להצגה</p>
              </div>
            )}
          </div>
        </div>
      );
    };

    /**
     * Render quick access control panel
     */
    const renderControlPanel = () => {
      if (!showControlBar) return null;

      return (
        <div className={styles.controlPanel}>
          <button
            className={`${styles.controlButton} ${
              showStats ? styles.active : ""
            }`}
            onClick={() => onClosePanel?.(showStats ? "stats" : "showStats")}
            aria-label="סטטיסטיקות"
            title="סטטיסטיקות"
          >
            <FaChartLine />
          </button>

          <button
            className={`${styles.controlButton} ${
              showAchievements ? styles.active : ""
            }`}
            onClick={() =>
              onClosePanel?.(
                showAchievements ? "achievements" : "showAchievements"
              )
            }
            aria-label="הישגים"
            title="הישגים"
          >
            <FaTrophy />
            {newAchievements.length > 0 && (
              <span className={styles.controlBadge}>
                {newAchievements.length}
              </span>
            )}
          </button>

          <button
            className={`${styles.controlButton} ${
              showQuests ? styles.active : ""
            }`}
            onClick={() => onClosePanel?.(showQuests ? "quests" : "showQuests")}
            aria-label="משימות"
            title="משימות"
          >
            <FaTasks />
            {claimableQuests.length > 0 && (
              <span className={styles.controlBadge}>
                {claimableQuests.length}
              </span>
            )}
          </button>

          <button
            className={`${styles.controlButton} ${
              showMinimap ? styles.active : ""
            }`}
            onClick={() =>
              onClosePanel?.(showMinimap ? "minimap" : "showMinimap")
            }
            aria-label="מפה מוקטנת"
            title="מפה מוקטנת"
          >
            <FaMapMarkedAlt />
            {activeStars.length > 0 && (
              <span className={styles.controlBadge}>{activeStars.length}</span>
            )}
          </button>

          <button
            className={`${styles.controlButton} ${
              showActivity ? styles.active : ""
            }`}
            onClick={() =>
              onClosePanel?.(showActivity ? "activity" : "showActivity")
            }
            aria-label="פעילות אחרונה"
            title="פעילות אחרונה"
          >
            <FaHistory />
          </button>

          <div className={styles.controlSeparator}></div>

          <button
            className={styles.controlButton}
            onClick={() => setIsCompactMode(!isCompactMode)}
            aria-label={isCompactMode ? "מצב רגיל" : "מצב קומפקטי"}
            title={isCompactMode ? "מצב רגיל" : "מצב קומפקטי"}
          >
            {isCompactMode ? <FaAngleUp /> : <FaAngleDown />}
          </button>

          <button
            className={styles.controlButton}
            onClick={onSettingsClick}
            aria-label="הגדרות"
            title="הגדרות"
          >
            <FaSlidersH />
          </button>
        </div>
      );
    };

    /**
     * Render quick stats display (mini status bar)
     */
    const renderQuickStats = () => {
      if (!showQuickStats || isLoading) return null;

      return (
        <div className={styles.quickStats}>
          <div className={styles.quickStatItem}>
            <FaRunning className={styles.quickStatIcon} />
            <span>{Math.round(playerState?.totalDistance || 0)}מ'</span>
          </div>

          <div className={styles.quickStatItem}>
            <FaStar className={styles.quickStatIcon} />
            <span>{playerState?.totalStarsCollected || 0}</span>
          </div>

          <div className={styles.quickStatItem}>
            <FaTasks className={styles.quickStatIcon} />
            <span>
              {quests?.filter((q) => q.completed).length || 0}/
              {quests?.length || 0}
            </span>
          </div>
        </div>
      );
    };

    // If loading or error and no panels are shown, don't render anything
    if (
      isLoading ||
      error ||
      (!showStats &&
        !showAchievements &&
        !showMinimap &&
        !showQuests &&
        !showActivity)
    ) {
      return null;
    }

    // Main render
    return (
      <div
        className={`${styles.gameHUD} ${isCompactMode ? styles.compact : ""} ${
          gameMode ? styles[`gameMode-${gameMode}`] : ""
        }`}
      >
        {/* Player info and main controls */}
        {renderPlayerSummary()}

        {/* Quick stats display */}
        {renderQuickStats()}

        {/* Main panels */}
        <div className={styles.hudPanels}>
          {renderStatsPanel()}
          {renderAchievementsPanel()}
          {renderQuestsPanel()}
          {renderMinimapPanel()}
          {renderActivityPanel()}
        </div>

        {/* Quick access toolbar */}
        {renderControlPanel()}

        {/* Toast notifications */}
        {renderToast()}
      </div>
    );
  }
);

// PropTypes for validation
GameHUD.propTypes = {
  showStats: PropTypes.bool,
  showQuests: PropTypes.bool,
  showAchievements: PropTypes.bool,
  showMinimap: PropTypes.bool,
  showActivity: PropTypes.bool,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  achievements: PropTypes.array,
  quests: PropTypes.array,
  activities: PropTypes.array,
  playerState: PropTypes.object,
  playerLevelInfo: PropTypes.object,
  starsData: PropTypes.array,
  position: PropTypes.object,
  onSettingsClick: PropTypes.func,
  onClosePanel: PropTypes.func,
  onQuestClick: PropTypes.func,
  onQuestClaim: PropTypes.func,
  onProfileClick: PropTypes.func,
  onNotificationClick: PropTypes.func,
  onAchievementClick: PropTypes.func,
  gameMode: PropTypes.string,
};

// Default props
GameHUD.defaultProps = {
  showStats: false,
  showAchievements: false,
  showMinimap: false,
  showQuests: false,
  showActivity: false,
  isLoading: false,
  achievements: [],
  quests: [],
  activities: [],
  starsData: [],
  playerState: {
    level: 1,
    xp: 0,
    coins: 0,
    gems: 0,
    totalStarsCollected: 0,
    consecutiveLoginDays: 0,
  },
  playerLevelInfo: {
    level: 1,
    currentLevelXp: 0,
    nextLevelRequirement: 1000,
    progressPercent: 0,
  },
};

export default GameHUD;
