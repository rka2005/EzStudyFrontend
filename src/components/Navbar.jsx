import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Info, Phone, Menu, X, Sun, Moon, LogOut, User, Bot, Camera, Upload, Crop, Check, X as CloseIcon } from "lucide-react";

const Navbar = ({ darkMode, toggleDarkMode, isVisible, user, setUser, onLogout, onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [pendingScrollToTop, setPendingScrollToTop] = useState(false);
  const [profileDropdownClosing, setProfileDropdownClosing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCroppingImage, setIsCroppingImage] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropArea, setCropArea] = useState({ x: 64, y: 64, width: 128, height: 128 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const cropContainerRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const mobileProfileRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if ((profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) &&
        (mobileProfileRef.current && !mobileProfileRef.current.contains(event.target))) {
        handleCloseProfileDropdown();
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleNavigation = (path) => {
    setIsMobileMenuOpen(false);
    if (path === '/' && window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    navigate(path);
  };

  const handleLearningNavigation = () => {
    setIsMobileMenuOpen(false);
    if (user) {
      navigate('/ai-console');
    } else {
      onLoginClick('signin');
    }
  };

  const smoothScrollToTop = () => {
    const startPosition = window.pageYOffset;
    const distance = -startPosition;
    const duration = 1500; // 1.5 seconds for slower animation
    let startTime = null;

    const easeInOutQuad = (t) => {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeInOutQuad(progress);

      window.scrollTo(0, startPosition + distance * easeProgress);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  // If navigation caused a pending scroll request, perform it after location changes
  useEffect(() => {
    if (pendingScrollToTop && location.pathname === '/') {
      smoothScrollToTop();
      setPendingScrollToTop(false);
    }
  }, [location, pendingScrollToTop]);

  // Handle closing profile dropdown with pop-out animation
  const handleCloseProfileDropdown = () => {
    setProfileDropdownClosing(true);
    setTimeout(() => {
      setIsProfileDropdownOpen(false);
      setProfileDropdownClosing(false);
    }, 400);
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('File selected:', file);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create image URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setCropImageSrc(imageUrl);
    setIsCroppingImage(true);
    setIsProfileDropdownOpen(false); // Close dropdown when cropping starts
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleCropComplete = () => {
    if (!cropImageSrc) return;

    const img = new Image();
    img.onload = () => {
      // Create canvas for cropping
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Container dimensions
      const containerWidth = 320; // w-80 = 320px
      const containerHeight = 256; // h-64 = 256px

      // Scale factors
      const scaleX = img.width / containerWidth;
      const scaleY = img.height / containerHeight;

      // Calculate actual crop coordinates with proper handling of negative values
      let x = cropArea.x * scaleX;
      let y = cropArea.y * scaleY;
      let width = cropArea.width * scaleX;
      let height = cropArea.height * scaleY;

      // Ensure we don't crop outside image boundaries
      // If crop area extends beyond image, clamp to image edges
      x = Math.max(0, x);
      y = Math.max(0, y);
      width = Math.min(img.width - x, width);
      height = Math.min(img.height - y, height);

      // Ensure minimum crop size
      width = Math.max(10, width);
      height = Math.max(10, height);

      // Set canvas size to the cropped area
      canvas.width = width;
      canvas.height = height;

      // Draw cropped portion
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

      // Convert to blob and upload
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'profile-cropped.jpg', { type: 'image/jpeg' });
          uploadCroppedImage(croppedFile);
        }
      }, 'image/jpeg', 0.9);
    };

    img.src = cropImageSrc;
  };

  const handleCropMouseDown = (e, corner) => {
    if (corner) {
      setIsResizing(corner);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
    }
  };

  const handleCropMouseMove = (e) => {
    if (!cropContainerRef.current) return;

    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Allow UNLIMITED crop area extension beyond container boundaries for maximum flexibility
      // Remove all constraints - let users position crop area anywhere
      setCropArea(prev => ({
        ...prev,
        x: newX, // No min/max constraints
        y: newY  // No min/max constraints
      }));
    } else if (isResizing) {
      const minSize = 20; // Minimum crop size for usability

      let { x, y, width, height } = cropArea;

      if (isResizing.includes('e')) {
        width = Math.max(minSize, e.clientX - dragStart.x + width);
      }
      if (isResizing.includes('s')) {
        height = Math.max(minSize, e.clientY - dragStart.y + height);
      }
      if (isResizing.includes('w')) {
        const deltaX = e.clientX - dragStart.x;
        const newWidth = Math.max(minSize, width - deltaX);
        if (newWidth !== width) {
          x = x + deltaX; // Allow x to go as negative as needed
          width = newWidth;
        }
      }
      if (isResizing.includes('n')) {
        const deltaY = e.clientY - dragStart.y;
        const newHeight = Math.max(minSize, height - deltaY);
        if (newHeight !== height) {
          y = y + deltaY; // Allow y to go as negative as needed
          height = newHeight;
        }
      }

      setDragStart({ x: e.clientX, y: e.clientY });
      setCropArea({ x, y, width, height });
    }
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  const uploadCroppedImage = async (file) => {
    setIsUploadingImage(true);

    try {
      // STATIC IMPLEMENTATION: Convert file to Base64 and save locally
      const reader = new FileReader();

      reader.onloadend = () => {
        try {
          const base64String = reader.result;
          console.log('Image converted to Base64, length:', base64String.length);

          // Update user with new image
          const updatedUser = { ...user, profileImage: base64String };
          // Store a sanitized copy in localStorage (no raw credentials)
          const maskEmail = (em) => {
            try {
              const [local, domain] = em.split('@');
              const localMasked = local.length > 1 ? local[0] + '***' : '***';
              const domainParts = domain ? domain.split('.') : [];
              const domainMasked = domainParts.length ? domainParts[0][0] + '***.' + domainParts.slice(1).join('.') : '***';
              return `${localMasked}@${domainMasked}`;
            } catch (e) {
              return '***@***.***';
            }
          };

          const safeCurrent = {
            id: updatedUser.id || `u_${Date.now()}`,
            name: updatedUser.name || 'User',
            email: updatedUser.email ? maskEmail(updatedUser.email) : (updatedUser.emailMasked || '***@***.***'),
            createdAt: updatedUser.createdAt || Date.now(),
            profileImage: updatedUser.profileImage
          };

          localStorage.setItem('ezstudy_currentUser', JSON.stringify(safeCurrent));
          setUser(updatedUser);

          console.log('Profile image updated successfully');
          setIsUploadingImage(false);
          setIsCroppingImage(false);
          setCropImageSrc(null);
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Failed to process image');
          setIsUploadingImage(false);
        }
      };

      reader.onerror = () => {
        console.error('FileReader error');
        alert('Failed to read image file');
        setIsUploadingImage(false);
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image: ' + error.message);
      setIsUploadingImage(false);
      setIsCroppingImage(false);
    }
  };

  return (
    <>
      <div className={`fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 sm:gap-3 w-[95%] sm:w-[90%] max-w-6xl z-50 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
        <nav className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-2xl rounded-2xl px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between flex-1 font-[Rubik] border border-white/20 dark:border-gray-700/30 shadow-lg shadow-black/5 dark:shadow-black/20">
          {/* Logo */}
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              if (location.pathname === '/') {
                smoothScrollToTop();
              } else {
                setPendingScrollToTop(true);
                navigate('/');
              }
            }}
            className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-transparent bg-clip-text tracking-wide hover:scale-105 transition-transform cursor-pointer font-['Cambria_Math']"
          >
            EzStudy
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-6 lg:space-x-10">
            <NavItem icon={<Home size={15} className="text-blue-500" />} text="Home" href="/" onClick={() => setIsMobileMenuOpen(false)} />
            {user && <NavItem icon={<Bot size={15} className="text-indigo-500" />} text="AI Console" href="/ai-console" onClick={() => setIsMobileMenuOpen(false)} />}
            <NavItem icon={<Info size={15} className="text-purple-500" />} text="About" href="/#about" onClick={() => setIsMobileMenuOpen(false)} />
            <NavItem icon={<Phone size={15} className="text-rose-400" />} text="Contact" href="/#contact" onClick={() => setIsMobileMenuOpen(false)} />
          </div>

          {/* Mobile Menu Button Container */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-300 active:scale-90 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {isMobileMenuOpen ? <X size={20} className="text-gray-900 dark:text-white" /> : <Menu size={20} className="text-gray-900 dark:text-white" />}
            </button>
            {/* Mobile profile icon (same as navbar) */}
            {user && (
              <button
                ref={mobileProfileRef}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                aria-label="Open profile"
                className="p-1 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95"
              >
                <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-xs font-bold m-0.5">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 mx-2 md:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-4 space-y-1 animate-in fade-in slide-in-from-top-4 duration-300">
              <button
                onClick={() => handleNavigation('/')}
                className="w-full text-left px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300 flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white active:scale-95"
              >
                <Home size={18} className="text-blue-500" />
                <span className="font-medium font-['Cambria_Math']">Home</span>
              </button>
              {user && (
                <button
                  onClick={handleLearningNavigation}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300 flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white active:scale-95"
                >
                  <Bot size={18} className="text-indigo-500" />
                  <span className="font-medium font-['Cambria_Math']">AI Console</span>
                </button>
              )}
              <button
                onClick={() => handleNavigation('/#about')}
                className="w-full text-left px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300 flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white active:scale-95"
              >
                <Info size={18} className="text-purple-500" />
                <span className="font-medium font-['Cambria_Math']">About</span>
              </button>
              <button
                onClick={() => handleNavigation('/#contact')}
                className="w-full text-left px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300 flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white active:scale-95"
              >
                <Phone size={18} className="text-rose-400" />
                <span className="font-medium font-['Cambria_Math']">Contact</span>
              </button>

              <div className="pt-2 border-t border-gray-100/50 dark:border-gray-700/30 mt-2 flex flex-col space-y-2">
                {/* Mobile Auth Buttons */}
                <div className="pt-2">
                  {!user ? (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLoginClick();
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-white rounded-xl font-medium text-center shadow-md shadow-purple-500/20 active:scale-95 transition-all font-['Cambria_Math']"
                    >
                      Login
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* removed floating bottom-right mobile profile button to keep profile in navbar */}

          {/* Mobile Profile Dropdown */}
          {isProfileDropdownOpen && user && (
            <div ref={mobileProfileRef} className="absolute top-full right-4 md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-4 min-w-[220px] z-50 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-purple-500/20">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white font-['Cambria_Math']">{user.name || "User"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-['Cambria_Math']">{user.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center space-x-2 text-red-600 dark:text-red-400 font-['Cambria_Math']"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Authentication Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
            {/* Show user profile button when signed in */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100 font-['Cambria_Math']">{user.name || 'User'}</span>
                  <button
                    onClick={onLogout}
                    className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-wider transition-all duration-300 hover:scale-110 active:scale-95 font-['Cambria_Math']"
                  >
                    Logout
                  </button>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 via-purple-500 to-rose-500 p-0.5 shadow-lg shadow-purple-500/20 group relative hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    {false ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                        {user.name?.charAt(0) || user.email?.charAt(0)}
                      </div>
                    )}

                  </button>

                  {/* Profile Dropdown */}
                  {(isProfileDropdownOpen || profileDropdownClosing) && (
                    <div ref={profileDropdownRef} className={`absolute top-full right-0 mt-2 w-96 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 p-6 z-50 ${profileDropdownClosing ? 'animate-popOut' : 'animate-in fade-in slide-in-from-top-2 duration-200'
                      }`}>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/30">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg shadow-purple-500/20">
                            {false ? (
                              <img
                                src={user.profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                                {user.name?.charAt(0) || user.email?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[10px] font-semibold text-gray-900 dark:text-white truncate font-['Cambria_Math']">
                              {user.name || 'User'}
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-['Cambria_Math']">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleCloseProfileDropdown}
                          className="p-1.5 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-all duration-200 ml-2"
                          aria-label="Close profile"
                        >
                          <X size={16} className="text-gray-700 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white" />
                        </button>
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                      />



                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/30 transition-all duration-300">
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-['Cambria_Math']">Account Type</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white font-['Cambria_Math']">Free</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/30 transition-all duration-300">
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-['Cambria_Math']">Joined</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white font-['Cambria_Math']">
                            {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/30 transition-all duration-300">
                          <span className="text-sm text-gray-600 dark:text-gray-300 font-['Cambria_Math']">AI Interactions</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white font-['Cambria_Math']">∞</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/30">
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                        >
                          <LogOut size={16} />
                          <span className="text-sm font-medium font-['Cambria_Math']">Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all duration-300 font-['Cambria_Math'] text-sm btn-shine"
              >
                Login
              </button>
            )}
          </div>
        </nav>

        {/* Creative Day/Night Toggle — Cosmic Pill */}
        <div className="theme-toggle-wrapper">
          <input
            className="input"
            id="dn"
            type="checkbox"
            checked={darkMode}
            onChange={toggleDarkMode}
          />
          <label className="toggle" htmlFor="dn">
            <span className="toggle__handler">
              <span className="crater crater--1"></span>
              <span className="crater crater--2"></span>
              <span className="crater crater--3"></span>
            </span>
            <span className="star star--1"></span>
            <span className="star star--2"></span>
            <span className="star star--3"></span>
            <span className="star star--4"></span>
            <span className="star star--5"></span>
            <span className="star star--6"></span>
          </label>
        </div>
      </div>

      {/* Image Cropping Modal - Centered on Whole Page */}
      {isCroppingImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto" onMouseMove={handleCropMouseMove} onMouseUp={handleCropMouseUp} onMouseLeave={handleCropMouseUp}>
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl max-w-md w-full p-6 my-auto transform scale-100 animate-in fade-in zoom-in-95 duration-300 border border-white/20 dark:border-gray-700/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-transparent bg-clip-text text-center flex-1 font-['Cambria_Math']">Crop Profile Picture</h3>
              <button
                onClick={() => {
                  setIsCroppingImage(false);
                  setCropImageSrc(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-colors ml-2"
              >
                <CloseIcon size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="relative mb-6">
              <div ref={cropContainerRef} className="relative w-80 h-64 bg-gray-100 dark:bg-gray-800/50 rounded-xl overflow-hidden cursor-move user-select-none" onMouseDown={(e) => handleCropMouseDown(e, null)}>
                {cropImageSrc && (
                  <img
                    src={cropImageSrc}
                    alt="Crop preview"
                    className="w-full h-full object-contain pointer-events-none"
                    onLoad={(e) => {
                      setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
                    }}
                  />
                )}

                {/* Darkened overlay areas */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top section */}
                  <div className="absolute top-0 left-0 right-0 bg-black/60" style={{ height: `${Math.max(0, cropArea.y)}px` }}></div>
                  {/* Bottom section */}
                  <div className="absolute left-0 right-0 bg-black/60" style={{ top: `${Math.max(0, cropArea.y + cropArea.height)}px`, bottom: 0 }}></div>
                  {/* Left section */}
                  <div className="absolute top-0 left-0 bg-black/60" style={{ width: `${Math.max(0, cropArea.x)}px`, height: '100%' }}></div>
                  {/* Right section */}
                  <div className="absolute top-0 right-0 bg-black/60" style={{ width: `${Math.max(0, 320 - cropArea.x - cropArea.width)}px`, height: '100%' }}></div>

                  {/* Center square crop area - plain and simple */}
                  <div
                    className={`absolute border-2 group cursor-grab active:cursor-grabbing transition-all ${cropArea.x < 0 || cropArea.y < 0 || cropArea.x + cropArea.width > 320 || cropArea.y + cropArea.height > 256
                      ? 'border-yellow-400'
                      : 'border-gray-300 dark:border-gray-500'
                      }`}
                    style={{
                      left: `${cropArea.x}px`,
                      top: `${cropArea.y}px`,
                      width: `${cropArea.width}px`,
                      height: `${cropArea.height}px`
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleCropMouseDown(e, null);
                    }}
                  >
                    {/* Edge handles - plain square */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 cursor-n-resize rounded-t transition-all duration-300 hover:scale-110 active:scale-95" onMouseDown={(e) => { e.stopPropagation(); handleCropMouseDown(e, 'n'); }}></div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 cursor-s-resize rounded-b transition-all duration-300 hover:scale-110 active:scale-95" onMouseDown={(e) => { e.stopPropagation(); handleCropMouseDown(e, 's'); }}></div>
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 cursor-w-resize rounded-l transition-all duration-300 hover:scale-110 active:scale-95" onMouseDown={(e) => { e.stopPropagation(); handleCropMouseDown(e, 'w'); }}></div>
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 cursor-e-resize rounded-r transition-all duration-300 hover:scale-110 active:scale-95" onMouseDown={(e) => { e.stopPropagation(); handleCropMouseDown(e, 'e'); }}></div>

                    {/* Corner handles - plain small squares */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 cursor-nw-resize transition-all duration-300 hover:scale-110 active:scale-95" onMouseDown={(e) => { e.stopPropagation(); handleCropMouseDown(e, 'nw'); }}></div>
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 cursor-ne-resize transition-all duration-300 hover:scale-110 active:scale-95" onMouseDown={(e) => { e.stopPropagation(); handleCropMouseDown(e, 'ne'); }}></div>
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 cursor-sw-resize transition-all duration-300 hover:scale-110 active:scale-95" onMouseDown={(e) => { e.stopPropagation(); handleCropMouseDown(e, 'sw'); }}></div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-gray-400 dark:bg-gray-500 hover:bg-gray-600 cursor-se-resize transition-all duration-300 hover:scale-110 active:scale-95" onMouseDown={(e) => { e.stopPropagation(); handleCropMouseDown(e, 'se'); }}></div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center font-medium font-['Cambria_Math']">
                Drag to move • Use corner/edge handles to resize • Yellow border = extends beyond image
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCropArea({ x: 64, y: 64, width: 128, height: 128 })}
                className="px-3 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 text-sm hover:scale-105 active:scale-95 hover:shadow-md"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setIsCroppingImage(false);
                  setCropImageSrc(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200/80 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                disabled={isUploadingImage}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 hover:shadow-lg hover:shadow-blue-500/30 disabled:hover:scale-100"
              >
                {isUploadingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Apply</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const NavItem = ({ icon, text, href, onClick }) => {
  return (
    <Link
      to={href}
      onClick={(e) => {
        if (href === '/' && window.location.pathname === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (onClick) onClick(e);
      }}
      className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300 font-medium hover:text-purple-600 dark:hover:text-purple-400 group transition-all duration-300 font-['Cambria_Math'] text-sm"
    >
      <span className="p-1.5 rounded-xl bg-gray-100/60 dark:bg-gray-800/40 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-purple-500/10 transition-all duration-300 shadow-sm group-hover:bg-gradient-to-br group-hover:from-purple-50 group-hover:to-blue-50 dark:group-hover:from-purple-900/30 dark:group-hover:to-blue-900/30">
        {icon}
      </span>
      <span className="relative overflow-hidden group">
        {text}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 group-hover:w-full transition-all duration-300 rounded-full"></span>
      </span>
    </Link>
  );
};

export default Navbar;