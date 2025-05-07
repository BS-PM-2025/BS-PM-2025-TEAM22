import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FacilityHeader from '../map/facility-details/FacilityHeader';

// Mock the ImageGallery component since we don't need to test its internal functionality
jest.mock('../map/facility-details/ImageGallery', () => {
  return function MockImageGallery({ images, name }) {
    return <div data-testid="mock-image-gallery">{name} - {images?.length || 0} images</div>;
  };
});

describe('FacilityHeader', () => {
  const mockProps = {
    name: 'Test Gym',
    images: ['image1.jpg', 'image2.jpg'],
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render facility name', () => {
    render(<FacilityHeader {...mockProps} />);
    expect(screen.getByText('Test Gym')).toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<FacilityHeader {...mockProps} />);
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveTextContent('×');
  });

  it('should call onClose when close button is clicked', () => {
    render(<FacilityHeader {...mockProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should render ImageGallery with correct props', () => {
    render(<FacilityHeader {...mockProps} />);
    const imageGallery = screen.getByTestId('mock-image-gallery');
    expect(imageGallery).toHaveTextContent('Test Gym - 2 images');
  });

  it('should handle empty images array', () => {
    render(<FacilityHeader {...mockProps} images={[]} />);
    const imageGallery = screen.getByTestId('mock-image-gallery');
    expect(imageGallery).toHaveTextContent('Test Gym - 0 images');
  });

  it('should handle null images', () => {
    render(<FacilityHeader {...mockProps} images={null} />);
    const imageGallery = screen.getByTestId('mock-image-gallery');
    expect(imageGallery).toHaveTextContent('Test Gym - 0 images');
  });
}); 