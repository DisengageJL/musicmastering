'use client';

import { useState, useEffect } from 'react';

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'monthly'>('single');
  const [loading, setLoading] = useState(false);
  const [trackInfo, setTrackInfo] = useState({
    name: '',
    preset: '',
    mode: '',
    hasReference: false
  });

  const COMPANY_NAME = "MasterAI";

  useEffect(() => {
    // Get track info from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    setTrackInfo({
      name: searchParams.get('track') || 'Your Track',
      preset: searchParams.get('preset') || 'Hip Hop',
      mode: searchParams.get('mode') || 'preset',
      hasReference: searchParams.get('hasReference') === 'true'
    });
  }, []);

  const plans = {
    single: {
      name: 'Single Track',
      price: 5.00,
      description: 'One-time payment for this track',
      features: [
        'Professional AI mastering',
        'High-quality output',
        'Download once',
        'Standard processing'
      ],
      buttonText: 'Pay $5.00',
      popular: false
    },
    monthly: {
      name: 'Monthly Unlimited',
      price: 15.00,
      description: 'Unlimited mastering for 30 days',
      features: [
        'Unlimited track mastering',
        'Priority processing',
        'Advanced presets',
        'Re-download anytime',
        'Premium support'
      ],
      buttonText: 'Start Subscription',
      popular: true
    }
  };

  const handlePayment = async (planType: 'single' | 'monthly') => {
    setLoading(true);
    
    try {
      console.log(`🔐 Processing ${planType} payment for track: ${trackInfo.name}`);
      
      // Store payment intent
      const paymentData = {
        planType,
        amount: plans[planType].price,
        trackName: trackInfo.name,
        preset: trackInfo.preset,
        mode: trackInfo.mode,
        hasReference: trackInfo.hasReference,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
      
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceType: planType,
          trackInfo: trackInfo,
          successUrl: `${window.location.origin}/processing?paymentConfirmed=true&track=${encodeURIComponent(trackInfo.name)}&preset=${encodeURIComponent(trackInfo.preset)}&mode=${trackInfo.mode}&hasReference=${trackInfo.hasReference}`,
          cancelUrl: window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="px-6 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-white">🎵 {COMPANY_NAME}</div>
          <button 
            onClick={() => window.location.href = '/generator'}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Back to Generator
          </button>
        </div>
      </nav>

      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
            <p className="text-gray-300 text-lg">
              Ready to master "{trackInfo.name}" using {trackInfo.preset} preset
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Processing mode: {trackInfo.mode === 'reference' ? 'Reference Track Matching' : 'AI Preset Optimization'}
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {Object.entries(plans).map(([planKey, plan]) => (
              <div 
                key={planKey}
                className={`relative bg-white rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-purple-500' : ''
                } ${
                  selectedPlan === planKey ? 'ring-4 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedPlan(planKey as 'single' | 'monthly')}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    ${plan.price}
                    {planKey === 'monthly' && <span className="text-lg text-gray-500">/month</span>}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePayment(planKey as 'single' | 'monthly')}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-200 ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                        : 'bg-gray-800 hover:bg-gray-900 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    plan.buttonText
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Security & Trust */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center space-x-8 text-white">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm">Powered by Stripe</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">30-Day Money Back</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-300 text-sm">Yes, you can cancel your subscription at any time. No long-term commitments.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">What file formats do you support?</h4>
                <p className="text-gray-300 text-sm">We support MP3, WAV, FLAC, AAC, and OGG files up to 100MB.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">How long does processing take?</h4>
                <p className="text-gray-300 text-sm">Most tracks are processed in under 3 minutes. Subscribers get priority processing.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <h4 className="font-semibold text-white mb-2">What's included in mastering?</h4>
                <p className="text-gray-300 text-sm">EQ optimization, compression, stereo enhancement, and loudness normalization for streaming platforms.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}