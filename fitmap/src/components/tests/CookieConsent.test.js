import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CookieConsent from '../Cookie/CookieConsent';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock setTimeout
jest.useFakeTimers();

describe('CookieConsent', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('does not render initially when consent is already given', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    render(<CookieConsent />);
    expect(screen.queryByText('אנחנו משתמשים בעוגיות')).not.toBeInTheDocument();
  });

  test('shows consent banner after delay when no consent is given', () => {
    render(<CookieConsent />);
    
    // Initially not visible
    expect(screen.queryByText('אנחנו משתמשים בעוגיות')).not.toBeInTheDocument();
    
    // Fast-forward timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Should be visible after delay
    expect(screen.getByText('אנחנו משתמשים בעוגיות')).toBeInTheDocument();
  });

  test('accepts cookies when accept button is clicked', () => {
    render(<CookieConsent />);
    
    // Fast-forward timer to show the banner
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Click accept button
    fireEvent.click(screen.getByText('אני מסכים/ה'));
    
    // Check localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('cookieConsent', 'accepted');
    
    // Banner should be hidden
    expect(screen.queryByText('אנחנו משתמשים בעוגיות')).not.toBeInTheDocument();
  });

  test('declines cookies when decline button is clicked', () => {
    render(<CookieConsent />);
    
    // Fast-forward timer to show the banner
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Click decline button
    fireEvent.click(screen.getByText('רק עוגיות חיוניות'));
    
    // Check localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('cookieConsent', 'declined');
    
    // Banner should be hidden
    expect(screen.queryByText('אנחנו משתמשים בעוגיות')).not.toBeInTheDocument();
  });

  test('declines cookies when close button is clicked', () => {
    render(<CookieConsent />);
    
    // Fast-forward timer to show the banner
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Click close button
    fireEvent.click(screen.getByLabelText('סגור'));
    
    // Check localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('cookieConsent', 'declined');
    
    // Banner should be hidden
    expect(screen.queryByText('אנחנו משתמשים בעוגיות')).not.toBeInTheDocument();
  });

  test('renders all required elements when visible', () => {
    render(<CookieConsent />);
    
    // Fast-forward timer to show the banner
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Check main elements
    expect(screen.getByText('אנחנו משתמשים בעוגיות')).toBeInTheDocument();
    expect(screen.getByText(/אתר זה משתמש בעוגיות כדי לשפר את חווית המשתמש שלך/)).toBeInTheDocument();
    expect(screen.getByText('אני מסכים/ה')).toBeInTheDocument();
    expect(screen.getByText('רק עוגיות חיוניות')).toBeInTheDocument();
    expect(screen.getByLabelText('סגור')).toBeInTheDocument();
    expect(screen.getByText('מידע נוסף')).toBeInTheDocument();
  });

  test('cleans up timeout on unmount', () => {
    const { unmount } = render(<CookieConsent />);
    
    // Spy on clearTimeout
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
    
    // Unmount component
    unmount();
    
    // Check if clearTimeout was called
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
}); 