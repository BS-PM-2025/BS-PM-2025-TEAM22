import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../shared/LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('טוען...')).toBeInTheDocument();
  });

  test('renders with custom text', () => {
    const customText = 'Loading...';
    render(<LoadingSpinner text={customText} />);
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  test('renders in fullscreen mode', () => {
    render(<LoadingSpinner fullScreen={true} />);
    const overlay = document.querySelector('.fullScreenOverlay');
    expect(overlay).toBeInTheDocument();
  });

  test('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    expect(document.querySelector('.small')).toBeInTheDocument();

    rerender(<LoadingSpinner size="medium" />);
    expect(document.querySelector('.medium')).toBeInTheDocument();

    rerender(<LoadingSpinner size="large" />);
    expect(document.querySelector('.large')).toBeInTheDocument();
  });
}); 