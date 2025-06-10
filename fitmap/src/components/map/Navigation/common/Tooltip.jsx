// src/components/map/Navigation/common/Tooltip.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './Tooltip.module.css';

/**
 * Simple tooltip component that appears on hover
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const Tooltip = ({ children, text, position = 'bottom' }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  if (!text) {
    return children;
  }
  
  return (
    <div 
      className={styles.tooltipContainer}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`${styles.tooltip} ${styles[position]}`}>
          {text}
        </div>
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  text: PropTypes.string,
  position: PropTypes.oneOf(['top', 'right', 'bottom', 'left'])
};

export default Tooltip;