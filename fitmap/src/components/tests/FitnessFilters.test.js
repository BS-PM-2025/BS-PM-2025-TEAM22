import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FitnessFilters from '../map/FitnessFilters';

describe('FitnessFilters', () => {
  const mockOnFiltersChange = jest.fn();
  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
    initialFilters: {
      types: [],
      equipment: [],
      features: [],
      distance: 10
    }
  };

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  test('renders filter panel with title', () => {
    render(<FitnessFilters {...defaultProps} />);
    expect(screen.getByText('סינון מתקני כושר')).toBeInTheDocument();
  });

  test('renders all filter sections', () => {
    render(<FitnessFilters {...defaultProps} />);
    
    // Check section titles
    expect(screen.getByText('סוג מתקן')).toBeInTheDocument();
    expect(screen.getByText('ציוד')).toBeInTheDocument();
    expect(screen.getByText('מאפיינים')).toBeInTheDocument();
    expect(screen.getByText('מרחק מהמיקום הנוכחי')).toBeInTheDocument();
  });

  test('distance slider has correct default value', () => {
    render(<FitnessFilters {...defaultProps} />);
    const distanceSlider = screen.getByRole('slider');
    expect(distanceSlider).toHaveValue('10');
  });

  test('calls onFiltersChange when distance is changed', () => {
    render(<FitnessFilters {...defaultProps} />);
    const distanceSlider = screen.getByRole('slider');
    
    fireEvent.change(distanceSlider, { target: { value: '20' } });
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      types: [],
      equipment: [],
      features: [],
      distance: 20
    });
  });

  test('handles facility type selection', () => {
    render(<FitnessFilters {...defaultProps} />);
    const gymCheckbox = screen.getByRole('checkbox', { name: /חדרי כושר/i });
    
    fireEvent.click(gymCheckbox);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      types: ['gym'],
      equipment: [],
      features: [],
      distance: 10
    });
  });

  test('handles equipment selection', () => {
    render(<FitnessFilters {...defaultProps} />);
    
    // Expand equipment category
    const strengthCategory = screen.getByText('כוח גופני');
    fireEvent.click(strengthCategory);
    
    // Select equipment
    const pullupBars = screen.getByRole('checkbox', { name: /מתח/i });
    fireEvent.click(pullupBars);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      types: [],
      equipment: ['pullup_bars'],
      features: [],
      distance: 10
    });
  });

  test('handles feature selection', () => {
    render(<FitnessFilters {...defaultProps} />);
    
    // Expand features category
    const amenitiesCategory = screen.getByText('שירותים');
    fireEvent.click(amenitiesCategory);
    
    // Select feature
    const restrooms = screen.getByRole('checkbox', { name: /שירותים/i });
    fireEvent.click(restrooms);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      types: [],
      equipment: [],
      features: ['restrooms'],
      distance: 10
    });
  });

  test('resets all filters when reset button is clicked', () => {
    const initialFilters = {
      types: ['gym'],
      equipment: ['pullup_bars'],
      features: ['restrooms'],
      distance: 20
    };
    
    render(<FitnessFilters {...defaultProps} initialFilters={initialFilters} />);
    
    const resetButton = screen.getByText(/נקה את כל הפילטרים/);
    fireEvent.click(resetButton);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      types: [],
      equipment: [],
      features: [],
      distance: 10
    });
  });

  test('filters facility types based on search query', () => {
    render(<FitnessFilters {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('🔍 חפש סוג מתקן...');
    fireEvent.change(searchInput, { target: { value: 'כושר' } });
    
    expect(screen.getByText(/חדרי כושר/)).toBeInTheDocument();
    expect(screen.queryByText(/ספא ועיסוי/)).not.toBeInTheDocument();
  });
}); 