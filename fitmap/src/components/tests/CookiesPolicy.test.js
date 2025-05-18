import React from 'react';
import { render, screen } from '@testing-library/react';
import CookiesPolicy from '../legal/CookiesPolicy';

// Mock window.scrollTo
const mockScrollTo = jest.fn();
window.scrollTo = mockScrollTo;

describe('CookiesPolicy', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset document.title
    document.title = '';
  });

  test('renders main title', () => {
    render(<CookiesPolicy />);
    expect(screen.getByText('מדיניות עוגיות')).toBeInTheDocument();
  });

  test('sets document title on mount', () => {
    render(<CookiesPolicy />);
    expect(document.title).toBe('מדיניות עוגיות | מתקני כושר עירוניים');
  });

  test('scrolls to top on mount', () => {
    render(<CookiesPolicy />);
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  test('renders all main sections', () => {
    render(<CookiesPolicy />);
    
    // Check main section headings
    expect(screen.getByText('1. מהן עוגיות?')).toBeInTheDocument();
    expect(screen.getByText('2. סוגי העוגיות שאנו משתמשים בהן')).toBeInTheDocument();
    expect(screen.getByText('3. למה אנחנו משתמשים בעוגיות')).toBeInTheDocument();
    expect(screen.getByText('4. ניהול העדפות העוגיות שלך')).toBeInTheDocument();
    expect(screen.getByText('6. עדכונים למדיניות העוגיות')).toBeInTheDocument();
    expect(screen.getByText('7. יצירת קשר')).toBeInTheDocument();
  });

  test('renders contact information', () => {
    render(<CookiesPolicy />);
    
    expect(screen.getByText('שם החברה:FitMap')).toBeInTheDocument();
    expect(screen.getByText('כתובת:מכללת סמי שמעון באר שבע')).toBeInTheDocument();
    expect(screen.getByText('טלפון: 0528985233')).toBeInTheDocument();
  });

  test('renders acceptance message', () => {
    render(<CookiesPolicy />);
    
    expect(screen.getByText(/המשך השימוש באתר מהווה הסכמה למדיניות העוגיות המפורטת לעיל/)).toBeInTheDocument();
  });
}); 