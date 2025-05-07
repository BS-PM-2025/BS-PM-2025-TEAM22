import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageGallery from '../map/facility-details/ImageGallery';

describe('ImageGallery', () => {
  const mockImages = [
    'image1.jpg',
    'image2.jpg',
    'image3.jpg'
  ];

  it('should return null when no images provided', () => {
    const { container } = render(<ImageGallery name="Test Facility" />);
    expect(container.firstChild).toBeNull();
  });

  it('should return null when empty images array provided', () => {
    const { container } = render(<ImageGallery images={[]} name="Test Facility" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render single image without navigation when only one image provided', () => {
    render(<ImageGallery images={['image1.jpg']} name="Test Facility" />);
    
    // Image should be present
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'image1.jpg');
    expect(image).toHaveAttribute('alt', 'Test Facility');

    // Navigation buttons should not be present
    expect(screen.queryByLabelText('תמונה קודמת')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('תמונה הבאה')).not.toBeInTheDocument();
  });

  it('should render gallery with navigation when multiple images provided', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    // Image should be present
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'image1.jpg');
    
    // Navigation buttons should be present
    expect(screen.getByLabelText('תמונה קודמת')).toBeInTheDocument();
    expect(screen.getByLabelText('תמונה הבאה')).toBeInTheDocument();
    
    // Pagination dots should be present
    mockImages.forEach((_, index) => {
      expect(screen.getByLabelText(`עבור לתמונה ${index + 1}`)).toBeInTheDocument();
    });
  });

  it('should navigate to next image when next button clicked', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    const nextButton = screen.getByLabelText('תמונה הבאה');
    fireEvent.click(nextButton);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'image2.jpg');
    expect(image).toHaveAttribute('alt', 'Test Facility - תמונה 2');
  });

  it('should navigate to previous image when previous button clicked', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    const prevButton = screen.getByLabelText('תמונה קודמת');
    fireEvent.click(prevButton);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'image3.jpg');
    expect(image).toHaveAttribute('alt', 'Test Facility - תמונה 3');
  });

  it('should navigate to specific image when pagination dot clicked', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    const thirdImageDot = screen.getByLabelText('עבור לתמונה 3');
    fireEvent.click(thirdImageDot);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'image3.jpg');
    expect(image).toHaveAttribute('alt', 'Test Facility - תמונה 3');
  });

  it('should mark current pagination dot as active', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    const firstDot = screen.getByLabelText('עבור לתמונה 1');
    expect(firstDot).toHaveAttribute('aria-current', 'true');
    
    const thirdDot = screen.getByLabelText('עבור לתמונה 3');
    fireEvent.click(thirdDot);
    expect(thirdDot).toHaveAttribute('aria-current', 'true');
    expect(firstDot).not.toHaveAttribute('aria-current', 'true');
  });
}); 