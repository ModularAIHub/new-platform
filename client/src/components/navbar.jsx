import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';

const Navbar = () => {
  const { user, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow px-6 py-3 flex items-center justify-between">
      {/* Autoverse Brand */}
      <div className="flex items-center">
        <Link 
          to={user ? "/dashboard" : "/"} 
          className="font-extrabold text-2xl tracking-tight text-blue-700 hover:text-blue-800 transition"
        >
          Autoverse
        </Link>
      </div>
      
      {/* Navigation Links */}
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
        <Link to="/plans" className="text-gray-700 hover:text-blue-600 font-medium">Plans & Pricing</Link>
        <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">About</Link>
        <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
      </div>
      
      {/* Authentication Section */}
      {loading ? (
        <div className="flex items-center space-x-6">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      ) : user ? (
        // Authenticated User Section
        <div className="flex items-center space-x-6">
          <Link 
            to="/dashboard" 
            className="text-gray-700 hover:text-blue-600 font-medium transition"
          >
            Dashboard
          </Link>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 font-medium transition"
            >
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span>{user.name}</span>
              <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Settings
                  </Link>
                  <Link
                    to="/api-keys"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    API Keys
                  </Link>
                  <Link
                    to="/credits"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Credits
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Unauthenticated User Section
        <div className="flex items-center space-x-6">
          <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">Login</Link>
          <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold border border-blue-600 px-4 py-1 rounded transition">Sign Up</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
