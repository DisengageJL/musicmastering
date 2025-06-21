'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

type UserType = 'single' | 'subscription' | null;

// Client-side analysis interface (your original)
interface AudioAnalysis {
  rms: number;
  peak: number;
  lufs: number;
  dynamicRange: number;
  stereoWidth: number;
  frequencySpectrum: Float32Array;
  spectralCentroid: number;
}

// Server-side FFmpeg processing result interface
interface ProcessingResult {
  success: boolean;
  sessionId: string;
  downloadUrl: string;
  processingTime: number;
  outputSize: number;
  originalAnalysis: ServerAudioAnalysis;
  processedAnalysis: ServerAudioAnalysis;
  improvements: {
    loudnessChange: number;
    dynamicRangeChange: number;
    formatImprovement: string;
    processingApplied: string;
  };
  settings?: any;
}

// Server-side analysis interface (from FFmpeg)
interface ServerAudioAnalysis {
  duration: number;
  sampleRate: number;
  bitrate: number;
  channels: number;
  maxVolume: number;
  meanVolume: number;
  format: string;
}

interface TrackData {
  title: string;
  originalFile: string;
  masteredFile: string;
  preset: string;
  processingTime: string;
  originalAnalysis: AudioAnalysis | null;        // Client-side analysis
  masteredAnalysis: AudioAnalysis | null;        // Client-side analysis
  processingResult: ProcessingResult | null;     // Server-side FFmpeg results
}

interface AudioState {
  original: boolean;
  mastered: boolean;
}

interface TimeState {
  original: number;
  mastered: number;
}

interface VolumeState {
  original: number;
  mastered: number;
}

interface AudioSources {
  original: string;
  mastered: string;
}

const COMPANY_NAME = "MasterAI";
const DEFAULT_VOLUME = 0.8;
const SUBSCRIPTION_COUNTDOWN = 300;

