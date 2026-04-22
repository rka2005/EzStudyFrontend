import React, { useEffect, useRef, useState } from 'react';
import { Brain, BookOpen, BarChart3, Bot, Sparkles, GraduationCap, Lightbulb, Rocket } from 'lucide-react';

const useScrollReveal = () => {
  const ref = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isRevealed];
};

const About = () => {
  const [headerRef, headerRevealed] = useScrollReveal();
  const [cardsRef, cardsRevealed] = useScrollReveal();
  const [statsRef, statsRevealed] = useScrollReveal();

  return (
    <section id="about" className="w-full py-16 sm:py-28 bg-gray-50/50 dark:bg-[#0a0a1a] text-gray-900 dark:text-gray-100 flex flex-col items-center px-4 sm:px-6 lg:px-20 transition-colors duration-500 scroll-mt-20 sm:scroll-mt-24 relative overflow-hidden noise-overlay">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-400/5 to-purple-400/5 dark:from-blue-500/3 dark:to-purple-500/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 w-[350px] h-[350px] bg-gradient-to-br from-purple-400/5 to-pink-400/5 dark:from-purple-500/3 dark:to-pink-500/3 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div
        ref={headerRef}
        className={`max-w-4xl text-center z-10 transition-all duration-1000 ${headerRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold border border-indigo-100 dark:border-indigo-800/40 mb-6 backdrop-blur-sm">
          <GraduationCap size={14} />
          <span>Why EzStudy?</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-transparent bg-clip-text drop-shadow-lg font-['Cambria_Math']">
          About Personalized Learning AI
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto font-['Cambria_Math']">
          Our AI-powered learning platform adapts to your strengths and weaknesses, offering personalized
          study materials, real-time feedback, and AI-generated notes to help you learn more efficiently.
        </p>
      </div>

      {/* Stats row */}
      <div
        ref={statsRef}
        className={`flex flex-wrap justify-center gap-6 sm:gap-10 mt-10 z-10 transition-all duration-1000 delay-200 ${statsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {[
          { value: "10x", label: "Faster Learning", icon: Rocket },
          { value: "24/7", label: "AI Assistance", icon: Bot },
          { value: "∞", label: "Practice Questions", icon: Lightbulb }
        ].map(({ value, label, icon: Icon }, i) => (
          <div key={label} className="group flex flex-col items-center gap-2 cursor-default" style={{ transitionDelay: `${i * 100}ms` }}>
            <div className="flex items-center gap-2">
              <Icon size={20} className="text-indigo-500 dark:text-indigo-400 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
              <span className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-500 text-transparent bg-clip-text font-['Cambria_Math']">{value}</span>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium font-['Cambria_Math']">{label}</span>
          </div>
        ))}
      </div>

      {/* Feature Cards */}
      <div
        ref={cardsRef}
        className="mt-14 sm:mt-20 max-w-6xl text-center w-full z-10"
      >
        <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-14 bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-transparent bg-clip-text font-['Cambria_Math'] transition-all duration-1000 ${cardsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Why Choose Our AI?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {[
            { icon: Brain, title: "Adaptive Learning", description: "AI adjusts content to your learning pace and style, ensuring optimal knowledge retention.", color: "blue", delay: 0 },
            { icon: BookOpen, title: "Smart Notes", description: "AI summarizes key points from PDFs and lectures into beautiful, digestible study notes.", color: "purple", delay: 100 },
            { icon: BarChart3, title: "Progress Tracking", description: "Monitor your performance with AI-powered insights and detailed analytics.", color: "indigo", delay: 200 },
            { icon: Bot, title: "AI Tutor", description: "Get AI-driven explanations, interactive quizzes, and step-by-step guidance.", color: "rose", delay: 300 }
          ].map(({ icon, title, description, color, delay }) => (
            <FeatureCard
              key={title}
              icon={icon}
              title={title}
              description={description}
              color={color}
              isRevealed={cardsRevealed}
              delay={delay}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, description, color, isRevealed, delay }) => {
  const colorClasses = {
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
      iconText: 'text-blue-500 dark:text-blue-400',
      hoverBorder: 'hover:border-blue-200 dark:hover:border-blue-800/50',
      hoverShadow: 'hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20',
      glow: 'group-hover:shadow-blue-500/20'
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-950/40',
      iconText: 'text-purple-500 dark:text-purple-400',
      hoverBorder: 'hover:border-purple-200 dark:hover:border-purple-800/50',
      hoverShadow: 'hover:shadow-purple-100/50 dark:hover:shadow-purple-900/20',
      glow: 'group-hover:shadow-purple-500/20'
    },
    indigo: {
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',
      iconText: 'text-indigo-500 dark:text-indigo-400',
      hoverBorder: 'hover:border-indigo-200 dark:hover:border-indigo-800/50',
      hoverShadow: 'hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20',
      glow: 'group-hover:shadow-indigo-500/20'
    },
    rose: {
      iconBg: 'bg-rose-50 dark:bg-rose-950/40',
      iconText: 'text-rose-500 dark:text-rose-400',
      hoverBorder: 'hover:border-rose-200 dark:hover:border-rose-800/50',
      hoverShadow: 'hover:shadow-rose-100/50 dark:hover:shadow-rose-900/20',
      glow: 'group-hover:shadow-rose-500/20'
    }
  };

  const c = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`group bg-white/70 dark:bg-gray-900/40 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-2xl lg:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800/50 card-hover ${c.hoverBorder} ${c.hoverShadow} flex flex-col items-center text-center cursor-default transition-all duration-700 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon container with glow ring */}
      <div className={`relative mb-4 sm:mb-6 p-4 rounded-2xl ${c.iconBg} transition-all duration-300 group-hover:scale-110`}>
        <Icon size={36} className={`${c.iconText} transition-all duration-300 group-hover:rotate-6`} />
        {/* Glow ring on hover */}
        <div className={`absolute inset-0 rounded-2xl ${c.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}></div>
      </div>
      <h4 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 text-transparent bg-clip-text group-hover:from-blue-700 group-hover:via-purple-600 group-hover:to-rose-600 transition-all duration-300 font-['Cambria_Math']">
        {title}
      </h4>
      <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg max-w-xs font-['Cambria_Math'] leading-relaxed">{description}</p>
    </div>
  );
};

export default About;
