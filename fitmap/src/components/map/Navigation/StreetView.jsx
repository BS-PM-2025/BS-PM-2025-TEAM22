// src/components/map/Navigation/StreetView.jsx - גרסה מלאה ומעודכנת
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  FaTimes,
  FaExternalLinkAlt,
  FaStreetView,
  FaCompass,
  FaTrophy,
  FaCoins,
  FaRunning,
  FaStar,
  FaMapMarkedAlt,
  FaChartLine,
  FaMedal,
  FaMoon,
  FaSun,
  FaTasks,
} from "react-icons/fa";
import styles from "./styles/StreetView.module.css";
import { saveCollectedStar } from "../../../services/collectedStarsService";
import { incrementSteps } from "../../../services/stepsService";
import useStars from "./hooks/useStars";
import useAchievements from "./hooks/useAchievements";
import useQuests from "./hooks/useQuests";
import StarMarkerManager from "./utils/StarMarkerManager";
import {
  showCollectAnimation,
  showAchievementAnimation,
  showWalkingAnimation,
} from "./utils/AnimationUtils";
import {
  calculateStarReward,
  updateComboSystem,
  calculateDailyBonus,
  calculatePlayerLevel,
  checkLevelUp,
} from "./utils/GameMechanics";
import Confetti from "react-confetti";
import GameHUD from "./GameHUD";
import PowerupsMenu from "./PowerupsMenu";

