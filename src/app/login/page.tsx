'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate login API call
      console.log('Logging in:', { email, password });
      
      // Simulate successful login
      const loginData = {
        email,
        isLoggedIn: true,
        subscriptionStatus: 'active',
        loginTime: Date.now()
      };
      
      sessionStorage.setItem('userSession', JSON.stringify(loginData));
      
      setTimeout(() => {
        // Check if there's a pending track to process
        const pendingTrack = sessionStorage.getItem('pendingTrackData');
        
        if (pendingTrack) {
          // User was in the middle of processing, send them there
          const trackData = JSON.parse(pendingTrack);
          const params = new URLSearchParams({
            track: trackData.sourceFile?.name || 'Your Track',
            preset: trackData.preset || 'Hip Hop',
            mode: trackData.masteringMode || 'preset',
            hasReference: trackData.referenceFile ? 'true' : 'false',
            paymentConfirmed: 'true',
            paymentId: 'subscription-login',
            subscription: 'true'
          });
          window.location.href = `/processing?${params}`;
        } else {
          // No pending track, send to dashboard
          window.location.href = '/dashboard';
        }
      }, 1500);
      
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Please enter your email address first');
      return;
    }
    
    // Simulate password reset
    alert(`Password reset link sent to ${email}`);
    setShowForgotPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      
      {/* Back to Home */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>

      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-white mb-2">🎵 MasterAI</div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign in to your account to continue mastering</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          
          {!showForgotPassword ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          ) : (
            // Forgot Password Form
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h2>
                <p className="text-gray-600 text-sm">Enter your email to receive a reset link</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 transition-colors"
                >
                  Back to Login
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  Send Reset Link
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm">
              Don't have an account?{' '}
              <button 
                onClick={() => window.location.href = '/subscribe'}
                className="text-purple-600 hover:text-purple-800 font-semibold"
              >
                Sign up for unlimited mastering
              </button>
            </p>
          </div>
        </div>

        {/* Demo Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setEmail('demo@masterai.com');
              setPassword('demo123');
            }}
            className="text-gray-400 hover:text-gray-300 text-sm underline"
          >
            Use demo credentials
          </button>
        </div>
      </div>
    </div>
  );
}