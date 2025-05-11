// src/components/challenges/ChallengeCard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChallengeCard from '../challenges/ChallengeCard';

// Mock the styles import
jest.mock('./styles/ChallengeCard.module.css', () => ({
  card: 'card',
  activeChallenge: 'activeChallenge',
  completedChallenge: 'completedChallenge',
  futureChallenge: 'futureChallenge',
  completedByUserChallenge: 'completedByUserChallenge',
  expandedProgress: 'expandedProgress',
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
  }

  observe(element) {
    this.elements.add(element);
    // Simulate an intersection right away for testing purposes
    this.callback([{
      isIntersecting: true,
      target: element
    }]);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }
}

// Setup the mock before all tests
beforeAll(() => {
  global.IntersectionObserver = MockIntersectionObserver;
});

// Sample challenge data for testing
const mockActiveChallenge = {
  id: '123',
  title: 'אתגר ריצה חודשי',
  description: 'רוץ 100 ק"מ במהלך החודש',
  start_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days in future
  target_value: 100,
  metric: 'km',
  participants_count: 150,
  reward: 'תג כסף וירטואלי',
  image_url: 'https://example.com/challenge.jpg',
};

const mockFutureChallenge = {
  ...mockActiveChallenge,
  id: '456',
  start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days in future
  end_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days in future
};

const mockCompletedChallenge = {
  ...mockActiveChallenge,
  id: '789',
  start_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
  end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
};

const mockUserProgress = {
  hasJoined: true,
  current_value: 50, // 50% progress
};

const mockCompletedUserProgress = {
  hasJoined: true,
  current_value: 100, // 100% progress
};

describe('ChallengeCard Component', () => {
  // Test 1: Verify the component renders with active challenge data
  test('renders active challenge card with correct information', () => {
    const onJoin = jest.fn();
    const onViewDetails = jest.fn();
    
    render(
      <ChallengeCard
        challenge={mockActiveChallenge}
        userProgress={null}
        onJoin={onJoin}
        onViewDetails={onViewDetails}
      />
    );
    
    // Check that basic challenge info is displayed
    expect(screen.getByText('אתגר ריצה חודשי')).toBeInTheDocument();
    expect(screen.getByText(/רוץ 100 ק"מ במהלך החודש/)).toBeInTheDocument();
    expect(screen.getByText('150 משתתפים')).toBeInTheDocument();
    expect(screen.getByText(/פעיל/)).toBeInTheDocument();
    expect(screen.getByText(/נותרו \d+ ימים/)).toBeInTheDocument();
    
    // Check that the join button is present
    const joinButton = screen.getByText(/הצטרף לאתגר/);
    expect(joinButton).toBeInTheDocument();
  });

  // Test 2: Test join button functionality
  test('calls onJoin when join button is clicked', async () => {
    const onJoin = jest.fn();
    const onViewDetails = jest.fn();
    
    render(
      <ChallengeCard
        challenge={mockActiveChallenge}
        userProgress={null}
        onJoin={onJoin}
        onViewDetails={onViewDetails}
      />
    );
    
    const joinButton = screen.getByText(/הצטרף לאתגר/).closest('button');
    fireEvent.click(joinButton);
    
    await waitFor(() => {
      expect(onJoin).toHaveBeenCalledWith('123');
    });
  });

  // Test 3: Test click on card calls view details function
  test('calls onViewDetails when card is clicked', () => {
    const onJoin = jest.fn();
    const onViewDetails = jest.fn();
    
    render(
      <ChallengeCard
        challenge={mockActiveChallenge}
        userProgress={null}
        onJoin={onJoin}
        onViewDetails={onViewDetails}
      />
    );
    
    const card = screen.getByText('אתגר ריצה חודשי').closest('.card');
    fireEvent.click(card);
    
    expect(onViewDetails).toHaveBeenCalled();
  });
  
  // Test 5: Test future challenge rendering
  test('renders future challenge with correct status and disabled join button', () => {
    const onJoin = jest.fn();
    const onViewDetails = jest.fn();
    
    render(
      <ChallengeCard
        challenge={mockFutureChallenge}
        userProgress={null}
        onJoin={onJoin}
        onViewDetails={onViewDetails}
      />
    );
    
    // Should show future badge
    expect(screen.getByText(/מתחיל בעוד \d+ ימים/)).toBeInTheDocument();
    
    // Join button should be disabled and show "בקרוב"
    const joinButton = screen.getByText(/בקרוב/).closest('button');
    expect(joinButton).toBeInTheDocument();
    expect(joinButton).toBeDisabled();
  });

  // Test 6: Test completed challenge rendering
  test('renders completed challenge with correct status and no join button', () => {
    const onViewDetails = jest.fn();
    
    render(
      <ChallengeCard
        challenge={mockCompletedChallenge}
        userProgress={null}
        onViewDetails={onViewDetails}
      />
    );
    
    // Should show completed badge
    expect(screen.getByText(/הסתיים/)).toBeInTheDocument();
    
    // Join button should not be present for completed challenges
    expect(screen.queryByText(/הצטרף לאתגר/)).not.toBeInTheDocument();
    expect(screen.queryByText(/בקרוב/)).not.toBeInTheDocument();
  });
});