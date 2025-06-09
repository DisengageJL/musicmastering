'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: "🎵",
      title: "AI-Powered Mastering",
      description: "Advanced artificial intelligence analyzes your track and applies professional-grade mastering techniques automatically."
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Get your professionally mastered track in minutes, not hours. Upload, process, and download in under 5 minutes."
    },
    {
      icon: "🎛️",
      title: "Multiple Presets",
      description: "Choose from genre-specific presets or upload a reference track for custom mastering that matches your vision."
    },
    {
      icon: "💾",
      title: "Smart Storage",
      description: "30-day download access with unlimited free reprocessing for subscribers. Never lose your work."
    }
  ];

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-white">🎵 MasterAI</div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={() => window.location.href = '/subscribe'}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10">
              <div className="px-6 py-4 space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  Pricing
                </button>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <button 
                    onClick={() => window.location.href = '/login'}
                    className="block w-full text-left text-gray-300 hover:text-white transition-colors"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => window.location.href = '/subscribe'}
                    className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Professional Audio
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}Mastering{" "}
            </span>
            Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12">
            Transform your tracks into radio-ready masterpieces with AI-powered mastering. 
            Professional studio quality in minutes, not hours.
          </p>

          {/* Single Hero CTA */}
          <button 
            onClick={() => window.location.href = '/generator'}
            className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xl rounded-2xl shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 transition-all duration-300"
          >
            Start Mastering Your Track
          </button>

          <p className="text-gray-400 mt-8">
            🔒 Secure payment • ⚡ Processing starts immediately • 💾 30-day download access
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose MasterAI?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional mastering made accessible with cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 bg-gradient-to-br from-slate-800/50 to-purple-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Start with a single track or go unlimited for serious creators
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Single Track */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Single Track</h3>
                <div className="text-5xl font-bold text-white mb-4">$5</div>
                <p className="text-gray-300">Perfect for trying us out</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Professional AI mastering
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  High-quality WAV download (48kHz/24-bit)
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Instant download only
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  No re-downloads or account access
                </li>
              </ul>
              
              <button 
                onClick={() => window.location.href = '/generator'}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300"
              >
                Try Single Track
              </button>
            </div>

            {/* Unlimited Monthly */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 relative hover:border-purple-500/50 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  MOST POPULAR
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Unlimited Monthly</h3>
                <div className="text-5xl font-bold text-white mb-4">
                  $20<span className="text-lg text-gray-300">/month</span>
                </div>
                <p className="text-gray-300">For serious creators</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited track processing
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30-day downloads + unlimited reprocessing
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Account dashboard & processing history
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority processing & support
                </li>
              </ul>
              
              <button 
                onClick={() => window.location.href = '/subscribe'}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Start Unlimited Plan
              </button>
            </div>
          </div>

          {/* Storage Policy Explanation */}
          <div className="mt-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8">
            <h4 className="text-2xl font-bold text-white mb-6 text-center">📁 Download & Storage Options</h4>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-4xl mb-4">⚡</div>
                <h5 className="font-bold text-white mb-2 text-lg">One-Time Purchase</h5>
                <p className="text-gray-300">Instant download only - perfect for single tracks</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-4xl mb-4">🔄</div>
                <h5 className="font-bold text-white mb-2 text-lg">Subscription Benefits</h5>
                <p className="text-gray-300">30-day re-downloads + unlimited reprocessing</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-4xl mb-4">💾</div>
                <h5 className="font-bold text-white mb-2 text-lg">Account Dashboard</h5>
                <p className="text-gray-300">Track history, settings, and easy reprocessing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Master Your Sound?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your tracks into professional-quality masterpieces with AI-powered mastering.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <button 
              onClick={() => window.location.href = '/generator'}
              className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xl rounded-xl shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 transition-all duration-300"
            >
              Try Single Track - $5
            </button>
            <button 
              onClick={() => window.location.href = '/subscribe'}
              className="px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl rounded-xl shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-2 transition-all duration-300"
            >
              Go Unlimited - $20/month
            </button>
          </div>

          {/* Additional CTA for existing users */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-gray-400 mb-4">Already have an account?</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-6 py-3 border-2 border-white/20 hover:border-white/40 text-white rounded-xl font-semibold transition-colors"
            >
              Log In to Dashboard
            </button>
          </div>

          <p className="text-gray-400 mt-8">
            🔒 Secure payment • ⚡ Processing starts immediately • 💾 30-day download access
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">🎵 MasterAI</div>
              <p className="text-gray-400 text-sm">
                Professional audio mastering powered by artificial intelligence. 
                Transform your tracks into radio-ready masterpieces.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => window.location.href = '/generator'} className="hover:text-white transition-colors">Try It Now</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Account</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => window.location.href = '/login'} className="hover:text-white transition-colors">Log In</button></li>
                <li><button onClick={() => window.location.href = '/subscribe'} className="hover:text-white transition-colors">Sign Up</button></li>
                <li><button onClick={() => window.location.href = '/dashboard'} className="hover:text-white transition-colors">Dashboard</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="mailto:help@masterai.com" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 MasterAI. All rights reserved. Made with ❤️ for creators worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}