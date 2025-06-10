// TabContent.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import TabContent from '../user/Profile/TabContent';
import '@testing-library/jest-dom';

// ---------------
// Mock children
jest.mock('../user/profile/Overview', () => () => <div>Overview Content</div>);
jest.mock('../user/profile/WorkoutsTab', () => () => <div>Workouts Content</div>);
jest.mock('../user/profile/ChallengesTab', () => () => <div>Challenges Content</div>);
jest.mock('../user/profile/GroupWorkoutsTab', () => () => <div>Groups Content</div>);
jest.mock('../user/profile/ProfileChatsTab', () => () => <div>Chats Content</div>);
// ---------------

const baseProps = {
  userData: {
    challenges: ['a'],
    workoutHistory: ['a'],
    groupWorkouts: ['a'],
    chats: ['a'],
    loading: false
  },
  profileData: {},
  user: {},
  formatDateHebrew: () => '',
  navigate: jest.fn(),
  refreshUserData: jest.fn()
};

describe('TabContent', () => {
  // ✅ Unit Test 1
  test('renders fallback message for unknown tab', () => {
    render(<TabContent {...baseProps} activeTab="unknown" />);
    expect(screen.getByText('תוכן לא זמין')).toBeInTheDocument();
  });

  // ✅ Unit Test 2
  test('renders Overview tab content', () => {
    render(<TabContent {...baseProps} activeTab="overview" />);
    expect(screen.getByText('Overview Content')).toBeInTheDocument();
  });

  // ✅ Unit Test 3
  test('renders Chats tab content', () => {
    render(<TabContent {...baseProps} activeTab="chats" />);
    expect(screen.getByText('Chats Content')).toBeInTheDocument();
  });

  // ✅ Integration Test 1
  test('passes correct props to WorkoutsTab', () => {
    render(<TabContent {...baseProps} activeTab="workouts" />);
    expect(screen.getByText('Workouts Content')).toBeInTheDocument();
  });

  // ✅ Integration Test 2
  test('passes correct props to ChallengesTab', () => {
    render(<TabContent {...baseProps} activeTab="challenges" />);
    expect(screen.getByText('Challenges Content')).toBeInTheDocument();
  });
});
