// Navbar.jsx - Complete Tailwind CSS Version
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle component mount animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
                    <path d="M12 2L4 7L12 12L20 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 12L12 17L20 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Accord</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">AI</span>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 py-6">
              <Link 
                to="/" 
                className={`flex items-center gap-4 px-6 py-4 text-lg font-semibold transition-all border-r-4 ${
                  isActiveLink('/') 
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-6 h-6">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <span>Home</span>
                <div className="ml-auto w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 24 24" fill="none">
                    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </Link>

              <Link 
                to="/about" 
                className={`flex items-center gap-4 px-6 py-4 text-lg font-semibold transition-all border-r-4 ${
                  isActiveLink('/about') 
                    ? 'text-blue-400 bg-blue-500/10 border-blue-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border-transparent'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-6 h-6">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <span>About</span>
                <div className="ml-auto w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 24 24" fill="none">
                    <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </Link>
            </nav>

            {/* Mobile Footer */}
            <div className="p-6 border-t border-slate-700/50">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-xl">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-300 font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-900/95 backdrop-blur-xl shadow-2xl border-b border-slate-700/50 h-16' 
          : 'bg-slate-900/60 backdrop-blur-sm h-20'
      } ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
              <div className="relative">
                <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ${
                  isScrolled ? 'w-10 h-10' : 'w-12 h-12'
                }`}>
                  <svg viewBox="0 0 24 24" fill="none" className={`text-white ${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`}>
                    <path d="M12 2L4 7L12 12L20 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M4 12L12 17L20 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-xl blur animate-pulse"></div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent ${
                  isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                  Accord
                </span>
                <span className={`font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent ${
                  isScrolled ? 'text-xl' : 'text-2xl'
                }`}>
                  AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`relative group flex items-center gap-2 px-4 py-2 font-semibold transition-all duration-300 ${
                  isActiveLink('/') 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-white hover:-translate-y-0.5'
                }`}
              >
                <div className="w-5 h-5">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <span>Home</span>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
                  isActiveLink('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></div>
              </Link>

              <Link 
                to="/about" 
                className={`relative group flex items-center gap-2 px-4 py-2 font-semibold transition-all duration-300 ${
                  isActiveLink('/about') 
                    ? 'text-blue-400' 
                    : 'text-slate-300 hover:text-white hover:-translate-y-0.5'
                }`}
              >
                <div className="w-5 h-5">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <span>About</span>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
                  isActiveLink('/about') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></div>
              </Link>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-300">Online</span>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className={`lg:hidden relative w-12 h-12 bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isMobileMenuOpen ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'hover:bg-slate-700/50'
              }`}
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center">
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'
                }`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm my-0.5 ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}></span>
                <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'
                }`}></span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Navbar Glow Effect */}
        {isScrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
