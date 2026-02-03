import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Crown, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2.5 rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <Crown className="h-7 w-7 text-gray-900" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                  JN PALACE
                </span>
                <span className="text-xs text-amber-400 tracking-widest font-light">LUXURY HOTEL</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 text-gray-200 hover:text-amber-400 transition-colors duration-300 font-medium text-sm tracking-wide"
            >
              HOME
            </Link>
            <Link
              to="/rooms"
              className="px-4 py-2 text-gray-200 hover:text-amber-400 transition-colors duration-300 font-medium text-sm tracking-wide"
            >
              ROOMS & SUITES
            </Link>
            <Link
              to="/restaurant"
              className="px-4 py-2 text-gray-200 hover:text-amber-400 transition-colors duration-300 font-medium text-sm tracking-wide"
            >
              DINING
            </Link>
            <Link
              to="/banquets"
              className="px-4 py-2 text-gray-200 hover:text-amber-400 transition-colors duration-300 font-medium text-sm tracking-wide"
            >
              EVENTS
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-gray-200 hover:text-amber-400 transition-colors duration-300 font-medium text-sm tracking-wide"
                >
                  DASHBOARD
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="px-4 py-2 text-gray-200 hover:text-amber-400 transition-colors duration-300 font-medium text-sm tracking-wide"
                  >
                    ADMIN
                  </Link>
                )}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-700">
                  <User className="h-5 w-5 text-amber-400" />
                  <span className="text-gray-200 font-medium">{user.firstName}</span>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-300"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-200 hover:text-amber-400 transition-colors duration-300 font-medium text-sm tracking-wide"
                >
                  LOGIN
                </Link>
                <Link
                  to="/rooms"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all duration-300 shadow-lg hover:shadow-amber-500/50 text-sm tracking-wide"
                >
                  BOOK NOW
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-amber-400 hover:text-amber-300 p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-300"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                className="text-gray-200 hover:text-amber-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                HOME
              </Link>
              <Link
                to="/rooms"
                className="text-gray-200 hover:text-amber-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                ROOMS & SUITES
              </Link>
              <Link
                to="/restaurant"
                className="text-gray-200 hover:text-amber-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                DINING
              </Link>
              <Link
                to="/banquets"
                className="text-gray-200 hover:text-amber-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm tracking-wide"
                onClick={() => setIsMenuOpen(false)}
              >
                EVENTS
              </Link>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-200 hover:text-amber-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm tracking-wide"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    DASHBOARD
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="text-gray-200 hover:text-amber-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm tracking-wide"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      ADMIN
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-lg text-left transition-all duration-300 font-medium text-sm tracking-wide"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-200 hover:text-amber-400 hover:bg-gray-800/50 px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm tracking-wide"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/rooms"
                    className="bg-gradient-to-r from-amber-500 to-yellow-600 text-gray-900 px-4 py-2.5 rounded-lg font-semibold hover:from-amber-400 hover:to-yellow-500 transition-all duration-300 text-center text-sm tracking-wide"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    BOOK NOW
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
