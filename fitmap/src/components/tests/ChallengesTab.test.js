import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChallengesTab from '../user/Profile/ChallengesTab';


// Mock the UserProgressBar component
jest.mock('../challenges/UserProgressBar', () => {
  return function MockUserProgressBar({ currentValue, targetValue, metric }) {
    return (
      <div data-testid="progress-bar">
        Progress: {currentValue}/{targetValue} {metric}
      </div>
    );
  };
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaCalendarAlt: () => <div data-testid="calendar-icon">📅</div>,
  FaTrophy: () => <div data-testid="trophy-icon">🏆</div>,
  FaRunning: () => <div data-testid="running-icon">🏃</div>,
  FaCalendar: () => <div data-testid="calendar-alt-icon">📅</div>,
  FaStar: () => <div data-testid="star-icon">⭐</div>,
  FaDumbbell: () => <div data-testid="dumbbell-icon">🏋️</div>,
}));

// Mock CSS modules
jest.mock('./Profile.module.css', () => ({
  challengesContent: 'challengesContent',
  sectionHeaderWithAction: 'sectionHeaderWithAction',
  sectionTitle: 'sectionTitle',
  emptyState: 'emptyState',
  primaryButton: 'primaryButton',
  challengesList: 'challengesList',
  challengeItem: 'challengeItem',
  challengeHeader: 'challengeHeader',
  challengeTitleWrapper: 'challengeTitleWrapper',
  challengeIcon: 'challengeIcon',
  challengeTitle: 'challengeTitle',
  viewDetailsButton: 'viewDetailsButton',
  challengeDescription: 'challengeDescription',
  progressSection: 'progressSection',
  challengeDates: 'challengeDates',
  startDate: 'startDate',
  endDate: 'endDate',
  dateIcon: 'dateIcon',
  rewardPoints: 'rewardPoints',
  rewardIcon: 'rewardIcon',
  loadingData: 'loadingData',
  loadingSpinner: 'loadingSpinner'
}));

describe('ChallengesTab Component', () => {
  const mockNavigate = jest.fn();
  const mockFormatDateHebrew = jest.fn((date) => `Hebrew: ${date}`);

  const sampleChallenges = [
    {
      id: 1,
      name: 'אתגר ריצה',
      description: 'רוץ 10 קילומטרים',
      current_value: '5',
      target_value: '10',
      metric: 'km',
      icon: 'running',
      reward_points: 100,
      start_date: '2023-01-01',
      end_date: '2023-12-31'
    },
    {
      id: 2,
      name: 'אתגר כושר',
      description: 'אימונים יומיים',
      current_value: '15',
      target_value: '30',
      metric: 'workouts',
      icon: 'dumbbell',
      reward_points: 200
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Unit Test 2: Empty State Display
  test('displays empty state when no challenges are provided', () => {
    render(
      <ChallengesTab
        challenges={[]}
        loading={false}
        navigate={mockNavigate}
        formatDateHebrew={mockFormatDateHebrew}
      />
    );

    expect(screen.getByText('אינך משתתף באתגרים כרגע')).toBeInTheDocument();
    expect(screen.getByText('הצטרף לאתגר')).toBeInTheDocument();
  });

  // Unit Test 3: Challenge Data Processing
  test('processes challenge data correctly with numeric conversion', async () => {
    render(
      <ChallengesTab
        challenges={sampleChallenges}
        loading={false}
        navigate={mockNavigate}
        formatDateHebrew={mockFormatDateHebrew}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('אתגר ריצה')).toBeInTheDocument();
      expect(screen.getByText('אתגר כושר')).toBeInTheDocument();
    });

    // Check if progress bars are rendered with correct values
    const progressBars = screen.getAllByTestId('progress-bar');
    expect(progressBars).toHaveLength(2);
    expect(progressBars[0]).toHaveTextContent('Progress: 5/10 km');
    expect(progressBars[1]).toHaveTextContent('Progress: 15/30 workouts');
  });

  // Integration Test 1: Navigation Functionality
  test('navigates correctly when buttons are clicked', async () => {
    render(
      <ChallengesTab
        challenges={sampleChallenges}
        loading={false}
        navigate={mockNavigate}
        formatDateHebrew={mockFormatDateHebrew}
      />
    );

    await waitFor(() => {
      const viewDetailsButtons = screen.getAllByText('צפה בפרטים');
      expect(viewDetailsButtons).toHaveLength(2);
    });

    // Click on first challenge's view details button
    const firstViewButton = screen.getAllByText('צפה בפרטים')[0];
    fireEvent.click(firstViewButton);

    expect(mockNavigate).toHaveBeenCalledWith('/challenges/1');
  });

  // Integration Test 2: Complete Challenge Display with All Features
  test('displays complete challenge information including dates and rewards', async () => {
    render(
      <ChallengesTab
        challenges={sampleChallenges}
        loading={false}
        navigate={mockNavigate}
        formatDateHebrew={mockFormatDateHebrew}
      />
    );

    await waitFor(() => {
      // Check challenge names
      expect(screen.getByText('אתגר ריצה')).toBeInTheDocument();
      expect(screen.getByText('אתגר כושר')).toBeInTheDocument();

      // Check descriptions
      expect(screen.getByText('רוץ 10 קילומטרים')).toBeInTheDocument();
      expect(screen.getByText('אימונים יומיים')).toBeInTheDocument();

      // Check reward points
      expect(screen.getByText('100 נקודות')).toBeInTheDocument();
      expect(screen.getByText('200 נקודות')).toBeInTheDocument();

      // Check date formatting is called
      expect(mockFormatDateHebrew).toHaveBeenCalledWith('2023-01-01');
      expect(mockFormatDateHebrew).toHaveBeenCalledWith('2023-12-31');

      // Check icons are rendered
      expect(screen.getByTestId('running-icon')).toBeInTheDocument();
      expect(screen.getByTestId('dumbbell-icon')).toBeInTheDocument();

      // Check trophy icons for rewards
      const trophyIcons = screen.getAllByTestId('trophy-icon');
      expect(trophyIcons.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// Additional test helper for mocking the loading spinner
const LoadingSpinner = () => <div data-testid="loading-spinner" className="spinner" />;
