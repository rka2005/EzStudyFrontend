import { useState, lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Legal from './components/Legal'
import LearningPage from './components/LearningPage'
import Preloader from './components/Preloader'
import AuthModal from './components/AuthModal'

// Layout component for pages that need navbar
const MainLayout = ({ children, darkMode, toggleDarkMode, user, setUser, onLogout, onLoginClick }) => {
  return (
    <>
      <Navbar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        isVisible={true}
        user={user}
        setUser={setUser}
        onLogout={onLogout}
        onLoginClick={onLoginClick}
      />
      {children}
    </>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [authKey, setAuthKey] = useState(0) // Key to force AuthModal remount on logout
  const location = useLocation()

  // Handle hash scrolling and scroll to top on path change
  useEffect(() => {
    if (isLoading) return;

    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '')
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location, isLoading])

  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) {
      return JSON.parse(saved)
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev
      localStorage.setItem('darkMode', JSON.stringify(newValue))
      return newValue
    })
  }

  useEffect(() => {
    // Robust check for existing user in localStorage and sanitize stored credentials
    const hashString = async (str) => {
      const enc = new TextEncoder();
      const data = enc.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

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

    (async () => {
      try {
        // migrate users list: if stored users contain raw email/password, replace with hashes
        let users = [];
        try {
          users = JSON.parse(localStorage.getItem('ezstudy_users') || '[]');
        } catch (e) {
          users = [];
        }

        let migrated = false;
        const newUsers = [];
        for (const u of users) {
          if (u.email && u.password) {
            // legacy format, migrate
            const emailNormalized = (u.email || '').trim().toLowerCase();
            const emailHash = await hashString(emailNormalized);
            const passwordHash = await hashString(u.password || '');
            newUsers.push({ id: u.id || `u_${Date.now()}`, name: u.name || emailNormalized.split('@')[0], emailHash, passwordHash, createdAt: u.createdAt || Date.now() });
            migrated = true;
          } else if (u.emailHash && u.passwordHash) {
            newUsers.push(u);
          } else {
            // unknown shape, skip sensitive fields
            const safe = { id: u.id || `u_${Date.now()}`, name: u.name || 'User', emailHash: u.emailHash || null, passwordHash: u.passwordHash || null, createdAt: u.createdAt || Date.now() };
            newUsers.push(safe);
          }
        }

        if (migrated) {
          localStorage.setItem('ezstudy_users', JSON.stringify(newUsers));
        }

        // sanitize currentUser: if it contains email/password, replace with masked version
        try {
          const savedUserRaw = localStorage.getItem('ezstudy_currentUser');
          if (savedUserRaw) {
            const parsed = JSON.parse(savedUserRaw);
            if (parsed.password || parsed.email) {
              const emailNorm = (parsed.email || '').trim().toLowerCase();
              const masked = { id: parsed.id || `u_${Date.now()}`, name: parsed.name || (emailNorm.split('@')[0] || 'User'), email: maskEmail(emailNorm), createdAt: parsed.createdAt || Date.now() };
              localStorage.setItem('ezstudy_currentUser', JSON.stringify(masked));
              setUser(masked);
              return;
            }
            // otherwise use as-is (already sanitized)
            setUser(parsed);
            return;
          }
        } catch (e) {
          console.error('Error reading current user', e);
          localStorage.removeItem('ezstudy_currentUser');
        }
      } catch (err) {
        console.error("Error during credential migration:", err);
      }
    })();

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 5000) // Show preloader for 5 seconds
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isLoading])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setIsAuthModalOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('ezstudy_currentUser')
    setUser(null)
    setAuthKey(prev => prev + 1) // Force AuthModal remount to clear fields
  }

  const openAuth = (mode = 'signin') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
  }

  // Force URL to root during preloader
  useEffect(() => {
    if (isLoading && window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
  }, [isLoading]);

  if (isLoading) {
    return <Preloader />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a1a]">
      {/* Auth Modal */}
      <AuthModal
        key={authKey}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />

      <Routes>
        {/* Home Page */}
        <Route path="/" element={
          <MainLayout
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            user={user}
            setUser={setUser}
            onLogout={handleLogout}
            onLoginClick={openAuth}
          >
            <Hero
              isReady={true}
              user={user}
              onLoginClick={() => openAuth('signin')}
              onSignupClick={() => openAuth('signup')}
            />
            <About />
            <Contact />
            <Footer />
          </MainLayout>
        } />

        {/* AI Console */}
        <Route path="/ai-console" element={
          user ? (
            <LearningPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        } />

        {/* Legal Pages */}
        <Route path="/terms-conditions" element={
          <MainLayout
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            user={user}
            setUser={setUser}
            onLogout={handleLogout}
            onLoginClick={openAuth}
          >
            <Legal type="terms" />
          </MainLayout>
        } />

        <Route path="/privacy-policy" element={
          <MainLayout
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            user={user}
            setUser={setUser}
            onLogout={handleLogout}
            onLoginClick={openAuth}
          >
            <Legal type="privacy" />
          </MainLayout>
        } />

        <Route path="/services" element={
          <MainLayout
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            user={user}
            setUser={setUser}
            onLogout={handleLogout}
            onLoginClick={openAuth}
          >
            <Legal type="services" />
          </MainLayout>
        } />

        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App