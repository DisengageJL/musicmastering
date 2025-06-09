'use client';

import { useState, useRef } from 'react';

type MasteringMode = 'preset' | 'reference';
type StatusType = 'error' | 'success' | 'info' | '';

interface Status {
  type: StatusType;
  message: string;
}

export default function GeneratorPage() {
  const [sourceTrack, setSourceTrack] = useState<File | null>(null);
  const [referenceTrack, setReferenceTrack] = useState<File | null>(null);
  const [preset, setPreset] = useState<string>('Hip Hop');
  const [masteringMode, setMasteringMode] = useState<MasteringMode>('preset');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<Status>({ type: '', message: '' });
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'];

  const validateFile = (file: File | null): { valid: boolean; error?: string } => {
    if (!file) return { valid: false, error: 'No file selected' };
    
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be under 100MB' };
    }
    
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return { valid: false, error: 'Please upload MP3, WAV, FLAC, AAC, or OGG files only' };
    }
    
    return { valid: true };
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'source' | 'reference') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], type);
    }
  };

  const handleFileSelect = (file: File | null, type: 'source' | 'reference') => {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setStatus({ type: 'error', message: validation.error || 'Invalid file' });
      return;
    }

    if (type === 'source') {
      setSourceTrack(file);
      setStatus({ type: 'success', message: `✓ Source track: ${file!.name} (${(file!.size / 1024 / 1024).toFixed(1)}MB)` });
    } else {
      setReferenceTrack(file);
      setMasteringMode('reference');
      setStatus({ type: 'success', message: `✓ Reference track: ${file!.name} (${(file!.size / 1024 / 1024).toFixed(1)}MB)` });
    }
  };

  const handleGenerate = async () => {
    if (!sourceTrack) {
      setStatus({ type: 'error', message: 'Please upload your source track first' });
      return;
    }

    if (masteringMode === 'reference' && !referenceTrack) {
      setStatus({ type: 'error', message: 'Please upload a reference track or switch to preset mode' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '🎵 Preparing your track for processing...' });

    try {
      console.log("📤 Preparing to redirect to processing page...");
      
      // Create a temporary storage for the files using URL.createObjectURL
      const sourceUrl = URL.createObjectURL(sourceTrack);
      const referenceUrl = referenceTrack ? URL.createObjectURL(referenceTrack) : null;
      
      // Store processing data (small metadata only)
      const processingData = {
        sourceFile: {
          name: sourceTrack.name,
          size: sourceTrack.size,
          type: sourceTrack.type,
          url: sourceUrl
        },
        referenceFile: referenceTrack ? {
          name: referenceTrack.name,
          size: referenceTrack.size,
          type: referenceTrack.type,
          url: referenceUrl
        } : null,
        preset: preset,
        masteringMode: masteringMode,
        timestamp: Date.now()
      };

      // Store in sessionStorage (just metadata, not the actual files)
      sessionStorage.setItem('processingData', JSON.stringify(processingData));
      
      // Also create FormData and store it temporarily
      const formData = new FormData();
      formData.append('source', sourceTrack);
      if (referenceTrack) {
        formData.append('reference', referenceTrack);
      }
      formData.append('preset', preset);
      
      // Store the FormData in a global variable (not ideal but works for demo)
      (window as any).pendingFormData = formData;

      setStatus({ 
        type: 'success', 
        message: '✅ Track prepared! Redirecting to processing...' 
      });

      // Redirect to processing page
      setTimeout(() => {
        const params = new URLSearchParams({
          track: sourceTrack.name,
          preset: preset,
          mode: masteringMode,
          hasReference: referenceTrack ? 'true' : 'false'
        });
        window.location.href = `/processing?${params}`;
      }, 1500);
      
    } catch (err: any) {
      console.error('❌ Preparation failed:', err);
      setStatus({ type: 'error', message: 'Failed to prepare track. Please try again.' });
      setLoading(false);
    }
  };

  const clearFile = (type: 'source' | 'reference') => {
    if (type === 'source') {
      setSourceTrack(null);
      if (sourceInputRef.current) sourceInputRef.current.value = '';
    } else {
      setReferenceTrack(null);
      if (referenceInputRef.current) referenceInputRef.current.value = '';
      if (masteringMode === 'reference') setMasteringMode('preset');
    }
    setStatus({ type: '', message: '' });
  };

  const FileUploadZone = ({ file, onFileSelect, onClear, type, label, required = false }: {
    file: File | null;
    onFileSelect: (file: File | null, type: 'source' | 'reference') => void;
    onClear: (type: 'source' | 'reference') => void;
    type: 'source' | 'reference';
    label: string;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, type)}
      >
        <input
          ref={type === 'source' ? sourceInputRef : referenceInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0] || null, type)}
        />
        
        {file ? (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v13zM9 19a2 2 0 002 2h2a2 2 0 002-2V9M9 19V9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
            <button
              onClick={() => onClear(type)}
              className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">
              Drop your audio file here or{' '}
              <button
                onClick={() => (type === 'source' ? sourceInputRef : referenceInputRef).current?.click()}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-400">MP3, WAV, FLAC, AAC, OGG (max 100MB)</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Audio Mastering</h1>
          <p className="text-gray-300">Professional mastering powered by artificial intelligence</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          
          {/* Source Track Upload */}
          <FileUploadZone
            file={sourceTrack}
            onFileSelect={handleFileSelect}
            onClear={clearFile}
            type="source"
            label="Source Track"
            required
          />

          {/* Mastering Mode Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Mastering Method
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMasteringMode('preset')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  masteringMode === 'preset'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <p className="font-medium">Use Preset</p>
                  <p className="text-xs opacity-75">AI-optimized settings</p>
                </div>
              </button>
              
              <button
                onClick={() => setMasteringMode('reference')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  masteringMode === 'reference'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v13zM9 19a2 2 0 002 2h2a2 2 0 002-2V9M9 19V9" />
                    </svg>
                  </div>
                  <p className="font-medium">Reference Track</p>
                  <p className="text-xs opacity-75">Match another song</p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Content */}
          {masteringMode === 'preset' ? (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Genre Preset</label>
              <select
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl bg-white text-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
              >
                <option value="Hip Hop">🎤 Hip Hop</option>
                <option value="EDM">🎛️ EDM</option>
                <option value="Podcast">🎙️ Podcast</option>
                <option value="Lo-Fi">🌙 Lo-Fi</option>
                <option value="Pop">🎵 Pop</option>
                <option value="Rock">🎸 Rock</option>
                <option value="Jazz">🎺 Jazz</option>
                <option value="Classical">🎻 Classical</option>
              </select>
            </div>
          ) : (
            <FileUploadZone
              file={referenceTrack}
              onFileSelect={handleFileSelect}
              onClear={clearFile}
              type="reference"
              label="Reference Track"
            />
          )}

          {/* Status Messages */}
          {status.message && (
            <div className={`p-4 rounded-xl border-l-4 ${
              status.type === 'error' 
                ? 'bg-red-50 border-red-500 text-red-700'
                : status.type === 'success'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-blue-50 border-blue-500 text-blue-700'
            }`}>
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            disabled={loading}
            onClick={handleGenerate}
            className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                <span>Preparing...</span>
              </div>
            ) : (
              `Generate Master${masteringMode === 'preset' ? ` (${preset})` : ' (Reference)'}`
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-400 text-sm">
          <p>Professional audio mastering • Powered by AI • Maximum file size: 100MB</p>
        </div>
      </div>
    </div>
  );
}