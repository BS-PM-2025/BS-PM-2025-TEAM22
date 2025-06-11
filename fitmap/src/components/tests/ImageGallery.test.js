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

  it('should render single image with navigation', () => {
    render(<ImageGallery images={['image1.jpg']} name="Test Facility" />);
    
    // Image should be present
    const images = screen.getAllByRole('img');
    expect(images[0]).toBeInTheDocument();
    expect(images[0]).toHaveAttribute('src', 'image1.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Test Facility - תמונה 1');

    // Navigation buttons should be present
    expect(screen.getByLabelText('הקודם')).toBeInTheDocument();
    expect(screen.getByLabelText('הבא')).toBeInTheDocument();
  });

  it('should render gallery with navigation when multiple images provided', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    // Images should be present
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(mockImages.length);
    expect(images[0]).toHaveAttribute('src', 'image1.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Test Facility - תמונה 1');
    
    // Navigation buttons should be present
    expect(screen.getByLabelText('הקודם')).toBeInTheDocument();
    expect(screen.getByLabelText('הבא')).toBeInTheDocument();
    
    // Pagination dots should be present
    const dots = screen.getAllByRole('button', { name: '' });
    expect(dots).toHaveLength(mockImages.length);
  });

  it('should navigate to next image when next button clicked', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    const nextButton = screen.getByLabelText('הבא');
    fireEvent.click(nextButton);
    
    const images = screen.getAllByRole('img');
    expect(images[1]).toHaveAttribute('src', 'image2.jpg');
    expect(images[1]).toHaveAttribute('alt', 'Test Facility - תמונה 2');
  });

  it('should navigate to previous image when previous button clicked', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    const prevButton = screen.getByLabelText('הקודם');
    fireEvent.click(prevButton);
    
    const images = screen.getAllByRole('img');
    expect(images[2]).toHaveAttribute('src', 'image3.jpg');
    expect(images[2]).toHaveAttribute('alt', 'Test Facility - תמונה 3');
  });

  it('should navigate to specific image when pagination dot clicked', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    const dots = screen.getAllByRole('button', { name: '' });
    fireEvent.click(dots[2]); // Click the third dot
    
    const images = screen.getAllByRole('img');
    expect(images[2]).toHaveAttribute('src', 'image3.jpg');
    expect(images[2]).toHaveAttribute('alt', 'Test Facility - תמונה 3');
  });

  it('should mark current pagination dot as active', () => {
    render(<ImageGallery images={mockImages} name="Test Facility" />);
    
    const dots = screen.getAllByRole('button', { name: '' });
    expect(dots[0]).toHaveClass('active');
    
    fireEvent.click(dots[2]); // Click the third dot
    expect(dots[2]).toHaveClass('active');
    expect(dots[0]).not.toHaveClass('active');
  });

  it('should handle touch events for navigation', () => {
    const { container } = render(<ImageGallery images={mockImages} name="Test Facility" />);
    const slider = container.querySelector('.slider');

    // Simulate swipe right (previous image)
    fireEvent.touchStart(slider, { touches: [{ clientX: 100 }] });
    fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 200 }] });

    // The third dot should now be active (index 2)
    const dots = screen.getAllByRole('button', { name: '' });
    expect(dots[2]).toHaveClass('active');

    // Simulate swipe left (next image)
    fireEvent.touchStart(slider, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 100 }] });

    // The first dot should now be active (index 0)
    expect(dots[0]).toHaveClass('active');
  });
}); 