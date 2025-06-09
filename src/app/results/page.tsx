'use client';

import { useState, useRef, useEffect } from 'react';

type UserType = 'single' | 'subscription' | null;

interface Status {
  type: 'error' | 'success' | 'info' | '';
  message: string;
}

interface TrackData {
  title: string;
  originalFile: string;
  masteredFile: string;
  preset: string;
  processingTime: string;
  improvements: {
    loudness: string;
    dynamicRange: string;
    stereoWidth: string;
    frequency: string;
  };
}

export default function ResultsPage() {
  const [isPlaying, setIsPlaying] = useState({ original: false, mastered: false });
  const [currentTime, setCurrentTime] = useState({ original: 0, mastered: 0 });
  const [duration, setDuration] = useState({ original: 0, mastered: 0 });
  const [volume, setVolume] = useState({ original: 0.8, mastered: 0.8 });
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalStep, setSubscriptionModalStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const masteredAudioRef = useRef<HTMLAudioElement>(null);

  // Company name - easily configurable
  const COMPANY_NAME = "MasterAI";

  // Mock data - in real app this would come from URL params/API
  const trackData: TrackData = {
    title: "My Awesome Track",
    originalFile: "original_track.wav",
    masteredFile: "mastered_track.wav",
    preset: "Hip Hop",
    processingTime: "2m 34s",
    improvements: {
      loudness: "+12 LUFS",
      dynamicRange: "Optimized",
      stereoWidth: "+15%",
      frequency: "Enhanced"
    }
  };

  // Generate working demo audio
  const generateDemoAudio = (type: 'original' | 'mastered'): string => {
    try {
      // Create a simple sine wave audio data URI
      const sampleRate = 44100;
      const duration = 10; // 10 seconds
      const samples = sampleRate * duration;
      
      // Create WAV file buffer
      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples * 2, true);
      
      // Generate audio data
      for (let i = 0; i < samples; i++) {
        const time = i / sampleRate;
        let sample = 0;
        
        if (type === 'original') {
          // Original: Simple tone with some harmonics
          sample = Math.sin(2 * Math.PI * 440 * time) * 0.3 +
                  Math.sin(2 * Math.PI * 880 * time) * 0.1 +
                  (Math.random() - 0.5) * 0.02; // Light noise
        } else {
          // Mastered: Richer harmonic content
          sample = Math.sin(2 * Math.PI * 440 * time) * 0.4 +
                  Math.sin(2 * Math.PI * 880 * time) * 0.2 +
                  Math.sin(2 * Math.PI * 1320 * time) * 0.1 +
                  Math.sin(2 * Math.PI * 220 * time) * 0.15;
        }
        
        // Apply fade in/out
        const fadeTime = 0.1;
        if (time < fadeTime) {
          sample *= time / fadeTime;
        } else if (time > duration - fadeTime) {
          sample *= (duration - time) / fadeTime;
        }
        
        // Convert to 16-bit PCM
        const value = Math.max(-1, Math.min(1, sample));
        view.setInt16(44 + i * 2, value * 0x7FFF, true);
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating demo audio:', error);
      // Fallback to silent audio
      return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVFYAAFRWAAABAAgAZGF0YQAAAAA=';
    }
  };

  useEffect(() => {
    // Determine user type from URL parameters or session storage
    const searchParams = new URLSearchParams(window.location.search);
    const paymentConfirmed = sessionStorage.getItem('paymentConfirmed');
    
    if (paymentConfirmed) {
      const paymentData = JSON.parse(paymentConfirmed);
      setUserType(paymentData.paymentType === 'monthly' ? 'subscription' : 'single');
    } else {
      setUserType('single'); // Default for demo
    }

    // Set up demo audio
    if (originalAudioRef.current) {
      originalAudioRef.current.src = generateDemoAudio('original');
      originalAudioRef.current.volume = volume.original;
      originalAudioRef.current.load();
    }
    
    if (masteredAudioRef.current) {
      masteredAudioRef.current.src = generateDemoAudio('mastered');
      masteredAudioRef.current.volume = volume.mastered;
      masteredAudioRef.current.load();
    }
  }, []);

  // Countdown timer for subscription modal
  useEffect(() => {
    if (showSubscriptionModal && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showSubscriptionModal, timeLeft]);

  const togglePlayback = (type: 'original' | 'mastered') => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    const otherAudioRef = type === 'original' ? masteredAudioRef : originalAudioRef;
    
    if (!audioRef.current) return;

    // Pause the other audio
    if (otherAudioRef.current) {
      otherAudioRef.current.pause();
      setIsPlaying(prev => ({ ...prev, [type === 'original' ? 'mastered' : 'original']: false }));
    }

    if (isPlaying[type]) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log('Play failed:', e));
    }
    
    setIsPlaying(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleTimeUpdate = (type: 'original' | 'mastered') => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    if (audioRef.current) {
      setCurrentTime(prev => ({ ...prev, [type]: audioRef.current!.currentTime }));
    }
  };

  const handleLoadedMetadata = (type: 'original' | 'mastered') => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    if (audioRef.current) {
      setDuration(prev => ({ ...prev, [type]: audioRef.current!.duration }));
    }
  };

  const handleSeek = (type: 'original' | 'mastered', time: number) => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(prev => ({ ...prev, [type]: time }));
    }
  };

  const handleVolumeChange = (type: 'original' | 'mastered', newVolume: number) => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(prev => ({ ...prev, [type]: newVolume }));
    }
  };

  const formatTime = (time: number) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateMasteredFilename = (originalName: string) => {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}_mastered_${COMPANY_NAME}.mp3`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate download progress
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsDownloading(false);
          setDownloadComplete(true);
          
          // Show subscription modal for single users after download
          if (userType === 'single') {
            setTimeout(() => {
              setShowSubscriptionModal(true);
            }, 1000);
          }
          
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 100);

    try {
      // In real app, this would be the actual download
      const masteredFilename = generateMasteredFilename(trackData.title);
      
      // Create download link
      const link = document.createElement('a');
      link.href = masteredAudioRef.current?.src || '#';
      link.download = masteredFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Downloaded as: ${masteredFilename}`);
      
    } catch (error) {
      console.error('Download failed:', error);
      clearInterval(progressInterval);
      setIsDownloading(false);
    }
  };

  const handleSubscriptionUpgrade = () => {
    console.log('Redirecting to Stripe checkout for $15/month...');
    
    // Store subscription intent
    sessionStorage.setItem('subscriptionUpgrade', JSON.stringify({
      fromSingle: true,
      offer: 15,
      timestamp: Date.now()
    }));
    
    // In real app, redirect to Stripe
    window.location.href = '/api/checkout?plan=monthly&offer=15';
  };

  const handleModalClose = () => {
    if (subscriptionModalStep === 1) {
      setSubscriptionModalStep(2); // Show warning step
    } else {
      setShowSubscriptionModal(false);
      console.log('User declined subscription offer');
    }
  };

  const AudioPlayer = ({ type, title }: { type: 'original' | 'mastered', title: string }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-gray-500">{formatTime(duration[type])}</span>
        </div>
      </div>

      <audio
        ref={type === 'original' ? originalAudioRef : masteredAudioRef}
        onTimeUpdate={() => handleTimeUpdate(type)}
        onLoadedMetadata={() => handleLoadedMetadata(type)}
        onEnded={() => setIsPlaying(prev => ({ ...prev, [type]: false }))}
        onError={(e) => console.error(`Audio error for ${type}:`, e)}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Waveform Visualization */}
      <div className="relative mb-4 h-16 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-end space-x-1 h-12">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-gradient-to-t ${
                  type === 'original' 
                    ? 'from-blue-400 to-blue-600' 
                    : 'from-purple-400 to-purple-600'
                } transition-all duration-150`}
                style={{ 
                  height: `${20 + Math.random() * 80}%`,
                  opacity: currentTime[type] / duration[type] > i / 50 ? 1 : 0.3
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Progress overlay */}
        <div 
          className="absolute top-0 left-0 h-full bg-black/10 transition-all duration-100"
          style={{ width: `${(currentTime[type] / duration[type]) * 100 || 0}%` }}
        />
        
        {/* Clickable seek bar */}
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const seekTime = (clickX / rect.width) * duration[type];
            handleSeek(type, seekTime);
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => togglePlayback(type)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              type === 'original'
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-purple-500 hover:bg-purple-600'
            } text-white shadow-lg hover:shadow-xl transform hover:scale-105`}
          >
            {isPlaying[type] ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <div className="text-sm text-gray-600">
            {formatTime(currentTime[type])} / {formatTime(duration[type])}
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume[type]}
            onChange={(e) => handleVolumeChange(type, parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

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
            New Master
          </button>
        </div>
      </nav>

      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Mastering Complete!</h1>
            <p className="text-gray-300">Your track has been professionally mastered using {trackData.preset} preset</p>
            <p className="text-gray-400 text-sm">Processing time: {trackData.processingTime}</p>
          </div>

          {/* Audio Players */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <AudioPlayer type="original" title="Original Track" />
            <AudioPlayer type="mastered" title="Mastered Track" />
          </div>

          {/* Improvements Stats */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Improvements Applied</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(trackData.improvements).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{value}</div>
                  <div className="text-sm text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                isDownloading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              }`}
            >
              {isDownloading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Downloading... {Math.round(downloadProgress)}%</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Mastered Track
                </>
              )}
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors backdrop-blur-sm"
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share Results
            </button>

            <button
              onClick={() => window.location.href = '/generator'}
              className="px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white rounded-xl font-semibold transition-colors"
            >
              Master Another Track
            </button>
          </div>

          {/* Progress Bar for Download */}
          {isDownloading && (
            <div className="max-w-md mx-auto mb-8">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            {subscriptionModalStep === 1 ? (
              // Step 1: Offer
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 Special One-Time Offer!</h2>
                  <p className="text-gray-600">Upgrade to unlimited mastering for just</p>
                  <div className="text-4xl font-bold text-green-600 my-4">$15<span className="text-lg text-gray-500">/month</span></div>
                  <p className="text-sm text-gray-500">Regular price: $29/month</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Re-download anytime</p>
                      <p className="text-sm text-gray-600">Access your mastered tracks forever</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold text-red-800">Limited Time Offer</p>
                  </div>
                  <p className="text-sm text-red-700">
                    This 50% discount expires in <span className="font-bold">{formatCountdown(timeLeft)}</span>
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSubscriptionUpgrade}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:-translate-y-1 shadow-lg"
                  >
                    Upgrade Now - $15/month
                  </button>
                  <button
                    onClick={handleModalClose}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            ) : (
              // Step 2: Warning
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">⚠️ Important Warning</h2>
                  <p className="text-gray-600">Before you leave this page...</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-yellow-800 mb-3">You will lose access to:</h3>
                  <ul className="space-y-2 text-yellow-700">
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Your mastered track download</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>This 50% discount (regular price $29/month)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Future access without repaying</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2">
                    To download this track again, you'll need to pay full price: <span className="font-bold">$9.99</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Upgrade now and save money on future mastering!
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleSubscriptionUpgrade}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:-translate-y-1 shadow-lg"
                  >
                    Keep My Discount - $15/month
                  </button>
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    I Understand, Continue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Share Your Master</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {['Twitter', 'Facebook', 'Instagram', 'Copy Link'].map((platform) => (
                <button
                  key={platform}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
                  onClick={() => {
                    console.log(`Share to ${platform}`);
                    setShowShareModal(false);
                  }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {platform[0]}
                  </div>
                  <span className="font-medium text-gray-700">Share on {platform}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Unlimited track mastering</p>
                      <p className="text-sm text-gray-600">Master as many tracks as you want</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Priority processing</p>
                      <p className="text-sm text-gray-600">Skip the queue and get faster results</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Advanced presets</p>
                      <p className="text-sm text-gray-600">Access to premium mastering algorithms</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20