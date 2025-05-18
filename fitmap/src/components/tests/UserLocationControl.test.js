import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserLocationControl from '../map/UserLocationControl';

describe('UserLocationControl', () => {
  test('renders the location button', () => {
    render(<UserLocationControl onCenterOnUser={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('has correct accessibility attributes', () => {
    render(<UserLocationControl onCenterOnUser={() => {}} />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label', 'עבור למיקום הנוכחי');
    expect(button).toHaveAttribute('title', 'המיקום שלי');
  });

  test('calls onCenterOnUser when clicked', () => {
    const mockOnCenterOnUser = jest.fn();
    render(<UserLocationControl onCenterOnUser={mockOnCenterOnUser} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockOnCenterOnUser).toHaveBeenCalledTimes(1);
  });
}); 