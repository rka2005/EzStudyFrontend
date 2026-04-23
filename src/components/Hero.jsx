import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { ArrowRight, Zap, Clock, Target, Bot, Sparkles, BookOpen, Brain } from "lucide-react";

const Hero = ({ onDemoClick, isReady, user, onLoginClick, onSignupClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const handleGoToConsole = () => {
    navigate('/ai-console');
  };

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  return (
    <section className="w-full min-h-screen lg:h-screen flex flex-col lg:flex-row items-center justify-center text-center lg:text-left bg-gradient-to-br from-slate-50 via-white to-blue-50/80 dark:from-gray-950 dark:via-[#0a0a1a] dark:to-indigo-950/50 px-4 sm:px-6 lg:px-16 pt-32 pb-12 lg:py-0 overflow-hidden relative noise-overlay">
      {/* Animated Mesh Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute -top-20 -left-20 w-64 sm:w-[500px] h-64 sm:h-[500px] bg-gradient-to-br from-blue-400/20 to-indigo-500/10 dark:from-blue-500/10 dark:to-indigo-600/5 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-64 sm:w-[400px] h-64 sm:h-[400px] bg-gradient-to-br from-purple-400/15 to-pink-500/10 dark:from-purple-600/8 dark:to-pink-600/5 rounded-full blur-3xl animate-float-reverse"></div>
        <div className="hidden md:block absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-rose-300/10 to-orange-300/10 dark:from-rose-500/5 dark:to-orange-500/3 rounded-full blur-3xl animate-float"></div>

        {/* Decorative dots grid */}
        <div className="hidden lg:block absolute top-20 left-10 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            width: '200px',
            height: '200px'
          }}
        ></div>
        <div className="hidden lg:block absolute bottom-40 right-20 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            width: '150px',
            height: '150px'
          }}
        ></div>
      </div>

      {/* Decorative gradient line at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

      {/* Content */}
      <div className={`flex-1 space-y-5 sm:space-y-7 z-10 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {/* Badge */}
        <div className="flex justify-center lg:justify-start">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold border border-indigo-100 dark:border-indigo-800/40 backdrop-blur-sm shimmer">
            <Sparkles size={14} className="animate-pulse" />
            <span>Powered by Advanced AI</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] max-w-2xl font-['Cambria_Math']">
          <span className="text-gray-900 dark:text-white">Unlock </span>
          <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-transparent bg-clip-text">
            AI Powered Learning
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-xl font-['Cambria_Math'] font-medium leading-relaxed">
          Transform your study with AI insights, tailored plans & smart notes.
          Learn smarter, not harder — with intelligence that adapts to you.
        </p>

        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 pt-1">
          {user ? (
            <button
              onClick={handleGoToConsole}
              className="group px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-sm sm:text-base shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto btn-shine"
            >
              <span>Go to AI Console</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          ) : (
            <button
              onClick={onSignupClick}
              className="group px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-white font-bold rounded-2xl text-sm sm:text-base shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.03] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto btn-shine"
            >
              <span>Start Learning Free</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          )}
          <Link to="/#about" className="group px-6 sm:px-8 py-3 bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm sm:text-base hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.03] active:scale-95 transition-all duration-300 w-full sm:w-auto text-center flex items-center justify-center gap-2">
            Explore Features
            <span className="group-hover:translate-y-0.5 transition-transform duration-300 opacity-50">↓</span>
          </Link>
        </div>

        {/* Feature Pills with smooth animated hover */}
        <div className="flex flex-wrap gap-3 pt-3 justify-center lg:justify-start">
          {[
            { label: "AI-Powered", icon: Brain, color: "blue" },
            { label: "Personalized", icon: BookOpen, color: "purple" },
            { label: "Adaptive", icon: Target, color: "rose" }
          ].map(({ label, icon: Icon, color }) => (
            <span
              key={label}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-default transition-all duration-300 hover:scale-105
                ${color === 'blue' ? 'bg-blue-50/80 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 hover:shadow-lg hover:shadow-blue-200/40 dark:hover:shadow-blue-900/30' : ''}
                ${color === 'purple' ? 'bg-purple-50/80 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/30 hover:shadow-lg hover:shadow-purple-200/40 dark:hover:shadow-purple-900/30' : ''}
                ${color === 'rose' ? 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30 hover:shadow-lg hover:shadow-rose-200/40 dark:hover:shadow-rose-900/30' : ''}
              `}
            >
              <Icon size={14} className="group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Animations - Enhanced Card */}
      <div className={`flex-1 flex flex-col items-center justify-center mt-12 lg:mt-0 relative z-10 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="relative w-full max-w-md">
          {/* Decorative tilted cards behind */}
          <div className="absolute -top-5 -left-5 w-full h-full bg-gradient-to-br from-blue-200/60 to-indigo-200/60 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl rotate-6 shadow-lg animate-float-slow"></div>
          <div className="absolute -top-2.5 -left-2.5 w-full h-full bg-gradient-to-br from-indigo-200/60 to-purple-200/60 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl -rotate-3 shadow-lg animate-float-reverse"></div>

          {/* Lottie Animation Container - Glassmorphism */}
          <div className="relative p-5 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 flex flex-col items-center justify-center backdrop-blur-xl bg-white/80 dark:bg-gray-900/60 group hover:scale-[1.02] transition-all duration-500 glow-blue">
            {/* Zap badge */}
            <div className="absolute -right-3 -top-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/30 z-20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Zap size={16} fill="currentColor" />
            </div>

            <div className="w-full h-32 overflow-hidden flex items-center justify-center rounded-xl">
              <DotLottieReact
                src="https://lottie.host/940d982d-7f6f-4100-b740-e874954cea02/HIYUCWcoQJ.lottie"
                loop
                autoplay
                style={{ height: '128px' }}
              />
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-700 to-transparent rounded-full my-3"></div>

            <div className="w-full h-32 overflow-hidden flex items-center justify-center rounded-xl">
              <DotLottieReact
                src="https://lottie.host/a33024c3-2554-45d7-8959-ef10c82ccb96/Z2KJN74cgJ.lottie"
                loop
                autoplay
                style={{ height: '128px' }}
              />
            </div>

            {/* Stats Section - Enhanced */}
            <div className="grid grid-cols-3 gap-3 w-full mt-4 text-center">
              {[
                { icon: Clock, value: "24/7", label: "Learning", color: "blue", hoverColor: "indigo" },
                { icon: Target, value: "100%", label: "Personalized", color: "purple", hoverColor: "pink" },
                { icon: Bot, value: "AI", label: "Powered", color: "rose", hoverColor: "orange" }
              ].map(({ icon: Icon, value, label, color, hoverColor }) => (
                <div key={label} className={`group bg-gray-50/80 dark:bg-gray-800/40 p-2 rounded-xl hover:bg-${color === 'rose' ? 'rose' : color}-50 dark:hover:bg-${color === 'rose' ? 'rose' : color}-900/20 transition-all duration-300 cursor-pointer border border-transparent hover:border-${color === 'rose' ? 'rose' : color}-100 dark:hover:border-${color === 'rose' ? 'rose' : color}-800/30`}>
                  <div className="flex items-center justify-center mb-1">
                    <Icon size={16} className={`text-${color === 'rose' ? 'rose' : color}-500 dark:text-${color === 'rose' ? 'rose' : color}-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`} />
                  </div>
                  <p className={`text-base font-bold text-${color === 'rose' ? 'rose' : color}-600 dark:text-${color === 'rose' ? 'rose' : color}-400 transition-colors duration-300`}>{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;