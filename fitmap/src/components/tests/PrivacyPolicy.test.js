import React from 'react';
import { render, screen } from '@testing-library/react';
import PrivacyPolicy from '../legal/PrivacyPolicy';

// Mock window.scrollTo
const mockScrollTo = jest.fn();
window.scrollTo = mockScrollTo;

describe('PrivacyPolicy', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset document.title
    document.title = '';
  });

  test('renders main title', () => {
    render(<PrivacyPolicy />);
    expect(screen.getByText('מדיניות הפרטיות')).toBeInTheDocument();
  });

  test('sets document title on mount', () => {
    render(<PrivacyPolicy />);
    expect(document.title).toBe('מדיניות פרטיות | מתקני כושר עירוניים');
  });

  test('scrolls to top on mount', () => {
    render(<PrivacyPolicy />);
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  test('renders all main sections', () => {
    render(<PrivacyPolicy />);
    
    // Check main section headings
    expect(screen.getByText('1. המידע שאנו אוספים')).toBeInTheDocument();
    expect(screen.getByText('2. כיצד אנו משתמשים במידע')).toBeInTheDocument();
    expect(screen.getByText('3. שיתוף מידע')).toBeInTheDocument();
    expect(screen.getByText('4. עוגיות וטכנולוגיות מעקב')).toBeInTheDocument();
    expect(screen.getByText('5. אבטחת מידע')).toBeInTheDocument();
    expect(screen.getByText('6. שמירת מידע')).toBeInTheDocument();
    expect(screen.getByText('7. הזכויות שלך')).toBeInTheDocument();
    expect(screen.getByText('8. העברות נתונים בינלאומיות')).toBeInTheDocument();
    expect(screen.getByText('9. ילדים ופרטיות')).toBeInTheDocument();
    expect(screen.getByText('10. שינויים במדיניות הפרטיות')).toBeInTheDocument();
    expect(screen.getByText('11. יצירת קשר')).toBeInTheDocument();
  });

  test('renders contact information', () => {
    render(<PrivacyPolicy />);
    
    expect(screen.getByText('שם החברה:FitMap')).toBeInTheDocument();
    expect(screen.getByText('כתובת:סמי שמעון באר שבע')).toBeInTheDocument();
    expect(screen.getByText('טלפון: 0528985233')).toBeInTheDocument();
    expect(screen.getByText('דוא"ל:')).toBeInTheDocument();
    expect(screen.getByText('Fitmapinfo@gmail.com')).toBeInTheDocument();
  });

  test('renders acceptance message', () => {
    render(<PrivacyPolicy />);
    
    expect(screen.getByText(/המשך השימוש באתר מהווה הסכמה למדיניות הפרטיות המפורטת לעיל/)).toBeInTheDocument();
  });

  test('renders last updated date', () => {
    render(<PrivacyPolicy />);
    
    expect(screen.getByText(/עודכן לאחרונה: 18 באפריל, 2025/)).toBeInTheDocument();
  });

  test('renders introduction section', () => {
    render(<PrivacyPolicy />);
    
    expect(screen.getByText(/ב-"מתקני כושר עירוניים" אנו מחויבים להגן על פרטיותך/)).toBeInTheDocument();
    expect(screen.getByText(/אנא קרא בעיון את מדיניות הפרטיות שלנו/)).toBeInTheDocument();
  });
}); 