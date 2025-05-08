import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProgressBar from '../challenges/UserProgressBar';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation((callback) => {
  return {
    observe: jest.fn(() => {
      // Simulate the element coming into view immediately
      callback([{ isIntersecting: true }]);
    }),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  };
});

window.IntersectionObserver = mockIntersectionObserver;

// Mock requestAnimationFrame for testing animation
const originalRAF = window.requestAnimationFrame;
jest.useFakeTimers();

describe('UserProgressBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now() + 1000), 0);
    window.performance.now = jest.fn(() => 0);
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRAF;
  });

  // Test 1: Renders correctly with basic props
  test('renders with correct progress percentage', () => {
    render(<UserProgressBar currentValue={25} targetValue={100} metric="km" />);
    
    // Check that percentage is shown correctly
    expect(screen.getByText('25% הושלמו')).toBeInTheDocument();
    
    // Check for formatted values
    expect(screen.getByText('25 ק"מ')).toBeInTheDocument();
    expect(screen.getByText(/מתוך 100 ק"מ/)).toBeInTheDocument();
    
    // Check progress bar exists with correct attributes
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '25');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  // Test 2: Displays completed state correctly
  test('displays completed state when progress reaches 100%', () => {
    render(<UserProgressBar currentValue={100} targetValue={100} metric="km" />);
    
    // Should show completion message and icon
    expect(screen.getByText('הושלם!')).toBeInTheDocument();
    
    // Check for trophy icon in the completed message section
    expect(screen.getByText('כל הכבוד! השלמת את האתגר 🎉')).toBeInTheDocument();
    
    // The progress bar should have 100% aria value
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
  });

  // Test 3: Renders compact mode correctly
  test('renders compact mode correctly', () => {
    render(<UserProgressBar 
      currentValue={40} 
      targetValue={100} 
      metric="steps" 
      compact={true} 
    />);
    
    // In compact mode, we should see simplified display with "/"
    expect(screen.getByText('40 צעדים')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('100 צעדים')).toBeInTheDocument();
    
    // Should not show expanded details in compact mode
    expect(screen.queryByText(/מתוך/)).not.toBeInTheDocument();
  });

  // Test 4: Toggles expansion when the expand button is clicked
  test('toggles expansion when expand button is clicked', () => {
    const mockToggleHandler = jest.fn();
    
    render(<UserProgressBar 
      currentValue={50} 
      targetValue={100} 
      metric="workouts"
      compact={true}
      onExpandToggle={mockToggleHandler}
    />);
    
    // Find and click the toggle button
    const toggleButton = screen.getByRole('button', { name: /הרחב/i });
    fireEvent.click(toggleButton);
    
    // Handler should be called with "true" to expand
    expect(mockToggleHandler).toHaveBeenCalledWith(true);
  });

  // Test 5: Animates progress when component comes into view
  test('animates progress when component enters viewport', async () => {
    // Initial render with animation
    render(<UserProgressBar 
      currentValue={75} 
      targetValue={100} 
      metric="minutes" 
      animated={true}
    />);
    
    // Run all timers to complete animation
    act(() => {
      jest.runAllTimers();
    });
    
    // After animation completes, should show the actual value
    await waitFor(() => {
      expect(screen.getByText('75 דקות')).toBeInTheDocument();
    });
  });

  // Test 6: Handles different metric formats correctly
  test('formats different metrics correctly', () => {
    const { rerender } = render(
      <UserProgressBar currentValue={100} targetValue={200} metric="calories" />
    );
    expect(screen.getByText('100 קלוריות')).toBeInTheDocument();
    
    // Test a different metric
    rerender(<UserProgressBar currentValue={30} targetValue={60} metric="minutes" />);
    expect(screen.getByText('30 דקות')).toBeInTheDocument();
    
    // Test custom metric
    rerender(<UserProgressBar currentValue={5} targetValue={10} metric="כוסות מים" />);
    expect(screen.getByText('5 כוסות מים')).toBeInTheDocument();
  });

  // Test 7: Returns null with invalid props
  test('returns null with invalid prop values', () => {
    const { container: container1 } = render(
      <UserProgressBar currentValue={null} targetValue={100} metric="km" />
    );
    expect(container1.firstChild).toBeNull();
    
    const { container: container2 } = render(
      <UserProgressBar currentValue={50} targetValue={0} metric="km" />
    );
    expect(container2.firstChild).toBeNull();
    
    const { container: container3 } = render(
      <UserProgressBar currentValue="invalid" targetValue={100} metric="km" />
    );
    expect(container3.firstChild).toBeNull();
  });
});