import React from 'react';
import { render, screen } from '@testing-library/react';
import TermsOfService from '../legal/TermsOfService';

// Mock window.scrollTo
const mockScrollTo = jest.fn();
window.scrollTo = mockScrollTo;

describe('TermsOfService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset document.title
    document.title = '';
  });

  test('renders main title', () => {
    render(<TermsOfService />);
    expect(screen.getByText('תנאי השימוש באתר')).toBeInTheDocument();
  });

  test('sets document title on mount', () => {
    render(<TermsOfService />);
    expect(document.title).toBe('תנאי שימוש | מתקני כושר עירוניים');
  });

  test('scrolls to top on mount', () => {
    render(<TermsOfService />);
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  test('renders all main sections', () => {
    render(<TermsOfService />);
    
    // Check main section headings
    expect(screen.getByText('1. הקדמה')).toBeInTheDocument();
    expect(screen.getByText('2. הגדרות')).toBeInTheDocument();
    expect(screen.getByText('3. הרשמה וחשבון משתמש')).toBeInTheDocument();
    expect(screen.getByText('4. כללי התנהגות באתר')).toBeInTheDocument();
    expect(screen.getByText('5. קניין רוחני')).toBeInTheDocument();
    expect(screen.getByText('6. מידע שמועלה על ידי משתמשים')).toBeInTheDocument();
    expect(screen.getByText('7. הגבלת אחריות')).toBeInTheDocument();
    expect(screen.getByText('8. שיפוי')).toBeInTheDocument();
    expect(screen.getByText('9. קישורים לאתרים חיצוניים')).toBeInTheDocument();
    expect(screen.getByText('10. שינויים בתנאי השימוש')).toBeInTheDocument();
    expect(screen.getByText('11. סמכות שיפוט וברירת דין')).toBeInTheDocument();
    expect(screen.getByText('12. כללי')).toBeInTheDocument();
    expect(screen.getByText('13. יצירת קשר')).toBeInTheDocument();
  });

  test('renders contact information', () => {
    render(<TermsOfService />);
    
    expect(screen.getByText('דוא"ל:')).toBeInTheDocument();
    expect(screen.getByText('Fitmapinfo@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('טלפון: 0528985233')).toBeInTheDocument();
    expect(screen.getByText('כתובת:מכללת סמי שמעון באר שבע')).toBeInTheDocument();
  });

  test('renders acceptance message', () => {
    render(<TermsOfService />);
    
    expect(screen.getByText(/המשך השימוש באתר מהווה הסכמה לתנאי השימוש המפורטים לעיל/)).toBeInTheDocument();
  });

  test('renders last updated date', () => {
    render(<TermsOfService />);
    
    expect(screen.getByText(/עודכן לאחרונה: 18 באפריל, 2025/)).toBeInTheDocument();
  });

  test('renders introduction section', () => {
    render(<TermsOfService />);
    
    expect(screen.getByText(/ברוכים הבאים לאתר "מתקני כושר עירוניים"/)).toBeInTheDocument();
    expect(screen.getByText(/השימוש באתר ובשירותים הניתנים בו כפוף לתנאי השימוש המפורטים במסמך זה/)).toBeInTheDocument();
  });

  test('renders warning box', () => {
    render(<TermsOfService />);
    
    expect(screen.getByText(/שים לב:/)).toBeInTheDocument();
    expect(screen.getByText(/האימון הגופני במתקני כושר עירוניים כרוך בסיכונים אפשריים/)).toBeInTheDocument();
  });

  test('renders definitions list', () => {
    render(<TermsOfService />);
    
    expect(screen.getByText('"האתר"')).toBeInTheDocument();
    expect(screen.getByText('"משתמש"')).toBeInTheDocument();
    expect(screen.getByText('"תוכן"')).toBeInTheDocument();
  });
}); 