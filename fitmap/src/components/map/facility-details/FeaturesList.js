// src/components/facility-details/FeaturesList.js
import React from 'react';
import styles from './FeaturesList.module.css';

function FeaturesList({ features = [] }) {
  const featureDefinitions = [
    { id: 'shaded', label: 'מוצל', icon: 'fas fa-umbrella' },
    { id: 'accessible', label: 'נגיש לנכים', icon: 'fas fa-wheelchair' },
    { id: 'lit', label: 'מואר בלילה', icon: 'fas fa-lightbulb' },
    { id: 'water_fountain', label: 'ברזיית מים', icon: 'fas fa-tint' },
    { id: 'benches', label: 'ספסלים', icon: 'fas fa-chair' },
    { id: 'restrooms', label: 'שירותים', icon: 'fas fa-toilet' }
  ];

  return (
    <div className={styles.section}>
      <h4>מאפיינים</h4>
      <ul className={styles.featuresList}>
        {featureDefinitions.map(f => (
          <li key={f.id} className={styles.featureItem}>
            <i className={f.icon}></i> {f.label}: {features.includes(f.id) ? '✓' : '✗'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FeaturesList;