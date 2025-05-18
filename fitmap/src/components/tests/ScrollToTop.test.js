import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScrollToTop from '../ScrollToTop';

// Mock window.scrollTo
const mockScrollTo = jest.fn();
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true
});

// Mock window.scrollY
Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ScrollToTop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollY = 0;
  });

  test('scrolls to top on mount', () => {
    renderWithRouter(<ScrollToTop />);
    expect(mockScrollTo).toHaveBeenCalledWith(0, 0);
  });

  test('does not show button initially', () => {
    renderWithRouter(<ScrollToTop />);
    expect(screen.queryByTitle('גלול לראש העמוד')).not.toBeInTheDocument();
  });

  test('shows button when scrolled down', () => {
    renderWithRouter(<ScrollToTop />);
    
    // Simulate scroll down
    window.scrollY = 400;
    fireEvent.scroll(window);
    
    expect(screen.getByTitle('גלול לראש העמוד')).toBeInTheDocument();
  });

  test('hides button when scrolled back up', () => {
    renderWithRouter(<ScrollToTop />);
    
    // First scroll down
    window.scrollY = 400;
    fireEvent.scroll(window);
    expect(screen.getByTitle('גלול לראש העמוד')).toBeInTheDocument();
    
    // Then scroll back up
    window.scrollY = 100;
    fireEvent.scroll(window);
    expect(screen.queryByTitle('גלול לראש העמוד')).not.toBeInTheDocument();
  });

  test('scrolls to top smoothly when button is clicked', () => {
    renderWithRouter(<ScrollToTop />);
    
    // Show the button first
    window.scrollY = 400;
    fireEvent.scroll(window);
    
    // Click the button
    fireEvent.click(screen.getByTitle('גלול לראש העמוד'));
    
    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth'
    });
  });

  test('button has correct accessibility attributes', () => {
    renderWithRouter(<ScrollToTop />);
    
    // Show the button first
    window.scrollY = 400;
    fireEvent.scroll(window);
    
    const button = screen.getByTitle('גלול לראש העמוד');
    expect(button).toHaveAttribute('aria-label', 'גלול לראש העמוד');
    expect(button).toHaveAttribute('title', 'גלול לראש העמוד');
  });

  test('cleans up scroll event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderWithRouter(<ScrollToTop />);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  test('button has correct styling classes', () => {
    renderWithRouter(<ScrollToTop />);
    
    // Show the button first
    window.scrollY = 400;
    fireEvent.scroll(window);
    
    const button = screen.getByTitle('גלול לראש העמוד');
    expect(button).toHaveClass('scrollTopButton');
  });

  test('handles scroll threshold correctly', () => {
    renderWithRouter(<ScrollToTop />);
    
    // Scroll just below threshold
    window.scrollY = 299;
    fireEvent.scroll(window);
    expect(screen.queryByTitle('גלול לראש העמוד')).not.toBeInTheDocument();
    
    // Scroll just above threshold
    window.scrollY = 301;
    fireEvent.scroll(window);
    expect(screen.getByTitle('גלול לראש העמוד')).toBeInTheDocument();
  });
}); 