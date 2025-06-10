// src/components/map/Navigation/MiniMap.jsx
import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import styles from "./styles/MiniMap.module.css";

/**
 * MiniMap component for showing nearby stars and current position
 *
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const MiniMap = ({ position, starsData, zoomLevel }) => {
  const canvasRef = useRef(null);

  // Render map on canvas
  useEffect(() => {
    if (!canvasRef.current || !position) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const scale = zoomLevel || 1;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    // Draw grid
    const gridSize = 20;
    for (let i = 0; i < canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Center point (player)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw stars
    if (starsData && starsData.length > 0) {
      starsData.forEach((star) => {
        // Calculate position relative to center
        const latDiff = (star.lat - position.lat) * 111000; // Convert to meters (approx)
        const lngDiff =
          (star.lng - position.lng) *
          111000 *
          Math.cos((position.lat * Math.PI) / 180);

        // Scale and position on minimap (1m = 0.5px at default zoom)
        const starX = centerX + lngDiff * 0.5 * scale;
        const starY = centerY - latDiff * 0.5 * scale; // Invert Y for map coords

        if (
          starX >= 0 &&
          starX <= canvas.width &&
          starY >= 0 &&
          starY <= canvas.height
        ) {
          // Star glow effect
          const gradient = ctx.createRadialGradient(
            starX,
            starY,
            0,
            starX,
            starY,
            star.distance < 50 ? 8 : 5
          );

          // Different colors for different star types
          let color = "#FFD700"; // default gold
          if (star.type === "silver") color = "#C0C0C0";
          else if (star.type === "bronze") color = "#CD7F32";
          else if (star.type === "culture") color = "#9C27B0";
          else if (star.type === "history") color = "#3F51B5";
          else if (star.type === "nature") color = "#4CAF50";

          gradient.addColorStop(0, color);
          gradient.addColorStop(1, "transparent");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(starX, starY, star.distance < 50 ? 8 : 5, 0, Math.PI * 2);
          ctx.fill();

          // Star center
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(starX, starY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw player position with pulsing effect
    const timestamp = Date.now();
    const pulseSize = 5 + Math.sin(timestamp / 200) * 2;

    // Outer glow
    const playerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      pulseSize + 5
    );
    playerGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    playerGradient.addColorStop(0.5, "rgba(108, 178, 235, 0.5)");
    playerGradient.addColorStop(1, "transparent");

    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize + 5, 0, Math.PI * 2);
    ctx.fill();

    // Player marker
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    ctx.fillStyle = "#6CB2EB";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX - 5, centerY - 5);
    ctx.lineTo(centerX + 5, centerY - 5);
    ctx.fill();
  }, [position, starsData, zoomLevel]);

  // Animation loop
  useEffect(() => {
    let animationId;
    const animate = () => {
      // Trigger re-render for animation effects
      if (canvasRef.current) {
        // Just trigger a re-draw
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className={styles.minimap}>
      <canvas
        ref={canvasRef}
        width={280}
        height={200}
        className={styles.minimapCanvas}
      />
      <div className={styles.compassRose}>N</div>
      <div className={styles.distanceScale}>
        <div className={styles.scaleBar}></div>
        <div className={styles.scaleText}>100m</div>
      </div>
    </div>
  );
};

MiniMap.propTypes = {
  position: PropTypes.object.isRequired,
  starsData: PropTypes.array,
  zoomLevel: PropTypes.number,
};

MiniMap.defaultProps = {
  starsData: [],
  zoomLevel: 1,
};

export default MiniMap;