export default function ResultsPage() {
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<AudioState>({ original: false, mastered: false });
  const [currentTime, setCurrentTime] = useState<TimeState>({ original: 0, mastered: 0 });
  const [duration, setDuration] = useState<TimeState>({ original: 0, mastered: 0 });
  const [volume, setVolume] = useState<VolumeState>({ original: DEFAULT_VOLUME, mastered: DEFAULT_VOLUME });
  
  // Analysis state (your original features)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMode, setAnalysisMode] = useState<'client' | 'server' | 'both'>('both');
  
  // UI state
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'separate' | 'sync'>('separate');
  
  // Subscription state
  const [userType, setUserType] = useState<UserType>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalStep, setSubscriptionModalStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(SUBSCRIPTION_COUNTDOWN);
  
  // Data state
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [audioSources, setAudioSources] = useState<AudioSources | null>(null);
  
  // Refs (your original)
  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const masteredAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize component data
  useEffect(() => {
    initializeTrackData();
    return () => {
      // Cleanup audio context (your original)
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Countdown timer for subscription modal
  useEffect(() => {
    if (showSubscriptionModal && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showSubscriptionModal, timeLeft]);

  // Your original audio analysis functions
  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        throw new Error('Web Audio API not supported');
      }
    }
    return audioContextRef.current;
  }, []);

  const analyzeAudioBuffer = useCallback(async (audioBuffer: AudioBuffer): Promise<AudioAnalysis> => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const length = channelData.length;
    
    // Calculate RMS (Root Mean Square)
    let rmsSum = 0;
    let peak = 0;
    
    for (let i = 0; i < length; i++) {
      const sample = Math.abs(channelData[i]);
      rmsSum += sample * sample;
      peak = Math.max(peak, sample);
    }
    
    const rms = Math.sqrt(rmsSum / length);
    
    // Calculate LUFS (approximation)
    const lufs = -23 + 20 * Math.log10(rms / 0.691);
    
    // Calculate dynamic range (simplified)
    const sortedSamples = Array.from(channelData).map(Math.abs).sort((a, b) => b - a);
    const percentile95 = sortedSamples[Math.floor(sortedSamples.length * 0.05)];
    const percentile10 = sortedSamples[Math.floor(sortedSamples.length * 0.90)];
    const dynamicRange = 20 * Math.log10(percentile95 / Math.max(percentile10, 0.001));
    
    // Calculate stereo width (if stereo)
    let stereoWidth = 0;
    if (audioBuffer.numberOfChannels === 2) {
      const rightChannel = audioBuffer.getChannelData(1);
      let correlation = 0;
      let leftEnergy = 0;
      let rightEnergy = 0;
      
      for (let i = 0; i < Math.min(length, rightChannel.length); i++) {
        const left = channelData[i];
        const right = rightChannel[i];
        correlation += left * right;
        leftEnergy += left * left;
        rightEnergy += right * right;
      }
      
      const normalizedCorrelation = correlation / Math.sqrt(leftEnergy * rightEnergy);
      stereoWidth = (1 - Math.abs(normalizedCorrelation)) * 100;
    }
    
    // FFT for frequency analysis (simplified)
    const fftSize = Math.pow(2, Math.floor(Math.log2(Math.min(length, 2048))));
    const fftData = channelData.slice(0, fftSize);
    const frequencySpectrum = new Float32Array(fftSize / 2);
    
    // Simple DFT for demonstration (in production, use proper FFT)
    for (let k = 0; k < frequencySpectrum.length; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < fftSize; n++) {
        const angle = -2 * Math.PI * k * n / fftSize;
        real += fftData[n] * Math.cos(angle);
        imag += fftData[n] * Math.sin(angle);
      }
      frequencySpectrum[k] = Math.sqrt(real * real + imag * imag);
    }
    
    // Calculate spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < frequencySpectrum.length; i++) {
      const frequency = (i * sampleRate) / (2 * frequencySpectrum.length);
      weightedSum += frequency * frequencySpectrum[i];
      magnitudeSum += frequencySpectrum[i];
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    
    return {
      rms,
      peak,
      lufs,
      dynamicRange,
      stereoWidth,
      frequencySpectrum,
      spectralCentroid
    };
  }, []);

  const analyzeAudioFile = useCallback(async (audioElement: HTMLAudioElement): Promise<AudioAnalysis | null> => {
    try {
      const audioContext = await initializeAudioContext();
      
      // Create audio buffer from the audio element
      const response = await fetch(audioElement.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      return await analyzeAudioBuffer(audioBuffer);
    } catch (error) {
      console.error('Error analyzing audio:', error);
      return null;
    }
  }, [initializeAudioContext, analyzeAudioBuffer]);

  const performAudioAnalysis = useCallback(async () => {
    if (!originalAudioRef.current || !masteredAudioRef.current || !trackData) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Analyze original audio
      setAnalysisProgress(25);
      const originalAnalysis = await analyzeAudioFile(originalAudioRef.current);
      
      setAnalysisProgress(75);
      // Analyze mastered audio
      const masteredAnalysis = await analyzeAudioFile(masteredAudioRef.current);
      
      setAnalysisProgress(100);
      
      // Update track data with analysis results
      setTrackData(prev => prev ? {
        ...prev,
        originalAnalysis,
        masteredAnalysis
      } : null);
      
    } catch (error) {
      console.error('Audio analysis failed:', error);
      setError('Failed to analyze audio. Showing basic comparison.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeAudioFile, trackData]);

  const initializeTrackData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get processing results from URL params or session storage
      const searchParams = new URLSearchParams(window.location.search);
      const trackName = searchParams.get('track') || 'Your Track';
      const preset = searchParams.get('preset') || 'Hip Hop';
      const downloadUrl = searchParams.get('downloadUrl');
      
      // Get stored processing data and results
      const processingData = sessionStorage.getItem('processingData');
      const processingResultStr = sessionStorage.getItem('processingResult');
      
      let processingResult: ProcessingResult | null = null;
      if (processingResultStr) {
        try {
          processingResult = JSON.parse(processingResultStr);
        } catch (error) {
          console.error('Error parsing processing result:', error);
        }
      }

      let finalTrackData: TrackData = {
        title: trackName,
        originalFile: '',
        masteredFile: downloadUrl || '',
        preset: preset,
        processingTime: processingResult ? `${processingResult.processingTime}s` : '2m 34s',
        originalAnalysis: null,
        masteredAnalysis: null,
        processingResult: processingResult
      };

      // Update with real processing results if available
      if (processingResult) {
        finalTrackData.masteredFile = processingResult.downloadUrl || downloadUrl || '';
      }

      setTrackData(finalTrackData);
      await setupAudioSources(processingData, finalTrackData);
      
      // Determine user type
      const paymentConfirmed = sessionStorage.getItem('paymentConfirmed');
      if (paymentConfirmed) {
        const paymentData = JSON.parse(paymentConfirmed);
        setUserType(paymentData.paymentType === 'monthly' ? 'subscription' : 'single');
      } else {
        setUserType('single');
      }
      
    } catch (error) {
      console.error('Error initializing track data:', error);
      setError('Failed to load track data. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupAudioSources = useCallback(async (processingData: string | null, trackData: TrackData) => {
    let originalSrc = '';
    let masteredSrc = '';

    try {
      // Try to get real processing results first
      if (trackData.processingResult?.success) {
        console.log('✅ Using real FFmpeg processed audio:', trackData.processingResult.downloadUrl);
        masteredSrc = trackData.processingResult.downloadUrl;
      }

      // Try to get the original uploaded file
      if (processingData) {
        const data = JSON.parse(processingData);
        if (data.sourceFile?.url) {
          console.log('✅ Using original uploaded file');
          originalSrc = data.sourceFile.url;
        }
      }

      // Check for real files via global variables (backup method)
      if (!originalSrc && (window as any).pendingSourceFile) {
        const sourceFile = (window as any).pendingSourceFile;
        if (sourceFile instanceof File) {
          originalSrc = URL.createObjectURL(sourceFile);
          console.log('✅ Using pending source file');
        }
      }

      // Only use demo if no real files available
      if (!originalSrc || !masteredSrc) {
        console.log('⚠️ Missing audio files, analysis will be limited');
        if (!originalSrc) originalSrc = '#';
        if (!masteredSrc) masteredSrc = '#';
      }

      setAudioSources({ original: originalSrc, mastered: masteredSrc });

      // Set up audio elements once sources are ready
      if (originalSrc !== '#' && masteredSrc !== '#') {
        setTimeout(() => {
          setupAudioElements(originalSrc, masteredSrc);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error setting up audio sources:', error);
      setAudioSources({ original: '#', mastered: '#' });
    }
  }, []);

  const setupAudioElements = useCallback((originalSrc: string, masteredSrc: string) => {
    if (originalAudioRef.current && originalSrc && originalSrc !== '#') {
      originalAudioRef.current.src = originalSrc;
      originalAudioRef.current.volume = volume.original;
      originalAudioRef.current.load();
    }
    
    if (masteredAudioRef.current && masteredSrc && masteredSrc !== '#') {
      masteredAudioRef.current.src = masteredSrc;
      masteredAudioRef.current.volume = volume.mastered;
      masteredAudioRef.current.load();
    }
  }, [volume]);

  // Auto-analyze when both audio files are loaded (your original feature)
  useEffect(() => {
    if (originalAudioRef.current?.src && masteredAudioRef.current?.src && 
        originalAudioRef.current.src !== '#' && masteredAudioRef.current.src !== '#' && 
        trackData && !trackData.originalAnalysis && !isAnalyzing) {
      performAudioAnalysis();
    }
  }, [audioSources, trackData, isAnalyzing, performAudioAnalysis]);

  const togglePlayback = useCallback((type: 'original' | 'mastered') => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    const otherAudioRef = type === 'original' ? masteredAudioRef : originalAudioRef;
    
    if (!audioRef.current || audioRef.current.src === '#') return;

    try {
      // In sync mode, sync the other audio
      if (comparisonMode === 'sync') {
        if (otherAudioRef.current && otherAudioRef.current.src !== '#') {
          if (isPlaying[type]) {
            // Pause both
            audioRef.current.pause();
            otherAudioRef.current.pause();
            setIsPlaying({ original: false, mastered: false });
          } else {
            // Sync time and play both
            const currentPos = audioRef.current.currentTime;
            otherAudioRef.current.currentTime = currentPos;
            
            Promise.all([
              audioRef.current.play(),
              otherAudioRef.current.play()
            ]).then(() => {
              setIsPlaying({ original: true, mastered: true });
            }).catch(e => {
              console.warn('Sync play failed:', e);
              // Fallback to single play
              audioRef.current?.play();
              setIsPlaying(prev => ({ ...prev, [type]: true }));
            });
          }
        } else {
          // Only one audio available
          if (isPlaying[type]) {
            audioRef.current.pause();
          } else {
            audioRef.current.play();
          }
          setIsPlaying(prev => ({ ...prev, [type]: !prev[type] }));
        }
      } else {
        // Separate mode - pause other, toggle current
        if (otherAudioRef.current && !otherAudioRef.current.paused) {
          otherAudioRef.current.pause();
          setIsPlaying(prev => ({ ...prev, [type === 'original' ? 'mastered' : 'original']: false }));
        }

        if (isPlaying[type]) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(e => {
            console.warn('Play failed:', e);
            setError('Unable to play audio. Please check your browser settings.');
          });
        }
        setIsPlaying(prev => ({ ...prev, [type]: !prev[type] }));
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      setError('Audio playback error occurred.');
    }
  }, [isPlaying, comparisonMode]);

  const handleTimeUpdate = useCallback((type: 'original' | 'mastered') => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    if (audioRef.current) {
      setCurrentTime(prev => ({ ...prev, [type]: audioRef.current!.currentTime }));
      
      // In sync mode, keep audio synchronized
      if (comparisonMode === 'sync' && isPlaying.original && isPlaying.mastered) {
        const otherAudioRef = type === 'original' ? masteredAudioRef : originalAudioRef;
        if (otherAudioRef.current) {
          const timeDiff = Math.abs(audioRef.current.currentTime - otherAudioRef.current.currentTime);
          if (timeDiff > 0.1) { // Resync if drift > 100ms
            otherAudioRef.current.currentTime = audioRef.current.currentTime;
          }
        }
      }
    }
  }, [comparisonMode, isPlaying]);

  const handleLoadedMetadata = useCallback((type: 'original' | 'mastered') => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    if (audioRef.current) {
      setDuration(prev => ({ ...prev, [type]: audioRef.current!.duration }));
    }
  }, []);

  const handleSeek = useCallback((type: 'original' | 'mastered', time: number) => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(prev => ({ ...prev, [type]: time }));
      
      // In sync mode, seek both audio files
      if (comparisonMode === 'sync') {
        const otherAudioRef = type === 'original' ? masteredAudioRef : originalAudioRef;
        if (otherAudioRef.current && otherAudioRef.current.src !== '#') {
          otherAudioRef.current.currentTime = time;
          setCurrentTime(prev => ({ 
            ...prev, 
            [type === 'original' ? 'mastered' : 'original']: time 
          }));
        }
      }
    }
  }, [comparisonMode]);

  const handleVolumeChange = useCallback((type: 'original' | 'mastered', newVolume: number) => {
    const audioRef = type === 'original' ? originalAudioRef : masteredAudioRef;
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(prev => ({ ...prev, [type]: newVolume }));
    }
  }, []);

  const formatTime = useCallback((time: number): string => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const formatCountdown = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatLUFS = useCallback((lufs: number): string => {
    return `${lufs.toFixed(1)} LUFS`;
  }, []);

  const formatDB = useCallback((db: number): string => {
    return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
  }, []);

  const formatPercent = useCallback((percent: number): string => {
    return `${percent.toFixed(0)}%`;
  }, []);

  const formatFrequency = useCallback((freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}kHz`;
    }
    return `${freq.toFixed(0)}Hz`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const generateMasteredFilename = useCallback((originalName: string): string => {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}_mastered_${COMPANY_NAME}.mp3`;
  }, []);

  const handleDownload = useCallback(async () => {
    if (!trackData) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);

    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsDownloading(false);
          setDownloadComplete(true);
          
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
      const masteredFilename = generateMasteredFilename(trackData.title);
      
      // Check if we have a real processed file from FFmpeg
      let realDownloadUrl = null;
      if (trackData.processingResult?.success) {
        realDownloadUrl = trackData.processingResult.downloadUrl;
      }
      
      if (realDownloadUrl) {
        console.log('📥 Downloading real FFmpeg processed file:', realDownloadUrl);
        const response = await fetch(realDownloadUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = masteredFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      } else if (trackData.masteredFile && trackData.masteredFile !== '#') {
        console.log('📥 Downloading fallback file:', trackData.masteredFile);
        const link = document.createElement('a');
        link.href = trackData.masteredFile;
        link.download = masteredFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('No mastered file available for download');
      }
      
      console.log(`Downloaded as: ${masteredFilename}`);
      
    } catch (error) {
      console.error('Download failed:', error);
      clearInterval(progressInterval);
      setIsDownloading(false);
      setError('Download failed. Please try again.');
    }
  }, [trackData, userType, generateMasteredFilename]);

  const handleSubscriptionUpgrade = useCallback(async () => {
    console.log('🔐 Redirecting to Stripe checkout for $15/month...');
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceType: 'monthly',
          successUrl: `${window.location.origin}/results?upgraded=true`,
          cancelUrl: window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
      
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setError('Failed to start checkout. Please try again.');
    }
  }, []);

  const handleModalClose = useCallback(() => {
    if (subscriptionModalStep === 1) {
      setSubscriptionModalStep(2);
    } else {
      setShowSubscriptionModal(false);
      console.log('User declined subscription offer');
    }
  }, [subscriptionModalStep]);

  const AudioPlayer = ({ type, title }: { type: 'original' | 'mastered'; title: string }) => (
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
        aria-label={`${title} audio player`}
      />

      {/* Real-time Waveform Visualization (YOUR ORIGINAL FEATURE) */}
      <div className="relative mb-4 h-16 bg-gray-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-end space-x-1 h-12" role="img" aria-label="Audio waveform">
            {[...Array(50)].map((_, i) => {
              const analysis = type === 'original' ? trackData?.originalAnalysis : trackData?.masteredAnalysis;
              const spectrum = analysis?.frequencySpectrum;
              const height = spectrum ? (spectrum[i % spectrum.length] || 0) * 100 : 20 + Math.random() * 80;
              
              return (
                <div
                  key={i}
                  className={`w-1 bg-gradient-to-t transition-all duration-150 ${
                    type === 'original' 
                      ? 'from-blue-400 to-blue-600' 
                      : 'from-purple-400 to-purple-600'
                  }`}
                  style={{ 
                    height: `${Math.min(Math.max(height, 10), 100)}%`,
                    opacity: (currentTime[type] / duration[type]) > (i / 50) ? 1 : 0.3
                  }}
                />
              );
            })}
          </div>
        </div>
        
        <div 
          className="absolute top-0 left-0 h-full bg-black/10 transition-all duration-100"
          style={{ width: `${(currentTime[type] / duration[type]) * 100 || 0}%` }}
        />
        
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const seekTime = (clickX / rect.width) * duration[type];
            handleSeek(type, seekTime);
          }}
          role="slider"
          aria-label="Audio progress"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              const step = 5; // 5 seconds
              const newTime = e.key === 'ArrowLeft' 
                ? Math.max(0, currentTime[type] - step)
                : Math.min(duration[type], currentTime[type] + step);
              handleSeek(type, newTime);
            }
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => togglePlayback(type)}
            disabled={!audioSources || audioSources[type] === '#'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              !audioSources || audioSources[type] === '#'
                ? 'bg-gray-400 cursor-not-allowed'
                : type === 'original'
                ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300'
                : 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-300'
            } text-white shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2`}
            aria-label={isPlaying[type] ? `Pause ${title}` : `Play ${title}`}
          >
            {isPlaying[type] ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          
          <div className="text-sm text-gray-600">
            {formatTime(currentTime[type])} / {formatTime(duration[type])}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            aria-label={`${title} volume`}
          />
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" role="status" aria-label="Loading"></div>
          <p>Loading your mastered track...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No track data
  if (!trackData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your mastered track...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="px-6 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-white">🎵 {COMPANY_NAME}</div>
          <div className="flex items-center space-x-4">
            {/* Analysis Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setAnalysisMode('client')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  analysisMode === 'client' 
                    ? 'bg-white text-gray-900' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Client
              </button>
              <button
                onClick={() => setAnalysisMode('server')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  analysisMode === 'server' 
                    ? 'bg-white text-gray-900' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Server
              </button>
              <button
                onClick={() => setAnalysisMode('both')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  analysisMode === 'both' 
                    ? 'bg-white text-gray-900' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Both
              </button>
            </div>
            {/* Comparison Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setComparisonMode('separate')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  comparisonMode === 'separate' 
                    ? 'bg-white text-gray-900' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                A/B
              </button>
              <button
                onClick={() => setComparisonMode('sync')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  comparisonMode === 'sync' 
                    ? 'bg-white text-gray-900' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Sync
              </button>
            </div>
            <button 
              onClick={() => window.location.href = '/generator'}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              New Master
            </button>
          </div>
        </div>
      </nav>

      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Mastering Complete!</h1>
            <p className="text-gray-300">Your track "{trackData.title}" has been professionally mastered using {trackData.preset} preset</p>
            <p className="text-gray-400 text-sm">Processing time: {trackData.processingTime}</p>
            {comparisonMode === 'sync' && (
              <p className="text-yellow-300 text-sm mt-2">🎧 Sync mode: Both tracks will play simultaneously for direct comparison</p>
            )}
          </div>

          {/* Analysis Progress (YOUR ORIGINAL FEATURE) */}
          {isAnalyzing && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                <div className="flex-1">
                  <p className="text-blue-300 font-semibold">Analyzing audio quality...</p>
                  <div className="w-full bg-blue-900/30 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Players */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <AudioPlayer type="original" title="Original Track" />
            <AudioPlayer type="mastered" title="Mastered Track" />
          </div>

          {/* Combined Analysis Results */}
          <div className="space-y-6 mb-8">
            
            {/* Client-Side Analysis (YOUR ORIGINAL) */}
            {(analysisMode === 'client' || analysisMode === 'both') && trackData.originalAnalysis && trackData.masteredAnalysis && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">📊 Client-Side Audio Analysis & Improvements</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Loudness */}
                  <div className="text-center">
                    <h4 className="text-sm text-gray-300 mb-2">Loudness (LUFS)</h4>
                    <div className="text-lg text-red-400 mb-1">
                      {formatLUFS(trackData.originalAnalysis.lufs)}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">↓</div>
                    <div className="text-lg text-green-400 mb-2">
                      {formatLUFS(trackData.masteredAnalysis.lufs)}
                    </div>
                    <div className="text-sm text-green-300">
                      {formatDB(trackData.masteredAnalysis.lufs - trackData.originalAnalysis.lufs)} improvement
                    </div>
                  </div>

                  {/* Dynamic Range */}
                  <div className="text-center">
                    <h4 className="text-sm text-gray-300 mb-2">Dynamic Range</h4>
                    <div className="text-lg text-yellow-400 mb-1">
                      {formatDB(trackData.originalAnalysis.dynamicRange)}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">→</div>
                    <div className="text-lg text-green-400 mb-2">
                      {formatDB(trackData.masteredAnalysis.dynamicRange)}
                    </div>
                    <div className="text-sm text-green-300">
                      {trackData.masteredAnalysis.dynamicRange > trackData.originalAnalysis.dynamicRange ? 'Enhanced' : 'Optimized'}
                    </div>
                  </div>

                  {/* Stereo Width */}
                  <div className="text-center">
                    <h4 className="text-sm text-gray-300 mb-2">Stereo Width</h4>
                    <div className="text-lg text-blue-400 mb-1">
                      {formatPercent(trackData.originalAnalysis.stereoWidth)}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">→</div>
                    <div className="text-lg text-green-400 mb-2">
                      {formatPercent(trackData.masteredAnalysis.stereoWidth)}
                    </div>
                    <div className="text-sm text-green-300">
                      {formatPercent(trackData.masteredAnalysis.stereoWidth - trackData.originalAnalysis.stereoWidth)} wider
                    </div>
                  </div>

                  {/* Spectral Centroid */}
                  <div className="text-center">
                    <h4 className="text-sm text-gray-300 mb-2">Brightness</h4>
                    <div className="text-lg text-purple-400 mb-1">
                      {formatFrequency(trackData.originalAnalysis.spectralCentroid)}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">→</div>
                    <div className="text-lg text-green-400 mb-2">
                      {formatFrequency(trackData.masteredAnalysis.spectralCentroid)}
                    </div>
                    <div className="text-sm text-green-300">
                      {trackData.masteredAnalysis.spectralCentroid > trackData.originalAnalysis.spectralCentroid ? 'Brighter' : 'Warmer'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-green-400 text-sm">
                    ✅ Real-time client-side audio analysis complete
                  </p>
                </div>
              </div>
            )}

            {/* Server-Side FFmpeg Analysis */}
            {(analysisMode === 'server' || analysisMode === 'both') && trackData.processingResult && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">🔧 FFmpeg Server-Side Processing Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Loudness Change */}
                  <div className="text-center">
                    <h4 className="text-sm text-gray-300 mb-2">Loudness Change</h4>
                    <div className="text-lg text-red-400 mb-1">
                      {formatDB(trackData.processingResult.originalAnalysis.meanVolume)}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">↓</div>
                    <div className="text-lg text-green-400 mb-2">
                      {formatDB(trackData.processingResult.processedAnalysis.meanVolume)}
                    </div>
                    <div className="text-sm text-green-300">
                      {formatDB(trackData.processingResult.improvements.loudnessChange)} improvement
                    </div>
                  </div>

                  {/* Peak Level */}
                  <div className="text-center">
                    <h4 className="text-sm text-gray-300 mb-2">Peak Level</h4>
                    <div className="text-lg text-yellow-400 mb-1">
                      {formatDB(trackData.processingResult.originalAnalysis.maxVolume)}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">→</div>
                    <div className="text-lg text-green-400 mb-2">
                      {formatDB(trackData.processingResult.processedAnalysis.maxVolume)}
                    </div>
                    <div className="text-sm text-green-300">
                      {formatDB(trackData.processingResult.improvements.dynamicRangeChange)} change
                    </div>
                  </div>

                  {/* Format Improvement */}
                  <div className="text-center">
                    <h4 className="text-sm text-gray-300 mb-2">Format</h4>
                    <div className="text-lg text-blue-400 mb-1">
                      {trackData.processingResult.originalAnalysis.format.toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">→</div>
                    <div className="text-lg text-green-400 mb-2">
                      MP3 320k
                    </div>
                    <div className="text-sm text-green-300">
                      High Quality
                    </div>
                  </div>

                  {/* File Size */}
                  <div className="text-center">
                    <h4 className="text-sm text-gray-300 mb-2">Output Size</h4>
                    <div className="text-lg text-green-400 mb-2">
                      {formatFileSize(trackData.processingResult.outputSize)}
                    </div>
                    <div className="text-sm text-green-300">
                      Ready to Download
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Original Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Duration:</span>
                        <span className="text-white">{trackData.processingResult.originalAnalysis.duration.toFixed(1)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Sample Rate:</span>
                        <span className="text-white">{trackData.processingResult.originalAnalysis.sampleRate} Hz</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Channels:</span>
                        <span className="text-white">{trackData.processingResult.originalAnalysis.channels}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Bitrate:</span>
                        <span className="text-white">{Math.round(trackData.processingResult.originalAnalysis.bitrate / 1000)} kbps</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Processing Applied</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Method:</span>
                        <span className="text-green-400">{trackData.processingResult.improvements.processingApplied}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Processing Time:</span>
                        <span className="text-white">{trackData.processingResult.processingTime}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Output Format:</span>
                        <span className="text-white">MP3 320 kbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Quality:</span>
                        <span className="text-green-400">Professional</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-green-400 text-sm">
                    ✅ Real professional mastering applied using FFmpeg processing
                  </p>
                </div>
              </div>
            )}

            {/* Fallback for no analysis */}
            {(!trackData.originalAnalysis || !trackData.masteredAnalysis) && !trackData.processingResult && !isAnalyzing && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-yellow-300 mb-4">⚠️ Limited Analysis Available</h3>
                <p className="text-yellow-200 mb-4">
                  Upload your own audio files to see detailed before/after analysis and real improvement metrics.
                </p>
                {audioSources && (audioSources.original === '#' || audioSources.mastered === '#') && (
                  <div className="text-sm text-yellow-300">
                    Missing: {audioSources.original === '#' ? 'Original file' : ''} 
                    {audioSources.original === '#' && audioSources.mastered === '#' ? ' and ' : ''}
                    {audioSources.mastered === '#' ? 'Mastered file' : ''}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={handleDownload}
              disabled={isDownloading || !trackData.masteredFile || trackData.masteredFile === '#'}
              className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                isDownloading || !trackData.masteredFile || trackData.masteredFile === '#'
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
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Mastered Track
                </>
              )}
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Share Results
            </button>

            <button
              onClick={() => window.location.href = '/generator'}
              className="px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
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
                  role="progressbar"
                  aria-valuenow={downloadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="subscription-modal-title">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            {subscriptionModalStep === 1 ? (
              <>
                <h3 id="subscription-modal-title" className="text-2xl font-bold text-gray-800 mb-4">🎉 Great Choice!</h3>
                <p className="text-gray-600 mb-6">
                  Your track sounds amazing! Want to master unlimited tracks for just $15/month?
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleSubscriptionUpgrade}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    Yes, Upgrade to Pro ($15/month)
                  </button>
                  <button
                    onClick={handleModalClose}
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 id="subscription-modal-title" className="text-2xl font-bold text-gray-800 mb-4">⏰ Limited Time Offer</h3>
                <p className="text-gray-600 mb-4">
                  This special offer expires in {formatCountdown(timeLeft)}
                </p>
                <p className="text-gray-600 mb-6">
                  Unlock unlimited mastering, priority processing, and advanced features.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleSubscriptionUpgrade}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    Claim Offer Now ($15/month)
                  </button>
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    No Thanks
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 id="share-modal-title" className="text-2xl font-bold text-gray-800 mb-4">Share Your Results</h3>
            <p className="text-gray-600 mb-6">
              Show off your professionally mastered track!
            </p>
            <div className="space-y-3">
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
                Share on Twitter
              </button>
              <button className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600">
                Share on Facebook
              </button>
              <button className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400">
                Share on Instagram
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}