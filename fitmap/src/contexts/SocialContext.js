// src/contexts/SocialContext.js
import React, { createContext, useContext, useState } from 'react';
import { useSocialFeed } from '../hooks/useSocialFeed';
import { useNotifications } from '../hooks/useNotifications';

const SocialContext = createContext();

/**
 * Provider לניהול מצב חברתי משותף
 */
export const SocialProvider = ({ children }) => {
  const feed = useSocialFeed(); // כולל posts, loadMore וכו'
  const notifications = useNotifications(); // כולל notifications, unreadCount

  const [activeTab, setActiveTab] = useState('feed'); // feed | suggestions | notifications

  return (
    <SocialContext.Provider
      value={{
        feed,
        notifications,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

/**
 * שימוש בהוק קצר לגישה לקונטקסט
 */
export const useSocial = () => {
  return useContext(SocialContext);
};