function StreetView({
  position,
  onClose,
  facilityName,
  stars = [],
  onStarCollected,
  onStepCounted,
  userId,
}) {
  // StreetView refs
  const streetViewRef = useRef(null);
  const panoramaRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastPositionTimeRef = useRef(null);
  const stepCountRef = useRef(0);
  const currentPositionRef = useRef(position);
  const starMarkerManager = useRef(new StarMarkerManager());

  // StreetView states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleStars, setVisibleStars] = useState([]);
  const [starCollectionInProgress, setStarCollectionInProgress] = useState(false);

  // Player stats
  const [playerState, setPlayerState] = useState({
    points: 0,
    coins: 0,
    xp: 0,
    comboCount: 0,
    maxCombo: 0,
    lastCollectionTime: null,
    totalStarsCollected: 0,
    dailyCollectionCount: 0,
    totalDistance: 0,
    visitedAreas: {},
    consecutiveLoginDays: 0,
    lastLoginDate: null,
    level: 1,
    perks: [],
  });

  // UI states & indicators
  const [, setShowCombo] = useState(false);
  const [comboTimer, setComboTimer] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [dailyBonusInfo, setDailyBonusInfo] = useState(null);
  const [lastReward, setLastReward] = useState(null);
  const [isCompassVisible, setIsCompassVisible] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [nightMode, setNightMode] = useState(false);

  // Walking mode
  const [isWalkingMode, setIsWalkingMode] = useState(false);
  const [walkingDistance, setWalkingDistance] = useState(0);
  const [walkingSpeed, setWalkingSpeed] = useState(0);

  // Powerups
  const [starMagnetActive, setStarMagnetActive] = useState(false);
  const [starRadarActive, setStarRadarActive] = useState(false);

  // Custom hooks
  const { starsData, setStarsData, loadUserStars, generateDemoStars } =
    useStars(userId, position, stars);
  const {
    achievements,
    setAchievements,
    checkAchievements,
    showCompletedAchievements,
  } = useAchievements(walkingDistance, starsData, userId);
  const {
    quests,
    updateProgress: updateQuestProgress,
    claimReward: claimQuestReward,
  } = useQuests(userId);

  // Calculate player level (memoized)
  const playerLevelInfo = useMemo(() => {
    return calculatePlayerLevel(playerState.xp);
  }, [playerState.xp]);

  // Effect: Check if starting from user location (walking mode)
  useEffect(() => {
    if (facilityName === "המיקום שלך") {
      setIsWalkingMode(true);
    }
  }, [facilityName]);

  // Effect: Load user data
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const { getUserGameData } = await import(
          "../../../services/userService"
        );
        const { getUserAchievements } = await import(
          "../../../services/achievementService"
        );

        // Load player data
        const gameData = await getUserGameData(userId);
        setPlayerState((prev) => ({
          ...prev,
          ...gameData.profile,
          totalStarsCollected: gameData.stars.total,
          totalDistance: gameData.steps.weekly.reduce(
            (sum, d) => sum + d.distance,
            0
          ),
          consecutiveLoginDays: gameData.steps.streak,
        }));

        // Load stars
        setStarsData(gameData.stars.recent || []);

        // Load achievements
        const userAchievements = await getUserAchievements(userId);
        setAchievements(userAchievements);
      } catch (error) {
        console.error("שגיאה בטעינת נתוני המשתמש:", error);
      }
    };

    fetchData();
  }, [userId, setStarsData, setAchievements]);

  // Effect: Load stars data
  useEffect(() => {
    loadUserStars();
  }, [loadUserStars]);

  // Effect: Generate demo stars if no real stars available
  useEffect(() => {
    if (starsData.length > 0) return;
    if (stars && stars.length > 0) {
      setStarsData(stars);
      return;
    }
    if (position) {
      setStarsData(generateDemoStars(position));
    }
  }, [stars, position, starsData.length, generateDemoStars, setStarsData]);

  // Effect: Check for daily bonus
  useEffect(() => {
    if (!userId) return;

    const dailyBonus = calculateDailyBonus(playerState);
    if (dailyBonus.isNewDay) {
      setDailyBonusInfo(dailyBonus);
      setShowDailyBonus(true);
      setPlayerState((prev) => ({
        ...prev,
        coins: prev.coins + dailyBonus.bonusCoins,
        xp: prev.xp + dailyBonus.bonusXp,
        consecutiveLoginDays: dailyBonus.consecutiveDays,
        lastLoginDate: new Date().toISOString(),
      }));
      setTimeout(() => setShowDailyBonus(false), 5000);
    }
  }, [userId, playerState.lastLoginDate]);

  // Effect: Check for pending achievements
  useEffect(() => {
    const newlyCompletedAchievement = showCompletedAchievements();
    if (newlyCompletedAchievement) {
      showAchievementAnimation(newlyCompletedAchievement, styles, () => {
        checkAchievements(newlyCompletedAchievement.id);
      });
      setPlayerState((prev) => ({
        ...prev,
        coins: prev.coins + (newlyCompletedAchievement.coinsReward || 100),
        xp: prev.xp + (newlyCompletedAchievement.xpReward || 200),
      }));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [achievements, showCompletedAchievements, checkAchievements]);

  // Effect: Check for level up
  useEffect(() => {
    const levelInfo = checkLevelUp({ xp: playerState.xp - 200 }, playerState);
    if (levelInfo) {
      setShowLevelUp(true);
      setPlayerState((prev) => ({
        ...prev,
        level: levelInfo.newLevel,
        coins: prev.coins + levelInfo.rewardCoins,
        perks: [...(prev.perks || []), ...(levelInfo.newAbilities || [])],
      }));
      setShowConfetti(true);
      setTimeout(() => {
        setShowLevelUp(false);
        setShowConfetti(false);
      }, 5000);
    }
  }, [playerState.xp]);

  // Effect: Star magnet powerup
  useEffect(() => {
    if (!starMagnetActive || !panoramaRef.current) return;

    const magnetInterval = setInterval(() => {
      const currentPosition = panoramaRef.current.getPosition();
      if (currentPosition) attractNearbyStars(currentPosition, 50);
    }, 1000);

    return () => clearInterval(magnetInterval);
  }, [starMagnetActive]);

  // Effect: Initialize Street View
  useEffect(() => {
    if (!position) {
      setError("מיקום חסר - לא ניתן להציג Street View");
      setIsLoading(false);
      return;
    }

    if (!window.google || !window.google.maps) {
      setError("Google Maps API לא זמין");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Cleanup function
    const cleanupFunction = () => {
      if (panoramaRef.current) {
        starMarkerManager.current.clearMarkers();
        panoramaRef.current.setVisible(false);
        panoramaRef.current = null;
      }
    };

    try {
      const streetViewService = new window.google.maps.StreetViewService();
      const positionToUse = currentPositionRef.current || position;

      streetViewService.getPanorama(
        {
          location: positionToUse,
          radius: 100,
          source: window.google.maps.StreetViewSource.DEFAULT,
        },
        (data, status) => {
          if (status === "OK" && data && data.location) {
            try {
              if (!streetViewRef.current) {
                setError("שגיאה ביצירת Street View - המכיל לא קיים");
                setIsLoading(false);
                return;
              }

              panoramaRef.current = new window.google.maps.StreetViewPanorama(
                streetViewRef.current,
                {
                  position: data.location.latLng,
                  zoom: 1,
                  addressControl: false,
                  fullscreenControl: true,
                  linksControl: true,
                  panControl: true,
                  zoomControl: true,
                  enableCloseButton: false,
                  visible: true,
                }
              );

              setIsLoading(false);

              // Set initial position for distance calculation
              if (isWalkingMode) {
                lastPositionRef.current = data.location.latLng;
                lastPositionTimeRef.current = Date.now();
              }

              // Add stars to Street View
              if (starsData?.length > 0) {
                starMarkerManager.current.addStarsToStreetView(
                  panoramaRef.current,
                  starsData,
                  handleStarClick
                );
              }

              // Track position changes
              panoramaRef.current.addListener("position_changed", () => {
                const currentPosition = panoramaRef.current.getPosition();
                currentPositionRef.current = currentPosition;

                if (isWalkingMode) updateWalkingDistance(currentPosition);
                updateVisibleStars(panoramaRef.current);
                checkStarProximity(currentPosition);
                updateVisitedArea(currentPosition);
                checkAchievements();
              });

              // Update on POV changes
              panoramaRef.current.addListener("pov_changed", () => {
                updateVisibleStars(panoramaRef.current);
              });

              // Apply night mode if active
              if (nightMode && panoramaRef.current) {
                applyNightMode(panoramaRef.current);
              }
            } catch (err) {
              setError(`שגיאה ביצירת Street View: ${err.message}`);
              setIsLoading(false);
            }
          } else {
            setError("Street View לא זמין במיקום זה");
            setIsLoading(false);
          }
        }
      );
    } catch (err) {
      setError(`שגיאה בטעינת Street View: ${err.message}`);
      setIsLoading(false);
    }

    return cleanupFunction;
  }, [position, isWalkingMode, starsData, checkAchievements, nightMode]);

  // Helper function: Star magnet effect
  const attractNearbyStars = useCallback((userPosition, magnetRadius) => {
    if (!starsData?.length) return;

    const updatedStars = [...starsData];
    let starsChanged = false;

    starsData.forEach((star, index) => {
      if (star.collected) return;

      try {
        const starPosition = new window.google.maps.LatLng(star.lat, star.lng);
        const distance =
          window.google.maps.geometry.spherical.computeDistanceBetween(
            userPosition,
            starPosition
          );

        // Move star closer if in magnet radius but not close enough to collect
        if (distance < magnetRadius && distance > 10) {
          const heading = window.google.maps.geometry.spherical.computeHeading(
            starPosition,
            userPosition
          );
          const newPosition =
            window.google.maps.geometry.spherical.computeOffset(
              starPosition,
              Math.min(5, distance - 5), // Don't overshoot
              heading
            );

          updatedStars[index] = {
            ...star,
            lat: newPosition.lat(),
            lng: newPosition.lng(),
            animationState: "moving",
          };
          starsChanged = true;
        }
      } catch (error) {
        console.error("Error in star attraction:", error);
      }
    });

    if (starsChanged) {
      setStarsData(updatedStars);
      starMarkerManager.current.updateMarkers(
        panoramaRef.current,
        updatedStars,
        handleStarClick
      );
    }
  }, [starsData, setStarsData]);

  // Helper function: Apply night mode
  const applyNightMode = useCallback((panorama) => {
    if (!panorama) return;
    const styles = [
      { elementType: "all", stylers: [{ invert_lightness: true }] },
      { elementType: "all", stylers: [{ saturation: -100 }] },
      { elementType: "all", stylers: [{ hue: "#0000ff" }] },
      { elementType: "all", stylers: [{ lightness: -60 }] },
    ];
    panorama.setOptions({ styles });
  }, []);

  // Helper function: Update visited areas
  const updateVisitedArea = useCallback((position) => {
    if (!position) return;

    try {
      const lat = Math.round(position.lat() * 1000) / 1000;
      const lng = Math.round(position.lng() * 1000) / 1000;
      const areaKey = `${lat},${lng}`;

      if (!playerState.visitedAreas[areaKey]) {
        setPlayerState((prev) => ({
          ...prev,
          visitedAreas: {
            ...prev.visitedAreas,
            [areaKey]: {
              firstVisit: new Date().toISOString(),
              visits: 1,
            },
          },
          xp: prev.xp + 50, // XP bonus for discovering new area
        }));

        // Update quests if available
        if (quests) {
          const zoneQuests = quests.filter(
            (q) => q.type === "zones" && !q.completed
          );

          zoneQuests.forEach((quest) => {
            updateQuestProgress(quest.id, 1, true);
          });
        }
      }
    } catch (error) {
      console.error("Error updating visited area:", error);
    }
  }, [playerState.visitedAreas, quests, updateQuestProgress]);

  // Helper function: Check for stars proximity
  const checkStarProximity = useCallback((userPosition) => {
    if (!starsData?.length) return;

    const updatedStars = [...starsData];
    let starsChanged = false;

    updatedStars.forEach((star, index) => {
      if (star.collected) return;

      try {
        const starPosition = new window.google.maps.LatLng(star.lat, star.lng);
        const distance =
          window.google.maps.geometry.spherical.computeDistanceBetween(
            userPosition,
            starPosition
          );

        if (distance < 10) {
          collectStar(star, updatedStars, index);
          starsChanged = true;
        }
      } catch (error) {
        console.error("Error checking star proximity:", error);
      }
    });

    if (starsChanged) {
      setStarsData(updatedStars);
      starMarkerManager.current.updateMarkers(
        panoramaRef.current,
        updatedStars,
        handleStarClick
      );
      checkAchievements();
    }
  }, [starsData, setStarsData, checkAchievements]);

  // Helper function: Collect a star
  const collectStar = useCallback((star, starsArray, index) => {
    // Mark star as collected
    starsArray[index] = { ...star, collected: true };
    setStarCollectionInProgress(true);

    // Update combo system
    const comboUpdate = updateComboSystem(playerState);
    const updatedPlayerState = {
      ...playerState,
      ...comboUpdate,
      totalStarsCollected: playerState.totalStarsCollected + 1,
      dailyCollectionCount: playerState.dailyCollectionCount + 1,
    };

    // Calculate rewards
    const rewards = calculateStarReward(star, updatedPlayerState);

    // Handle combo
    if (comboUpdate.comboCount > 1) {
      if (comboTimer) clearTimeout(comboTimer);
      setShowCombo(true);
      const timer = setTimeout(() => setShowCombo(false), 2000);
      setComboTimer(timer);
    }

    // Update player state with rewards
    setPlayerState({
      ...updatedPlayerState,
      points: updatedPlayerState.points + rewards.points,
      coins: updatedPlayerState.coins + rewards.coins,
      xp: updatedPlayerState.xp + rewards.xp,
    });

    // Show reward animation
    setLastReward(rewards);
    setShowRewardAnimation(true);
    setTimeout(() => setShowRewardAnimation(false), 2000);

    // Save to database if userId available
    if (userId) {
      saveCollectedStar(star, userId)
        .then((success) => console.log(`Star ${star.id} saved:`, success))
        .catch((err) => console.error(`Error saving star ${star.id}:`, err));
    }

    // Call external handler
    if (onStarCollected) onStarCollected(star);

    // Show collection animation
    showCollectAnimation(star, styles, () =>
      setStarCollectionInProgress(false)
    );

    // Update quests if available
    if (quests) {
      const starQuests = quests.filter(
        (q) =>
          (q.type === "stars" ||
            (q.type === "gold_stars" && star.type === "gold")) &&
          !q.completed
      );

      starQuests.forEach((quest) => {
        updateQuestProgress(quest.id, 1, true);
      });
    }
  }, [playerState, comboTimer, onStarCollected, userId, quests, updateQuestProgress]);

  // Helper function: Handle star click
  const handleStarClick = useCallback((star) => {
    const starIndex = starsData.findIndex((s) => s.id === star.id);
    if (starIndex === -1) return;

    const updatedStars = [...starsData];
    collectStar(star, updatedStars, starIndex);
    setStarsData(updatedStars);

    starMarkerManager.current.updateMarkers(
      panoramaRef.current,
      updatedStars,
      handleStarClick
    );
    checkAchievements();
  }, [starsData, setStarsData, collectStar, checkAchievements]);

  // Helper function: Update walking distance
  const updateWalkingDistance = useCallback((currentPosition) => {
    if (!lastPositionRef.current) {
      lastPositionRef.current = currentPosition;
      lastPositionTimeRef.current = Date.now();
      return;
    }

    try {
      const currentTime = Date.now();
      const stepDistance =
        window.google.maps.geometry.spherical.computeDistanceBetween(
          lastPositionRef.current,
          currentPosition
        );

      // Add only if distance is reasonable (to prevent jumps)
      if (stepDistance < 30) {
        // Calculate time & speed
        const timeElapsed = (currentTime - lastPositionTimeRef.current) / 1000;
        const speed = timeElapsed > 0 ? stepDistance / timeElapsed : 0;
        setWalkingSpeed(speed);

        // Update distances
        const newDistance = walkingDistance + stepDistance;
        setWalkingDistance(newDistance);
        setPlayerState((prev) => ({
          ...prev,
          totalDistance: prev.totalDistance + stepDistance,
        }));

        // Update steps
        const newSteps = Math.floor(stepDistance * 1.3);
        stepCountRef.current += newSteps;

        // Show animation for significant distances
        if (stepDistance > 5) {
          showWalkingAnimation(stepDistance, newSteps, styles);
        }

        // Send steps to external handlers
        if (onStepCounted && newSteps > 0) {
          onStepCounted(newSteps);
        }

        // Save steps to database
        if (userId && newSteps > 0) {
          incrementSteps(userId, newSteps);
        }

        // Update quests if available
        if (quests && newSteps > 0) {
          const stepQuests = quests.filter(
            (q) => q.type === "steps" && !q.completed
          );

          stepQuests.forEach((quest) => {
            updateQuestProgress(quest.id, newSteps, true);
          });

          const distanceQuests = quests.filter(
            (q) => q.type === "distance" && !q.completed
          );

          distanceQuests.forEach((quest) => {
            updateQuestProgress(quest.id, stepDistance, true);
          });
        }
      }

      // Update last position and time
      lastPositionRef.current = currentPosition;
      lastPositionTimeRef.current = currentTime;
    } catch (error) {
      console.error("Error calculating walking distance:", error);
    }
  }, [walkingDistance, onStepCounted, userId, quests, updateQuestProgress]);

  // Helper function: Update visible stars
  const updateVisibleStars = useCallback((panorama) => {
    if (!panorama || !starMarkerManager.current.hasMarkers()) return;

    const visible = starMarkerManager.current.getVisibleStars(
      panorama.getPosition(),
      panorama.getPov().heading
    );
    setVisibleStars(visible);
  }, []);

  // UI toggle functions
  const toggleCompass = useCallback(() => setIsCompassVisible((prev) => !prev), []);
  const toggleAchievements = useCallback(() => {
    setShowAchievements((prev) => !prev);
    setShowStats(false);
    setShowQuests(false);
  }, []);
  const toggleStats = useCallback(() => {
    setShowStats((prev) => !prev);
    setShowAchievements(false);
    setShowQuests(false);
  }, []);
  const toggleQuests = useCallback(() => {
    setShowQuests((prev) => !prev);
    setShowStats(false);
    setShowAchievements(false);
  }, []);
  const toggleMinimap = useCallback(() => setShowMinimap((prev) => !prev), []);
  const toggleNightMode = useCallback(() => {
    setNightMode((prev) => {
      const newMode = !prev;
      
      if (panoramaRef.current) {
        if (newMode) {
          applyNightMode(panoramaRef.current);
        } else {
          panoramaRef.current.setOptions({ styles: [] });
        }
      }
      
      return newMode;
    });
  }, [applyNightMode]);

  // Powerup activations
  const activateStarMagnet = useCallback(() => {
    if (playerState.coins >= 50) {
      setStarMagnetActive(true);
      setPlayerState((prev) => ({ ...prev, coins: prev.coins - 50 }));
      setTimeout(() => setStarMagnetActive(false), 30000);
    }
  }, [playerState.coins]);

  const activateStarRadar = useCallback(() => {
    if (playerState.coins >= 100) {
      setStarRadarActive(true);
      setPlayerState((prev) => ({ ...prev, coins: prev.coins - 100 }));

      if (panoramaRef.current) {
        starMarkerManager.current.revealAllStarsInRange(
          panoramaRef.current.getPosition(),
          300
        );
      }

      setTimeout(() => {
        setStarRadarActive(false);
        if (panoramaRef.current) {
          starMarkerManager.current.resetStarVisibility();
        }
      }, 20000);
    }
  }, [playerState.coins]);

  // Quest handlers
  const handleQuestClick = useCallback((quest) => {
    console.log("Quest clicked:", quest);
    // Additional quest click handling if needed
  }, []);

  const handleQuestClaim = useCallback((quest) => {
    claimQuestReward(quest.id).then((result) => {
      if (result) {
        // Show reward notification
        setLastReward({
          points: 0,
          coins: result.coinsReward || 0,
          xp: result.xpReward || 0,
          bonusMultiplier: 1,
          bonusReasons: ["השלמת משימה"],
        });
        setShowRewardAnimation(true);
        setTimeout(() => setShowRewardAnimation(false), 2000);
      }
    });
  }, [claimQuestReward]);

  const handleCloseClick = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    // Toggle settings if needed
  }, []);

  // Handle panel close
  const handleClosePanel = useCallback((panelName) => {
    if (panelName === "stats") setShowStats(false);
    else if (panelName === "achievements") setShowAchievements(false);
    else if (panelName === "minimap") setShowMinimap(false);
    else if (panelName === "quests") setShowQuests(false);
  }, []);

  // Render component
  return (
    <div
      className={`${styles.streetViewOverlay} ${
        nightMode ? styles.nightMode : ""
      }`}
    >
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
        />
      )}

      <div className={styles.streetViewContainer}>
        <div className={styles.streetViewHeader}>
          <div className={styles.headerTitle}>
            <FaStreetView className={styles.icon} />
            <h3>{facilityName || "Street View"}</h3>
          </div>
          <div className={styles.playerStats}>
            <div className={styles.statItem}>
              <FaStar className={styles.statIcon} />
              <span>{playerState.totalStarsCollected}</span>
            </div>
            <div className={styles.statItem}>
              <FaCoins className={styles.statIcon} />
              <span>{playerState.coins}</span>
            </div>
            <div className={styles.levelBadge} onClick={toggleStats}>
              <span className={styles.levelNumber}>
                {playerLevelInfo.level}
              </span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.externalButton} title="פתח ב-Google Maps">
              <FaExternalLinkAlt />
            </button>
            <button
              className={styles.closeButton}
              onClick={handleCloseClick}
              title="סגור"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className={styles.streetViewBody}>
          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>טוען Street View...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={handleCloseClick} className={styles.errorButton}>
                חזור למפה
              </button>
            </div>
          )}

          <div
            ref={streetViewRef}
            className={styles.streetView}
            style={{ display: isLoading || error ? "none" : "block" }}
          />

          {/* Game Mode Banner */}
          {isWalkingMode && !isLoading && !error && (
            <div className={styles.gameModeBanner}>
              <div className={styles.modeIcon}>
                <FaRunning />
              </div>
              <div className={styles.modeInfo}>
                <div className={styles.modeName}>מצב הליכה</div>
                <div className={styles.modeStats}>
                  <span className={styles.distanceValue}>
                    {walkingDistance.toFixed(1)} מ'
                  </span>
                  <span className={styles.stepValue}>
                    {stepCountRef.current} צעדים
                  </span>
                  {walkingSpeed > 0 && (
                    <span className={styles.speedValue}>
                      {walkingSpeed.toFixed(1)} מ'/ש'
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reward Animation */}
          {showRewardAnimation && lastReward && (
            <div className={styles.rewardAnimation}>
              <div className={styles.rewardPoints}>
                +{lastReward.points} נקודות
              </div>
              <div className={styles.rewardCoins}>
                +{lastReward.coins} מטבעות
              </div>
              <div className={styles.rewardXp}>+{lastReward.xp} XP</div>
              {lastReward.bonusMultiplier > 1 && (
                <div className={styles.bonusMultiplier}>
                  x{lastReward.bonusMultiplier.toFixed(1)} בונוס!
                </div>
              )}
            </div>
          )}

          {/* Level Up Notification */}
          {showLevelUp && (
            <div className={styles.levelUpNotification}>
              <div className={styles.levelUpIcon}>
                <FaMedal />
              </div>
              <div className={styles.levelUpContent}>
                <div className={styles.levelUpTitle}>
                  עלית לרמה {playerState.level}!
                </div>
                <div className={styles.levelUpRewards}>
                  <div className={styles.coinsReward}>
                    +{playerState.level * 100} מטבעות
                  </div>
                  {playerState.perks?.length > 0 &&
                    playerState.perks[playerState.perks.length - 1] && (
                      <div className={styles.newPerk}>
                        יכולת חדשה:{" "}
                        {playerState.perks[playerState.perks.length - 1].name}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Daily Bonus */}
          {showDailyBonus && dailyBonusInfo && (
            <div className={styles.dailyBonusNotification}>
              <div className={styles.dailyBonusHeader}>
                בונוס יומי! {dailyBonusInfo.consecutiveDays} ימים רצופים
              </div>
              <div className={styles.dailyBonusContent}>
                <div className={styles.streakMultiplier}>
                  x{dailyBonusInfo.streakBonusMultiplier} מכפיל רצף
                </div>
                <div className={styles.dailyRewards}>
                  <div className={styles.coinsReward}>
                    +{dailyBonusInfo.bonusCoins} מטבעות
                  </div>
                  <div className={styles.xpReward}>
                    +{dailyBonusInfo.bonusXp} XP
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location label */}
          {!isLoading && !error && (
            <div className={styles.locationLabel}>
              <div className={styles.locationLabelIcon}>
                <FaStreetView />
              </div>
              <div className={styles.locationLabelText}>
                {facilityName || "מיקום נוכחי"}
              </div>
            </div>
          )}

          {/* Visible stars indicator */}
          {!isLoading && !error && visibleStars.length > 0 && (
            <div className={styles.visibleStarsIndicator}>
              <div className={styles.starsCount}>
                <div className={styles.starsCountIcon}>⭐</div>
                <div className={styles.starsCountValue}>
                  {visibleStars.length}
                </div>
                <div className={styles.starsCountLabel}>כוכבים בטווח</div>
              </div>
            </div>
          )}

          {/* Compass */}
          {isCompassVisible && !isLoading && !error && (
            <div className={styles.compass}>
              <div
                className={styles.compassInner}
                style={{
                  transform: panoramaRef.current
                    ? `rotate(${-panoramaRef.current.getPov().heading}deg)`
                    : "rotate(0deg)",
                }}
              >
                <div
                  className={`${styles.compassDirection} ${styles.compassN}`}
                >
                  N
                </div>
                <div
                  className={`${styles.compassDirection} ${styles.compassE}`}
                >
                  E
                </div>
                <div
                  className={`${styles.compassDirection} ${styles.compassS}`}
                >
                  S
                </div>
                <div
                  className={`${styles.compassDirection} ${styles.compassW}`}
                >
                  W
                </div>
                <div className={styles.compassArrow} />
              </div>
            </div>
          )}

          {/* Quick action buttons */}
          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionButton} ${
                isCompassVisible ? styles.active : ""
              }`}
              onClick={toggleCompass}
              title={isCompassVisible ? "הסתר מצפן" : "הצג מצפן"}
            >
              <div className={styles.actionButtonIcon}>
                <FaCompass />
              </div>
            </button>

            <button
              className={`${styles.actionButton} ${
                showAchievements ? styles.active : ""
              }`}
              onClick={toggleAchievements}
              title={showAchievements ? "הסתר הישגים" : "הצג הישגים"}
            >
              <div className={styles.actionButtonIcon}>
                <FaTrophy />
              </div>
            </button>

            <button
              className={`${styles.actionButton} ${
                showStats ? styles.active : ""
              }`}
              onClick={toggleStats}
              title={showStats ? "הסתר סטטיסטיקות" : "הצג סטטיסטיקות"}
            >
              <div className={styles.actionButtonIcon}>
                <FaChartLine />
              </div>
            </button>

            <button
              className={`${styles.actionButton} ${
                showQuests ? styles.active : ""
              }`}
              onClick={toggleQuests}
              title={showQuests ? "הסתר משימות" : "הצג משימות"}
            >
              <div className={styles.actionButtonIcon}>
                <FaTasks />
              </div>
            </button>

            <button
              className={`${styles.actionButton} ${
                showMinimap ? styles.active : ""
              }`}
              onClick={toggleMinimap}
              title={showMinimap ? "הסתר מפה מוקטנת" : "הצג מפה מוקטנת"}
            >
              <div className={styles.actionButtonIcon}>
                <FaMapMarkedAlt />
              </div>
            </button>

            <button
              className={`${styles.actionButton} ${
                nightMode ? styles.active : ""
              }`}
              onClick={toggleNightMode}
              title={nightMode ? "בטל מצב לילה" : "הפעל מצב לילה"}
            >
              <div className={styles.actionButtonIcon}>
                {nightMode ? <FaSun /> : <FaMoon />}
              </div>
            </button>
          </div>

          {/* Powerups Menu */}
          {!isLoading && !error && (
            <PowerupsMenu
              isLoading={isLoading}
              error={error}
              starMagnetActive={starMagnetActive}
              starRadarActive={starRadarActive}
              playerCoins={playerState.coins}
              onActivateMagnet={activateStarMagnet}
              onActivateRadar={activateStarRadar}
            />
          )}

          {/* Game HUD with Achievements, Stats, Quests & Minimap */}
          <GameHUD
            showStats={showStats}
            showAchievements={showAchievements}
            showMinimap={showMinimap}
            showQuests={showQuests}
            quests={quests}
            isLoading={isLoading}
            error={error}
            achievements={achievements}
            playerState={playerState}
            playerLevelInfo={playerLevelInfo}
            starsData={starsData}
            position={position}
            onSettingsClick={handleSettingsClick}
            onClosePanel={handleClosePanel}
            onQuestClick={handleQuestClick}
            onQuestClaim={handleQuestClaim}
          />

          {/* Star collection message */}
          {starCollectionInProgress && (
            <div className={styles.messagePanel}>
              <div className={styles.messageContent}>
                <div className={styles.messageIcon}>⭐</div>
                <div className={styles.messageText}>
                  <strong>כוכב נאסף בהצלחה!</strong>
                </div>
              </div>
            </div>
          )}

          {/* Tutorial Overlay */}
          {showTutorial && (
            <div className={styles.tutorialOverlay}>
              <div className={styles.tutorialContent}>
                {tutorialStep === 0 && (
                  <>
                    <h3>ברוכים הבאים לחוויית Street View!</h3>
                    <p>אסוף כוכבים, השג הישגים וחקור את העולם!</p>
                    <button onClick={() => setTutorialStep(1)}>המשך</button>
                  </>
                )}
                {tutorialStep === 1 && (
                  <>
                    <h3>איסוף כוכבים</h3>
                    <p>
                      התקרב לכוכבים כדי לאסוף אותם, או לחץ עליהם. כוכבים מסוגים
                      שונים מעניקים יותר נקודות!
                    </p>
                    <button onClick={() => setTutorialStep(2)}>המשך</button>
                  </>
                )}
                {tutorialStep === 2 && (
                  <>
                    <h3>קומבו ובונוסים</h3>
                    <p>
                      אסוף כוכבים ברצף כדי לבנות קומבו ולקבל בונוסים משמעותיים!
                    </p>
                    <button onClick={() => setTutorialStep(3)}>המשך</button>
                  </>
                )}
                {tutorialStep === 3 && (
                  <>
                    <h3>משימות</h3>
                    <p>
                      השלם משימות יומיות ושבועיות כדי לקבל תגמולים נוספים. לחץ
                      על כפתור המשימות כדי לראות את המשימות הזמינות.
                    </p>
                    <button onClick={() => setTutorialStep(4)}>המשך</button>
                  </>
                )}
                {tutorialStep === 4 && (
                  <>
                    <h3>כוחות מיוחדים</h3>
                    <p>
                      השתמש במטבעות שלך כדי להפעיל כוחות מיוחדים כמו מגנט כוכבים
                      ורדאר!
                    </p>
                    <button
                      onClick={() => {
                        setShowTutorial(false);
                        setTutorialStep(0);
                        localStorage.setItem(
                          "streetview_tutorial_complete",
                          "true"
                        );
                      }}
                    >
                      התחל לשחק!
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

StreetView.propTypes = {
  position: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  facilityName: PropTypes.string,
  stars: PropTypes.array,
  onStarCollected: PropTypes.func,
  onStepCounted: PropTypes.func,
  userId: PropTypes.string,
};

export default StreetView;