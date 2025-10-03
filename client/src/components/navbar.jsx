import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, Users, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const profileRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
  };

  return (
    <nav className="border-b border-neutral-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* SuiteGenie Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group" onClick={closeMenu}>
              <img src="/logo[1].png" alt="SuiteGenie Logo" className="w-8 h-8 mr-3 rounded-lg shadow group-hover:shadow-md transition-shadow duration-200" />
              <span className="font-bold text-xl tracking-tight text-neutral-900 group-hover:text-primary-600 transition-colors duration-200">
                SuiteGenie
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              to="/" 
              className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg transition-all duration-200"
            >
              Home
            </Link>
            <Link 
              to="/plans" 
              className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg transition-all duration-200"
            >
              Plans & Pricing
            </Link>
            <Link 
              to="/about" 
              className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg transition-all duration-200"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="px-3 py-2 text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg transition-all duration-200"
            >
              Contact
            </Link>
          </div>

          {/* Desktop Login/Signup Links or Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              // Authenticated user - show dashboard link and profile dropdown
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  iconPosition="left"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Dashboard
                </Button>
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={toggleProfile}
                    className="flex items-center space-x-2 px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-sm">{user?.name}</span>
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                        <p className="text-xs text-neutral-500">{user?.email}</p>
                      </div>
                      <Link 
                        to="/team" 
                        className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Users className="w-4 h-4 mr-3" />
                        Team
                      </Link>

                      <Link 
                        to="/settings" 
                        className="flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors duration-200"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-error-600 transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Not authenticated - show login/signup
              <>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/login'}>
                  Login
                </Button>
                <Button variant="primary" size="sm" onClick={() => window.location.href = '/register'}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              icon={isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              aria-label="Toggle navigation menu"
            />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-down">
            <div className="px-4 pt-4 pb-6 space-y-2 bg-white border-t border-neutral-200">
              <Link 
                to="/" 
                className="block px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg font-medium transition-all duration-200"
                onClick={closeMenu}
              >
                Home
              </Link>
              <Link 
                to="/plans" 
                className="block px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg font-medium transition-all duration-200"
                onClick={closeMenu}
              >
                Plans & Pricing
              </Link>
              <Link 
                to="/about" 
                className="block px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg font-medium transition-all duration-200"
                onClick={closeMenu}
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="block px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg font-medium transition-all duration-200"
                onClick={closeMenu}
              >
                Contact
              </Link>
              <div className="border-t border-neutral-200 pt-4 mt-4">
                {isAuthenticated ? (
                  // Authenticated user mobile menu
                  <>
                    <div className="px-3 py-3 mb-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{user?.name}</p>
                          <p className="text-sm text-neutral-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link 
                      to="/dashboard" 
                      className="flex items-center px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg font-medium transition-all duration-200"
                      onClick={closeMenu}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-3" />
                      Dashboard
                    </Link>
                    <Link 
                      to="/team" 
                      className="flex items-center px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg font-medium transition-all duration-200"
                      onClick={closeMenu}
                    >
                      <Users className="w-4 h-4 mr-3" />
                      Team
                    </Link>

                    <Link 
                      to="/settings" 
                      className="flex items-center px-3 py-2 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 rounded-lg font-medium transition-all duration-200"
                      onClick={closeMenu}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                      className="flex items-center w-full px-3 py-2 text-neutral-700 hover:text-error-600 hover:bg-error-50 rounded-lg font-medium transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </>
                ) : (
                  // Not authenticated mobile menu
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      fullWidth 
                      onClick={() => {
                        window.location.href = '/login';
                        closeMenu();
                      }}
                    >
                      Login
                    </Button>
                    <Button 
                      variant="primary" 
                      fullWidth
                      onClick={() => {
                        window.location.href = '/register';
                        closeMenu();
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
