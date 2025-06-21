'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const COMPANY_NAME = "MasterAI";
  
  const features = [
    {
      icon: "🎛️",
      title: "AI-Powered Mastering",
      description: "State-of-the-art algorithms analyze your track and apply professional mastering techniques automatically."
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Get professional results in under 3 minutes. No more waiting days for mastering engineers."
    },
    {
      icon: "🎯",
      title: "Genre-Optimized",
      description: "Specialized presets for Hip Hop, EDM, Pop, Rock, Jazz, Classical, and more."
    },
    {
      icon: "🔊",
      title: "Streaming Ready",
      description: "Optimized for Spotify, Apple Music, YouTube, and all major streaming platforms."
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      
      {/* Header */}
      <nav className="px-6 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-white">🎵 {COMPANY_NAME}</div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.location.href = '/generator'}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Start Mastering
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Professional Audio
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Mastering with AI
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your music with cutting-edge AI technology. Get radio-ready sound in minutes, 
            not days. Used by thousands of artists worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => window.location.href = '/generator'}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl text-lg transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              Master Your Track Now
            </button>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white font-bold rounded-xl text-lg transition-all duration-200 backdrop-blur-sm"
            >
              Listen to Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">50K+</div>
              <div className="text-gray-300">Tracks Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">&lt; 3min</div>
              <div className="text-gray-300">Average Process Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">4.9/5</div>
              <div className="text-gray-300">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose {COMPANY_NAME}?</h2>
            <p className="text-gray-300 text-lg">Advanced AI technology meets professional audio engineering</p>
          </div>

          {/* Featured Feature */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 text-center">
            <div className="text-6xl mb-6">{features[currentFeature].icon}</div>
            <h3 className="text-2xl font-bold text-white mb-4">{features[currentFeature].title}</h3>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">{features[currentFeature].description}</p>
            
            {/* Progress dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentFeature ? 'bg-purple-400 scale-125' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* All Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:bg-white/10 cursor-pointer ${
                  index === currentFeature ? 'ring-2 ring-purple-400' : ''
                }`}
                onClick={() => setCurrentFeature(index)}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Master Your Music?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of artists who trust {COMPANY_NAME} for professional mastering
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/generator'}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl text-lg transition-all duration-200 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              Start Mastering Now
            </button>
            <button
              onClick={() => window.location.href = '/generator'}
              className="px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white font-bold rounded-xl text-lg transition-all duration-200 backdrop-blur-sm"
            >
              Upload Your Track
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">🎵 {COMPANY_NAME}</div>
              <p className="text-gray-400 text-sm">
                Professional AI-powered audio mastering for musicians, producers, and content creators worldwide.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => window.location.href = '/generator'} className="hover:text-white transition-colors">Audio Mastering</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 {COMPANY_NAME}. All rights reserved. Made with ❤️ for musicians.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}