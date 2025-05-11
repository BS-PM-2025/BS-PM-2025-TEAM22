import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementBadge from '../challenges/AchievementBadge';

// Mock the CSS module to avoid issues with Jest
jest.mock('./styles/AchievementBadge.module.css', () => ({
  badge: 'badge',
  lockedBadge: 'lockedBadge',
  smallBadge: 'smallBadge',
  animateShimmer: 'animateShimmer',
  badgeIcon: 'badgeIcon',
  lockOverlay: 'lockOverlay',
  badgeContent: 'badgeContent',
  badgeHeader: 'badgeHeader',
  badgeTitle: 'badgeTitle',
  badgeLevel: 'badgeLevel',
  earnedDate: 'earnedDate',
  badgeDescription: 'badgeDescription',
  progressInfo: 'progressInfo',
  completedBadge: 'completedBadge',
  smallBadgeTooltip: 'smallBadgeTooltip',
  smallBadgeInfoButton: 'smallBadgeInfoButton',
  badgeDetailsModal: 'badgeDetailsModal',
  badgeDetailsContent: 'badgeDetailsContent',
  closeDetailsButton: 'closeDetailsButton',
  detailsIconContainer: 'detailsIconContainer',
  detailsTitle: 'detailsTitle',
  detailsLevel: 'detailsLevel',
  detailsEarnedDate: 'detailsEarnedDate',
  detailsDescription: 'detailsDescription',
  detailsProgressInfo: 'detailsProgressInfo',
  detailsCompletedBadge: 'detailsCompletedBadge'
}));

// Mock icons to avoid react-icons import issues in tests
jest.mock('react-icons/fa', () => ({
  FaTrophy: () => <div data-testid="icon-trophy">Trophy Icon</div>,
  FaMedal: () => <div data-testid="icon-medal">Medal Icon</div>,
  FaRunning: () => <div data-testid="icon-running">Running Icon</div>,
  FaDumbbell: () => <div data-testid="icon-dumbbell">Dumbbell Icon</div>,
  FaFire: () => <div data-testid="icon-fire">Fire Icon</div>,
  FaStar: () => <div data-testid="icon-star">Star Icon</div>,
  FaCalendarAlt: () => <div data-testid="icon-calendar">Calendar Icon</div>,
  FaClock: () => <div data-testid="icon-clock">Clock Icon</div>,
  FaHeartbeat: () => <div data-testid="icon-heartbeat">Heartbeat Icon</div>,
  FaAward: () => <div data-testid="icon-award">Award Icon</div>,
  FaLock: () => <div data-testid="icon-lock">Lock Icon</div>,
  FaInfo: () => <div data-testid="icon-info">Info Icon</div>,
}));

describe('AchievementBadge Component', () => {
  // Sample achievement data for tests
  const sampleAchievement = {
    id: '1',
    title: 'ריצת מרתון',
    description: 'רוץ מרתון מלא',
    category: 'running',
    level: 'gold',
    required_value: '42 ק"מ',
    earned_date: '2023-05-15'
  };

  // Test 1: Component renders locked state correctly
  test('renders locked badge with proper styling and lock icon', () => {
    render(<AchievementBadge achievement={sampleAchievement} isLocked={true} />);
    
    const badgeElement = screen.getByRole('button');
    expect(badgeElement).toHaveClass('lockedBadge');
    expect(screen.getByTestId('icon-lock')).toBeInTheDocument();
    expect(screen.getByText(/השלם רוץ מרתון מלא כדי לפתוח/)).toBeInTheDocument();
  });

  // Test 2: Component renders in small mode correctly
  test('renders small badge correctly', () => {
    render(<AchievementBadge achievement={sampleAchievement} isSmall={true} />);
    
    const badgeElement = screen.getByRole('button');
    expect(badgeElement).toHaveClass('smallBadge');
    expect(screen.getByText('ריצת מרתון')).toBeInTheDocument();
    // Description shouldn't be visible in small mode
    expect(screen.queryByText('רוץ מרתון מלא')).not.toBeInTheDocument();
  });

  // Test 3: onClick handler is called when badge is clicked
  test('calls onClick handler when badge is clicked', () => {
    const mockOnClick = jest.fn();
    render(<AchievementBadge achievement={sampleAchievement} onClick={mockOnClick} />);
    
    const badgeElement = screen.getByRole('button');
    fireEvent.click(badgeElement);
    expect(mockOnClick).toHaveBeenCalledWith(sampleAchievement);
  });

  // Test 4: Component renders correct icon based on category
  test('renders correct icon based on achievement category', () => {
    // Test with workout category
    const workoutAchievement = { ...sampleAchievement, category: 'workout' };
    const { rerender } = render(<AchievementBadge achievement={workoutAchievement} />);
    expect(screen.getByTestId('icon-dumbbell')).toBeInTheDocument();
    
    // Test with challenge category
    const challengeAchievement = { ...sampleAchievement, category: 'challenge' };
    rerender(<AchievementBadge achievement={challengeAchievement} />);
    expect(screen.getByTestId('icon-trophy')).toBeInTheDocument();
    
    // Test with streak category
    const streakAchievement = { ...sampleAchievement, category: 'streak' };
    rerender(<AchievementBadge achievement={streakAchievement} />);
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument();
  });

  // Test 5: Animation class is applied and removed after timeout
  test('applies and removes animation class based on showAnimation prop', async () => {
    jest.useFakeTimers();
    
    render(<AchievementBadge achievement={sampleAchievement} showAnimation={true} />);
    
    const badgeElement = screen.getByRole('button');
    expect(badgeElement).toHaveClass('animateShimmer');
    
    // Fast-forward time
    jest.advanceTimersByTime(3000);
    
    // Animation should be removed after timeout
    await waitFor(() => {
      expect(badgeElement).not.toHaveClass('animateShimmer');
    });
    
    jest.useRealTimers();
  });
});