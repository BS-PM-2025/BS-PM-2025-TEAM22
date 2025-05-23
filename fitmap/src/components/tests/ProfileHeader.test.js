import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileHeader from '../user/Profile/ProfileHeader';

// Mock the CSS modules
jest.mock('./Profile.module.css', () => ({
  profileHeader: 'profileHeader',
  profileImageContainer: 'profileImageContainer',
  profileImage: 'profileImage',
  profileImagePlaceholder: 'profileImagePlaceholder',
  profileInfo: 'profileInfo',
  profileName: 'profileName',
  fitnessLevelBadge: 'fitnessLevelBadge',
  profileDetails: 'profileDetails',
  profileCity: 'profileCity',
  profileJoined: 'profileJoined',
  profileActions: 'profileActions',
  editProfileButton: 'editProfileButton'
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaEdit: () => <span data-testid="edit-icon">Edit</span>,
  FaMapMarkerAlt: () => <span data-testid="location-icon">Location</span>,
  FaCalendarAlt: () => <span data-testid="calendar-icon">Calendar</span>
}));

describe('ProfileHeader Component', () => {
  const mockUser = {
    email: 'test@example.com',
    user_metadata: {
      avatar_url: 'https://example.com/avatar.jpg'
    }
  };

  const mockUserProfile = {
    created_at: '2023-01-01T00:00:00Z'
  };

  const mockFormatDateHebrew = jest.fn(() => '1 בינואר 2023');
  const mockOnEditProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // UNIT TESTS
  describe('Unit Tests', () => {
    test('renders profile name correctly', () => {
      const profileData = {
        name: 'John Doe',
        avatarUrl: null,
        city: null,
        fitnessLevel: null
      };

      render(
        <ProfileHeader
          profileData={profileData}
          user={mockUser}
          userProfile={mockUserProfile}
          onEditProfile={mockOnEditProfile}
          formatDateHebrew={mockFormatDateHebrew}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('calls onEditProfile when edit button is clicked', () => {
      const profileData = {
        name: 'John Doe',
        avatarUrl: null,
        city: null,
        fitnessLevel: null
      };

      render(
        <ProfileHeader
          profileData={profileData}
          user={mockUser}
          userProfile={mockUserProfile}
          onEditProfile={mockOnEditProfile}
          formatDateHebrew={mockFormatDateHebrew}
        />
      );

      const editButton = screen.getByText('ערוך פרופיל');
      fireEvent.click(editButton);

      expect(mockOnEditProfile).toHaveBeenCalledTimes(1);
    });
  });

  // INTEGRATION TESTS
  describe('Integration Tests', () => {
    test('renders complete profile with all data fields', () => {
      const profileData = {
        name: 'Jane Smith',
        avatarUrl: 'https://example.com/jane.jpg',
        city: 'Tel Aviv',
        fitnessLevel: 'intermediate'
      };

      render(
        <ProfileHeader
          profileData={profileData}
          user={mockUser}
          userProfile={mockUserProfile}
          onEditProfile={mockOnEditProfile}
          formatDateHebrew={mockFormatDateHebrew}
        />
      );

      // Check all components are rendered together
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Tel Aviv')).toBeInTheDocument();
      expect(screen.getByText('בינוני')).toBeInTheDocument();
      expect(screen.getByText('ערוך פרופיל')).toBeInTheDocument();
      expect(mockFormatDateHebrew).toHaveBeenCalled();
    });
})});