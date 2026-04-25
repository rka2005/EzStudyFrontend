import React, { useEffect, useRef, useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'signin' }) => {
    const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
    const googleButtonRef = useRef(null);
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // Password strength validation
    const validatePassword = (password) => {
        const feedback = [];
        let score = 0;

        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('At least 8 characters');
        }

        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('One lowercase letter');
        }

        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('One uppercase letter');
        }

        if (/\d/.test(password)) {
            score += 1;
        } else {
            feedback.push('One number');
        }

        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score += 1;
        } else {
            feedback.push('One special character');
        }

        return { score, feedback };
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        if (mode === 'signup') {
            setPasswordStrength(validatePassword(newPassword));
        }
    };

    const getPasswordStrengthColor = () => {
        const { score } = passwordStrength;
        if (score <= 2) return 'text-red-500';
        if (score <= 3) return 'text-yellow-500';
        if (score <= 4) return 'text-blue-500';
        return 'text-green-500';
    };

    const getPasswordStrengthText = () => {
        const { score } = passwordStrength;
        if (score <= 2) return 'Weak';
        if (score <= 3) return 'Fair';
        if (score <= 4) return 'Good';
        return 'Strong';
    };

    const saveAuthenticatedUser = (apiUser) => {
        const sessionUser = {
            id: apiUser.id,
            name: apiUser.name || 'User',
            email: apiUser.email || '',
            emailMasked: apiUser.emailMasked || '',
            provider: apiUser.provider || 'local',
            authMethods: apiUser.authMethods || [],
            profileImage: apiUser.profileImage || null,
            createdAt: apiUser.createdAt || Date.now(),
            lastLoginAt: apiUser.lastLoginAt || Date.now(),
            activeChatId: apiUser.activeChatId || null,
        };

        localStorage.setItem('ezstudy_currentUser', JSON.stringify(sessionUser));
        onAuthSuccess(sessionUser);
    };

    // Compute SHA-256 hash for a string (returns hex)
    const hashString = async (str) => {
        const enc = new TextEncoder();
        const data = enc.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleGoogleCredential = async (credentialResponse) => {
        setError('');
        setIsGoogleLoading(true);
        try {
            const token = credentialResponse?.credential;
            if (!token) {
                throw new Error('Google sign in failed. Missing credential.');
            }

            const response = await apiFetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential: token }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Google authentication failed');
            }

            saveAuthenticatedUser(data.user || data);
        } catch (err) {
            console.error('Google auth error:', err);
            setError(err.message || 'Google authentication failed. Please try again.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        if (!GOOGLE_CLIENT_ID) return;

        const renderGoogleButton = () => {
            if (!window.google?.accounts?.id || !googleButtonRef.current) return;

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredential,
            });

            googleButtonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                theme: 'outline',
                size: 'large',
                shape: 'pill',
                text: mode === 'signup' ? 'signup_with' : 'signin_with',
                logo_alignment: 'left',
                width: 360,
            });
        };

        if (window.google?.accounts?.id) {
            renderGoogleButton();
            return;
        }

        const existingScript = document.getElementById('google-identity-script');
        if (existingScript) {
            existingScript.addEventListener('load', renderGoogleButton, { once: true });
            return () => existingScript.removeEventListener('load', renderGoogleButton);
        }

        const script = document.createElement('script');
        script.id = 'google-identity-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButton;
        document.head.appendChild(script);
    }, [isOpen, mode, GOOGLE_CLIENT_ID]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const emailNormalized = (email || '').trim().toLowerCase();
            const passwordHash = await hashString(password || '');

            if (mode === 'signup') {
                const strength = validatePassword(password);
                if (strength.score < 4) {
                    throw new Error('Password is too weak. Please ensure it meets all requirements.');
                }
            }

            const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
            const payload = mode === 'signup'
                ? { name: name.trim(), email: emailNormalized, passwordHash }
                : { email: emailNormalized, passwordHash };

            const response = await apiFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            saveAuthenticatedUser(data.user || data);
        } catch (err) {
            console.error('Auth error', err);
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-300 z-10 hover:scale-110 active:scale-95 hover:text-gray-700 dark:hover:text-gray-400 will-change-transform"
                >
                    <X size={20} className="animated-cross text-gray-500" />
                </button>

                <div className="p-6 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-red-400 text-transparent bg-clip-text">
                            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base font-['Cambria_Math']">
                            {mode === 'signin' ? 'Sign in to continue your journey' : 'Join EzStudy and start learning'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none dark:text-white"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none dark:text-white"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                value={password}
                                onChange={handlePasswordChange}
                                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {mode === 'signup' && password && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Password Strength</span>
                                    <span className={`text-xs font-semibold ${getPasswordStrengthColor()}`}>
                                        {getPasswordStrengthText()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score <= 2 ? 'bg-red-500' :
                                            passwordStrength.score <= 3 ? 'bg-yellow-500' :
                                                passwordStrength.score <= 4 ? 'bg-blue-500' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                    ></div>
                                </div>
                                {passwordStrength.feedback.length > 0 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                        {passwordStrength.feedback.map((item, index) => (
                                            <div key={index} className="flex items-center gap-1">
                                                <span className="text-red-400">•</span>
                                                <span>Requires {item.toLowerCase()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                mode === 'signin' ? 'Sign In' : 'Sign Up'
                            )}
                        </button>

                        <div className="relative py-1">
                            <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-2 text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800">
                                or continue with
                            </span>
                        </div>

                        {GOOGLE_CLIENT_ID ? (
                            <div className="w-full flex flex-col items-center">
                                <div ref={googleButtonRef} className="w-full flex justify-center" />
                                {isGoogleLoading && (
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Authenticating with Google...</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                                Google auth is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend env.
                            </p>
                        )}
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                            <button
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                className="ml-2 text-blue-600 dark:text-blue-400 font-bold hover:underline transition-all duration-200 hover:text-blue-700 dark:hover:text-blue-300 hover:scale-105 active:scale-95"
                            >
                                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
