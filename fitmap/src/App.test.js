// App.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from '../src/App';

// Mock all the components to avoid dependency issues
jest.mock('../src/contexts/SocialContext', () => ({
  SocialProvider: ({ children }) => <div data-testid="social-provider">{children}</div>
}));

jest.mock('../src/contexts/OnlineStatusContext', () => ({
  OnlineStatusProvider: ({ children }) => <div data-testid="online-status-provider">{children}</div>
}));

// Mock map-related components
jest.mock('../src/components/map/FitnessMap', () => {
  return function MockFitnessMap() {
    return <div data-testid="fitness-map">Fitness Map</div>;
  };
});

jest.mock('../src/components/map/Navigation/StreetView', () => {
  return function MockStreetView() {
    return <div data-testid="street-view">Street View</div>;
  };
});

jest.mock('../src/components/shared/Navbar', () => {
  return function MockNavbar({ toggleTheme, theme }) {
    return (
      <nav data-testid="navbar">
        <button onClick={toggleTheme} data-testid="theme-toggle">
          Toggle Theme: {theme}
        </button>
      </nav>
    );
  };
});

jest.mock('../src/components/shared/BottomNavbar', () => {
  return function MockBottomNavbar() {
    return <div data-testid="bottom-navbar">Bottom Navbar</div>;
  };
});

jest.mock('../src/components/shared/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

jest.mock('../src/components/shared/LoadingSpinner', () => {
  return function MockLoadingSpinner({ fullScreen, text }) {
    return (
      <div data-testid="loading-spinner" data-fullscreen={fullScreen}>
        {text}
      </div>
    );
  };
});

jest.mock('../src/components/ScrollToTop', () => {
  return function MockScrollToTop() {
    return <div data-testid="scroll-to-top">ScrollToTop</div>;
  };
});

jest.mock('../src/components/legal/CookieConsent', () => {
  return function MockCookieConsent() {
    return <div data-testid="cookie-consent">Cookie Consent</div>;
  };
});

jest.mock('../src/components/auth/RoleSelection', () => {
  return function MockRoleSelection() {
    return <div data-testid="role-selection">Role Selection</div>;
  };
});

jest.mock('../src/components/auth/Auth', () => {
  return function MockAuth() {
    return <div data-testid="auth">Auth Component</div>;
  };
});

jest.mock('../src/components/auth/PendingApproval', () => {
  return function MockPendingApproval() {
    return <div data-testid="pending-approval">Pending Approval</div>;
  };
});

jest.mock('../src/components/shared/About', () => {
  return function MockAbout() {
    return <div data-testid="about">About Page</div>;
  };
});

jest.mock('../src/components/user/Profile/Profile', () => {
  return function MockProfile() {
    return <div data-testid="profile">Profile Page</div>;
  };
});

jest.mock('../src/components/admin/AdminDashboard', () => {
  return function MockAdminDashboard() {
    return <div data-testid="admin-dashboard">Admin Dashboard</div>;
  };
});

// Mock the useAuth hook
const mockUseAuth = {
  user: null,
  userProfile: null,
  loading: false
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Helper function to render App with Router
const renderApp = (initialEntries = ['/']) => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('light');
  });

  // UNIT TESTS
  describe('Unit Tests', () => {
    test('renders main components correctly', () => {
      renderApp();
      
      expect(screen.getByTestId('social-provider')).toBeInTheDocument();
      expect(screen.getByTestId('online-status-provider')).toBeInTheDocument();
      expect(screen.getByTestId('navbar')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navbar')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('cookie-consent')).toBeInTheDocument();
      expect(screen.getByTestId('scroll-to-top')).toBeInTheDocument();
    });

    test('initializes theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      renderApp();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
      expect(screen.getByTestId('theme-toggle')).toHaveTextContent('Toggle Theme: dark');
    });

    test('defaults to light theme when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      renderApp();
      
      expect(screen.getByTestId('theme-toggle')).toHaveTextContent('Toggle Theme: light');
    });

    test('toggles theme correctly', () => {
      renderApp();
      
      const themeToggle = screen.getByTestId('theme-toggle');
      expect(themeToggle).toHaveTextContent('Toggle Theme: light');
      
      fireEvent.click(themeToggle);
      expect(themeToggle).toHaveTextContent('Toggle Theme: dark');
      
      fireEvent.click(themeToggle);
      expect(themeToggle).toHaveTextContent('Toggle Theme: light');
    });

    test('saves theme to localStorage when changed', () => {
      renderApp();
      
      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    test('applies theme class to app container', () => {
      renderApp();
      
      const appContainer = document.querySelector('.app');
      expect(appContainer).toHaveClass('light');
      
      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);
      
      expect(appContainer).toHaveClass('dark');
    });
  });

  // INTEGRATION TESTS
  describe('Integration Tests', () => {
    test('renders role selection page by default', () => {
      renderApp();
      expect(screen.getByTestId('role-selection')).toBeInTheDocument();
    });


  });


  // THEME INTEGRATION TESTS
  describe('Theme Integration Tests', () => {
    test('theme persists across re-renders', () => {
      const { rerender } = renderApp();
      
      // Change theme
      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);
      
      expect(screen.getByTestId('theme-toggle')).toHaveTextContent('Toggle Theme: dark');
      
      // Re-render component
      rerender(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
      
      // Theme should still be dark
      expect(screen.getByTestId('theme-toggle')).toHaveTextContent('Toggle Theme: dark');
    });

    test('theme is applied to document root', () => {
      renderApp();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      
      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});