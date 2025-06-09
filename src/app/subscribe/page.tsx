'use client';

import { useState } from 'react';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [billingName, setBillingName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubscribe = async () => {
    if (!email || !password || !confirmPassword || !cardNumber || !expiryDate || !cvv || !billingName) {
      alert('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate subscription signup
      console.log('Creating subscription:', { email, billingName });
      
      const subscriptionData = {
        email,
        isLoggedIn: true,
        subscriptionStatus: 'active',
        joinDate: new Date().toLocaleDateString(),
        subscriptionId: 'sub_' + Date.now()
      };
      
      sessionStorage.setItem('userSession', JSON.stringify(subscriptionData));
      setShowSuccess(true);
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
      
    } catch (error) {
      console.error('Subscription failed:', error);
      alert('Subscription failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    console.log('🚀 Skipping payment for demo...');
    setShowSuccess(true);
    
    setTimeout(() => {
      const demoData = {
        email: email || 'demo@masterai.com',
        isLoggedIn: true,
        subscriptionStatus: 'active',
        joinDate: new Date().toLocaleDateString(),
        subscriptionId: 'demo-subscription'
      };
      sessionStorage.setItem('userSession', JSON.stringify(demoData));
      window.location.href = '/dashboard';
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Welcome to MasterAI! 🎉</h1>
          <p className="text-gray-300 mb-6">
            Your unlimited subscription is now active! Redirecting you to your dashboard...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
      
      {/* Header */}
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-2xl font-bold">🎵 MasterAI</span>
        </button>
        <div className="text-gray-300 text-sm">
          Already have an account?{' '}
          <button 
            onClick={() => window.location.href = '/login'}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Sign In
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Unlimited AI Mastering
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join thousands of creators with unlimited professional mastering for just $20/month
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Subscription Benefits */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlimited Monthly</h3>
                <div className="text-5xl font-bold text-white mb-4">
                  $20<span className="text-lg text-gray-300">/month</span>
                </div>
                <p className="text-gray-300">Everything you need to master professionally</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited track processing every month
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30-day re-downloads for all tracks
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Account dashboard with full history
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited free reprocessing anytime
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All genre presets & reference matching
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority processing & support
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cancel anytime, no commitments
                </li>
              </ul>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h4 className="text-blue-300 font-semibold text-sm mb-1">💡 Value Comparison</h4>
                <p className="text-gray-300 text-sm">
                  Just 4 single tracks ($20) = 1 month unlimited access. Process 10+ tracks and save hundreds!
                </p>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Your Account</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Create Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Re-enter your password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            {/* Subscribe Button */}
            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-white transition-all duration-200 ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Subscribe & Create Account - $20/month'
              )}
            </button>

            {/* Demo Skip Button */}
            <button
              onClick={handleSkipPayment}
              className="w-full mt-3 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 rounded-xl font-semibold transition-all duration-200"
            >
              Skip Payment (Demo Mode)
            </button>

            {/* Security Notice */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-2">
                🔒 Secured by 256-bit SSL encryption
              </p>
              <p className="text-xs text-gray-500">
                By subscribing, you agree to our Terms of Service and Privacy Policy. Cancel anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Trusted by thousands of musicians worldwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-50">
            <div className="text-white font-bold">VISA</div>
            <div className="text-white font-bold">MASTERCARD</div>
            <div className="text-white font-bold">STRIPE</div>
            <div className="text-white font-bold">SSL</div>
          </div>
        </div>
      </div>
    </div>
  );
}