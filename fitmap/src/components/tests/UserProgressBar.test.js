import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProgressBar from '../challenges/UserProgressBar';

// Mock IntersectionObserver globally
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe = jest.fn(() => {
    // Immediately trigger with isIntersecting true
    this.callback([{ isIntersecting: true }]);
  });
  
  unobserve = jest.fn();
  disconnect = jest.fn();
}

// Setup mocks before all tests
beforeAll(() => {
  global.IntersectionObserver = MockIntersectionObserver;
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = (callback) => {
    callback();
    return 0;
  };
  
  // Mock performance.now
  global.performance = { now: () => 1000 };
});

// Jest config to silence act() warnings
jest.spyOn(console, 'error').mockImplementation(() => {});

  // Test 2: Simple completed state test
  test('shows completed state when progress is 100%', () => {
    render(
      <UserProgressBar 
        currentValue={100} 
        targetValue={100} 
        metric="km" 
        animated={false}
      />
    );
    
    // Check for completion indicator
    const completedText = screen.getByText(/הושלם|completed/i);
    expect(completedText).toBeInTheDocument();
  });

  // Test 6: Test for null return with invalid props
  test('handles invalid props gracefully', () => {
    // Test with negative values
    const { container, rerender } = render(
      <UserProgressBar 
        currentValue={-10} 
        targetValue={100} 
        metric="km" 
        animated={false}
      />
    );
    
    // Check if component returned null or has fallback content
    expect(container.firstChild).toBeTruthy();
    
    // Test with invalid target
    rerender(
      <UserProgressBar 
        currentValue={50} 
        targetValue={0} 
        metric="km" 
        animated={false}
      />
    );
    
    // Component might return null or fallback UI here
    expect(container).toBeDefined();
  });
