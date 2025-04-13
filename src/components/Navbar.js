import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-[#82001A] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl">VJLNF</span>
            </Link>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {/* Home link removed */}
              <Link 
                to="/found-items" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
                  ${isActive('/found-items') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
              >
                Found Items
              </Link>
              
              <Link 
                to="/lost-items" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
                  ${isActive('/lost-items') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
              >
                Lost Items
              </Link>
              
              {currentUser ? (
                <>
                  <div className="relative inline-block text-left">
                    <div>
                      <button 
                        type="button" 
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 inline-flex items-center ${
                          isActive('/report/lost') || isActive('/report/found') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'
                        }`}
                        onClick={() => setReportDropdownOpen(!reportDropdownOpen)}
                        onBlur={() => setTimeout(() => setReportDropdownOpen(false), 100)}
                      >
                        Report Item
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {reportDropdownOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabIndex="-1">
                        <div className="py-1" role="none">
                          <Link to="/report/lost" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1">Report Lost Item</Link>
                          <Link to="/report/found" className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem" tabIndex="-1">Report Found Item</Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link 
                    to="/profile" 
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center
                      ${isActive('/profile') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  
                  {userRole === 'admin' && (
                    <Link 
                      to="/admin" 
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
                        ${isActive('/admin') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
                    >
                      Admin
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-[#82001A]/80 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 
                      ${isActive('/login') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-3 py-2 rounded-md text-sm font-medium bg-white text-[#82001A] hover:bg-gray-100"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={toggleMobileMenu}
                className="mobile-menu-button p-2 rounded-md inline-flex items-center justify-center text-white hover:bg-[#82001A]/80 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#82001A]/95">
          {/* Home link removed from mobile menu */}
          <Link 
            to="/found-items" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/found-items') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Found Items
          </Link>
          
          <Link 
            to="/lost-items" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/lost-items') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Lost Items
          </Link>
          
          {currentUser ? (
            <>
              <div className="border-t border-[#82001A]/30 pt-2 mt-2">
                <Link 
                  to="/report/found" 
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#82001A]/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Report Found Item
                </Link>
                
                <Link 
                  to="/report/lost" 
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#82001A]/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Report Lost Item
                </Link>
                
                <Link 
                  to="/profile" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/profile') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
              </div>
              
              {userRole === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin') ? 'bg-white text-[#82001A]' : 'hover:bg-[#82001A]/80'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-[#82001A]/80 border-t border-[#82001A]/30 mt-2"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="border-t border-[#82001A]/30 pt-2 mt-2 flex flex-col space-y-1">
              <Link 
                to="/login" 
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-[#82001A]/80"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              
              <Link 
                to="/signup" 
                className="block px-3 py-2 rounded-md text-base font-medium bg-white text-[#82001A] hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;