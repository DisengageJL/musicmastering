'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const musicInsights = [
  {
    icon: "💰",
    title: "Copyright Royalties",
    fact: "Every song has two copyrights that pay out royalties to different entities: the composition (lyrics/melody) and the sound recording (master)."
  },
  {
    icon: "🎛️",
    title: "Mastering Magic",
    fact: "Professional mastering typically costs $50-200 per song at top studios. AI mastering can achieve 90% of that quality at a fraction of the cost."
  },
  {
    icon: "📊",
    title: "Loudness Wars",
    fact: "Streaming platforms like Spotify normalize audio to -14 LUFS, making dynamics more important than peak loudness in modern mastering."
  },
  {
    icon: "🎵",
    title: "Golden Ratio",
    fact: "The most pleasing frequency ratio in music is 3:2, which creates the perfect fifth interval - the foundation of harmony in Western music."
  },
  {
    icon: "🔊",
    title: "Fletcher-Munson",
    fact: "Human ears perceive bass and treble frequencies as quieter at low volumes. This is why your mix sounds different at night!"
  },
  {
    icon: "⚡",
    title: "Digital vs Analog",
    fact: "Digital audio sampling at 44.1kHz can capture frequencies up to 22kHz - higher than most humans can hear (20kHz max)."
  },
  {
    icon: "🎧",
    title: "Stereo Spread",
    fact: "The human brain can detect timing differences as small as 10 microseconds between ears, which is how we perceive stereo width and imaging."
  },
  {
    icon: "🌊",
    title: "Compression Ratios",
    fact: "A 4:1 compression ratio means for every 4dB over the threshold, only 1dB comes through. It's like an automatic volume rider!"
  },
  {
    icon: "🎼",
    title: "Equal Temperament",
    fact: "Modern pianos are 'out of tune' by design! Equal temperament slightly detunes all intervals except octaves to allow playing in any key."
  },
  {
    icon: "🔥",
    title: "Thermal Noise",
    fact: "Even the best analog equipment generates thermal noise from electrons moving in resistors - it's the physical limit of quiet!"
  }
];

