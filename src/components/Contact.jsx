"use client";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Field, Label, Switch } from "@headlessui/react";
import { Send, MessageSquare } from "lucide-react";

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

export default function Contact() {
  const [agreed, setAgreed] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [sectionRef, sectionRevealed] = useScrollReveal();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) {
      alert("Please agree to the terms and conditions first.");
      return;
    }

    const formData = new FormData(e.target);
    const firstName = formData.get("first-name");
    const lastName = formData.get("last-name");
    const email = formData.get("email");
    const message = formData.get("message");

    const subject = encodeURIComponent(`New EzStudy Message from ${firstName} ${lastName}`);
    const body = encodeURIComponent(
      `Name: ${firstName} ${lastName}\n` +
      `Email: ${email}\n\n` +
      `Message:\n${message}`
    );

    window.location.href = `mailto:atanu.saha2004@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div id="contact" className="relative bg-white dark:bg-[#0a0a1a] px-4 sm:px-6 py-16 sm:py-24 md:py-32 lg:px-8 scroll-mt-20 sm:scroll-mt-24 overflow-hidden noise-overlay">
      {/* Decorative Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl"
      >
        <div
          className="relative left-1/2 -z-10 aspect-[1155/678] w-[40rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#6366f1]/20 to-[#a855f7]/20 dark:from-[#6366f1]/10 dark:to-[#a855f7]/10 opacity-40 sm:w-[72rem]"
        />
      </div>

      {/* Top border line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

      {/* Contact Form */}
      <div
        ref={sectionRef}
        className={`mx-auto max-w-2xl text-center transition-all duration-1000 ${sectionRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold border border-indigo-100 dark:border-indigo-800/40 mb-6 backdrop-blur-sm">
          <MessageSquare size={14} />
          <span>Contact Us</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-rose-500 font-['Cambria_Math']">
          Get in Touch
        </h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-['Cambria_Math']">
          Have questions? Feel free to reach out to us, and we'll respond as
          soon as possible.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`mx-auto mt-10 sm:mt-16 md:mt-20 max-w-xl space-y-5 sm:space-y-6 px-4 sm:px-0 transition-all duration-1000 delay-200 ${sectionRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        {/* Name Fields */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="group relative">
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 font-['Cambria_Math'] mb-1.5">
              First Name
            </label>
            <input
              type="text"
              name="first-name"
<<<<<<< HEAD
              onFocus={() => setFocusedField('first')}
              onBlur={() => setFocusedField(null)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700/50 px-4 py-3 text-gray-900 dark:text-white bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-600 outline-none transition-all text-sm hover:border-gray-300 dark:hover:border-gray-600"
              placeholder="John"
=======
              className="mt-1 sm:mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 sm:px-4 py-2.5 text-gray-900 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Example"
>>>>>>> upstream/master
            />
          </div>
          <div className="group relative">
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 font-['Cambria_Math'] mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              name="last-name"
<<<<<<< HEAD
              onFocus={() => setFocusedField('last')}
              onBlur={() => setFocusedField(null)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700/50 px-4 py-3 text-gray-900 dark:text-white bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-600 outline-none transition-all text-sm hover:border-gray-300 dark:hover:border-gray-600"
              placeholder="Doe"
=======
              className="mt-1 sm:mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 sm:px-4 py-2.5 text-gray-900 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="Example"
>>>>>>> upstream/master
            />
          </div>
        </div>

        {/* Email */}
        <div className="group relative">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 font-['Cambria_Math'] mb-1.5">
            Email
          </label>
          <input
            type="email"
            name="email"
<<<<<<< HEAD
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700/50 px-4 py-3 text-gray-900 dark:text-white bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-600 outline-none transition-all text-sm hover:border-gray-300 dark:hover:border-gray-600"
            placeholder="john@example.com"
=======
            className="mt-1 sm:mt-2 w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 sm:px-4 py-2.5 text-gray-900 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            placeholder="example@example.com"
>>>>>>> upstream/master
          />
        </div>

        {/* Message */}
        <div className="group relative">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-200 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 font-['Cambria_Math'] mb-1.5">
            Message
          </label>
          <textarea
            name="message"
            rows={4}
            onFocus={() => setFocusedField('message')}
            onBlur={() => setFocusedField(null)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700/50 px-4 py-3 text-gray-900 dark:text-white bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-600 outline-none transition-all text-sm resize-none hover:border-gray-300 dark:hover:border-gray-600"
            placeholder="How can we help you?"
          />
        </div>

        {/* Agreement Checkbox */}
        <Field className="flex items-center gap-x-4">
          <Switch
            checked={agreed}
            onChange={setAgreed}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${agreed ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/30" : "bg-gray-300 dark:bg-gray-700"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${agreed ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </Switch>
          <Label className="text-sm text-gray-600 dark:text-gray-400 font-['Cambria_Math']">
            I agree to the{" "}
            <Link
              to="/terms-conditions"
              className="relative text-indigo-600 dark:text-indigo-400 font-semibold hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer font-['Cambria_Math'] transition-colors duration-300"
            >
              terms & conditions.
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:w-full transition-all duration-300 rounded-full"></span>
            </Link>
          </Label>
        </Field>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="group w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 dark:from-indigo-500 dark:via-purple-500 dark:to-blue-500 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 font-['Cambria_Math'] flex items-center justify-center gap-2 btn-shine"
          >
            <span>Send Message</span>
            <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
          </button>
        </div>
      </form>
    </div>
  );
}