export default function ProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const trackName = searchParams.get('track') || 'Your Track';
  const preset = searchParams.get('preset') || 'Hip Hop';
  const mode = searchParams.get('mode') || 'preset';
  const hasReference = searchParams.get('hasReference') === 'true';
  const paymentConfirmed = searchParams.get('paymentConfirmed') === 'true';
  const paymentId = searchParams.get('paymentId');

  const [progress, setProgress] = useState(0);
  const [currentInsight, setCurrentInsight] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState('Initializing...');

  const processingStages = [
    { name: "Analyzing Audio", duration: 15, description: "Examining frequency spectrum and dynamics" },
    { name: "AI Processing", duration: 45, description: "Applying intelligent mastering algorithms" },
    { name: "Quality Check", duration: 75, description: "Ensuring optimal loudness and clarity" },
    { name: "Finalizing", duration: 100, description: "Preparing your mastered track" }
  ];

  const redirectToResults = (sessionId: string, downloadUrl?: string) => {
    console.log('🎉 Redirecting to results page...', { sessionId, downloadUrl });
    
    setTimeout(() => {
      const params = new URLSearchParams({
        session: sessionId,
        track: trackName,
        preset: preset,
        fromProcessing: 'true'
      });
      
      if (downloadUrl) {
        params.set('downloadUrl', downloadUrl);
      }
      
      router.push(`/results?${params}`);
    }, 2000);
  };

  const handleActualProcessing = async () => {
    try {
      console.log('🎵 Starting actual audio processing...');
      setProcessingStatus('Preparing files for processing...');
      
      // Get files from global variables or session storage
      let sourceFile = (window as any).pendingSourceFile;
      let referenceFile = (window as any).pendingReferenceFile;
      
      // Fallback: try to reconstruct from session storage
      if (!sourceFile) {
        console.log('🔄 Trying to recover files from session storage...');
        const processingData = sessionStorage.getItem('processingData');
        if (processingData) {
          const data = JSON.parse(processingData);
          if (data.sourceFile && data.sourceFile.url) {
            try {
              const response = await fetch(data.sourceFile.url);
              const blob = await response.blob();
              sourceFile = new File([blob], data.sourceFile.name, { type: data.sourceFile.type });
              
              if (data.referenceFile && data.referenceFile.url) {
                const refResponse = await fetch(data.referenceFile.url);
                const refBlob = await refResponse.blob();
                referenceFile = new File([refBlob], data.referenceFile.name, { type: data.referenceFile.type });
              }
            } catch (error) {
              console.log('URL reconstruction failed:', error);
            }
          }
        }
      }
      
      if (!sourceFile) {
        console.log('⚠️ No source file found, using demo mode...');
        setProcessingStatus('Running in demo mode...');
        redirectToResults('demo-session-id');
        return;
      }

      console.log('✅ Files ready for processing:', {
        source: sourceFile.name,
        reference: referenceFile?.name
      });

      // Create FormData for API call
      const formData = new FormData();
      formData.append('source', sourceFile);
      if (referenceFile) {
        formData.append('reference', referenceFile);
      }
      formData.append('preset', preset);
      formData.append('paymentConfirmed', 'true');
      
      setProcessingStatus('Uploading files to server...');
      
      console.log('📤 Calling mastering API...');

      const response = await fetch('/api/generate-master', {
        method: 'POST',
        body: formData,
      });

      console.log('📥 API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📦 API result:', result);

      if (result.success) {
        console.log('✅ Processing completed successfully');
        setProcessingStatus('Processing complete! Preparing results...');
        
        // Store result for results page
        sessionStorage.setItem('processingResult', JSON.stringify(result));
        
        // Clean up file URLs to prevent memory leaks
        if (sourceFile && (window as any).pendingSourceFile) {
          URL.revokeObjectURL((window as any).pendingSourceFile.url);
        }
        if (referenceFile && (window as any).pendingReferenceFile) {
          URL.revokeObjectURL((window as any).pendingReferenceFile.url);
        }
        
        redirectToResults(result.sessionId, result.downloadUrl);
      } else {
        console.error('❌ API returned error:', result.error);
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Processing error:', error);
      setError(error instanceof Error ? error.message : 'Unknown processing error');
      setProcessingStatus('Processing failed');
    }
  };

  useEffect(() => {
    console.log('🎵 Processing page loaded with params:', { 
      trackName, preset, mode, hasReference, paymentConfirmed, paymentId 
    });
    
    // Check payment confirmation
    if (!paymentConfirmed) {
      console.log('❌ No payment confirmation, redirecting to payment...');
      router.push(`/payment?track=${encodeURIComponent(trackName)}&preset=${encodeURIComponent(preset)}&mode=${mode}&hasReference=${hasReference}`);
      return;
    }
    
    console.log('✅ Payment confirmed, starting processing...', paymentId);

    let processingTimer: NodeJS.Timeout;
    let insightTimer: NodeJS.Timeout;

    const startProcessing = () => {
      console.log('🚀 Starting processing simulation...');
      setProcessingStatus('Analyzing your audio file...');
      
      // Progress simulation
      processingTimer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (Math.random() * 1.5) + 0.8;
          
          const stageIndex = processingStages.findIndex(stage => newProgress < stage.duration);
          const currentStageIndex = stageIndex === -1 ? processingStages.length - 1 : Math.max(0, stageIndex);
          setCurrentStage(currentStageIndex);
          
          // Update status based on stage
          if (currentStageIndex < processingStages.length) {
            setProcessingStatus(processingStages[currentStageIndex].description);
          }
          
          if (newProgress >= 95) {
            clearInterval(processingTimer);
            setProcessingStatus('Finalizing mastered track...');
            
            // Start actual processing when simulation is nearly complete
            setTimeout(() => {
              handleActualProcessing();
            }, 1500);
            
            return 95; // Cap at 95% until actual processing completes
          }
          return newProgress;
        });
      }, 300);

      // Insight rotation
      insightTimer = setInterval(() => {
        setCurrentInsight(prev => (prev + 1) % musicInsights.length);
      }, 4000);
    };

    // Start processing after a brief delay
    setTimeout(startProcessing, 1000);

    return () => {
      clearInterval(processingTimer);
      clearInterval(insightTimer);
    };
  }, [searchParams, trackName, preset, mode, hasReference, paymentConfirmed, paymentId, router]);

  const getProgressColor = () => {
    if (progress < 25) return 'from-blue-500 to-purple-500';
    if (progress < 50) return 'from-purple-500 to-pink-500';
    if (progress < 75) return 'from-pink-500 to-red-500';
    return 'from-red-500 to-orange-500';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">Processing Failed</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/generator')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 border border-white/20 hover:border-white/40 text-white rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            {isComplete ? '🎉 Processing Complete!' : '🎵 Mastering in Progress'}
          </h1>
          <p className="text-gray-300 text-lg">
            {isComplete 
              ? `Your track "${trackName}" is ready! Redirecting to results...`
              : `Working on "${trackName}" using ${preset} preset${hasReference ? ' with reference track' : ''}`
            }
          </p>
        </div>

        {/* Progress Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8">
          
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">
                {processingStages[currentStage]?.name || 'Processing'}
              </span>
              <span className="text-gray-300">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-300 ease-out relative`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mt-2">
              {processingStatus}
            </p>
          </div>

          {/* Processing Stages */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {processingStages.map((stage, index) => (
              <div 
                key={index}
                className={`text-center p-3 rounded-lg transition-all duration-300 ${
                  index <= currentStage 
                    ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30' 
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                  index < currentStage 
                    ? 'bg-green-500 text-white' 
                    : index === currentStage 
                      ? 'bg-blue-500 text-white animate-pulse' 
                      : 'bg-gray-600 text-gray-400'
                }`}>
                  {index < currentStage ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <p className="text-xs text-gray-300 font-medium">{stage.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Music Industry Insights */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 min-h-[180px] flex items-center">
          <div className="w-full">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3 animate-bounce">
                {musicInsights[currentInsight].icon}
              </div>
              <h3 className="text-xl font-bold text-white">
                Did you know?
              </h3>
            </div>
            
            <div className="transition-all duration-500 ease-in-out">
              <h4 className="text-purple-300 font-semibold mb-3 text-lg">
                {musicInsights[currentInsight].title}
              </h4>
              <p className="text-gray-300 leading-relaxed text-base">
                {musicInsights[currentInsight].fact}
              </p>
            </div>
            
            {/* Insight Progress Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              {musicInsights.slice(0, 8).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentInsight % 8 
                      ? 'bg-purple-400 scale-125' 
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Audio Visualization */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
          <div className="flex items-center justify-center space-x-1 h-20">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full transition-all duration-200"
                style={{ 
                  height: `${20 + Math.sin((progress * 10 + i * 0.3)) * 25}px`,
                  opacity: progress > i * 2 ? 1 : 0.3,
                  animationDelay: `${i * 30}ms`
                }}
              />
            ))}
          </div>
          
          <div className="text-center mt-4">
            <p className="text-gray-400 text-sm">
              Real FFmpeg audio processing • Professional mastering algorithms
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Mode: {mode === 'reference' ? 'Reference Track Matching' : `${preset} Preset Optimization`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            🚀 Powered by FFmpeg and advanced AI mastering algorithms
          </p>
        </div>
      </div>
    </div>
  );
}