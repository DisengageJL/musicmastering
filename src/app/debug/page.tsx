'use client';

import { useState, useEffect } from 'react';

interface HealthCheck {
  status: string;
  ffmpeg: string;
  timestamp: string;
  endpoints?: any;
  error?: string;
}

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function DebugPage() {
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Run health check on page load
  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    try {
      console.log('🏥 Running health check...');
      const response = await fetch('/api/generate-master');
      const data = await response.json();
      setHealthCheck(data);
      console.log('Health check result:', data);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthCheck({
        status: 'error',
        ffmpeg: 'unknown',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const addTestResult = (test: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => [
      ...prev,
      { test, status, message, details }
    ]);
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    // Test 1: Health Check
    addTestResult('Health Check', 'pending', 'Checking API health...');
    try {
      const response = await fetch('/api/generate-master');
      const data = await response.json();
      if (data.status === 'ok' && data.ffmpeg === 'available') {
        addTestResult('Health Check', 'success', 'API is healthy and FFmpeg is available', data);
      } else {
        addTestResult('Health Check', 'error', `API issue: ${data.error || 'FFmpeg not available'}`, data);
      }
    } catch (error) {
      addTestResult('Health Check', 'error', `Failed to reach API: ${error}`);
    }

    // Test 2: File Upload (if file selected)
    if (selectedFile) {
      addTestResult('File Upload', 'pending', 'Testing file upload and processing...');
      try {
        const formData = new FormData();
        formData.append('source', selectedFile);
        formData.append('preset', 'Hip Hop');
        formData.append('paymentConfirmed', 'true');

        const response = await fetch('/api/generate-master', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        
        if (data.success) {
          addTestResult('File Upload', 'success', 'File processed successfully', {
            sessionId: data.sessionId,
            outputSize: data.outputSize,
            processingTime: data.processingTime
          });

          // Test 3: Download
          addTestResult('Download', 'pending', 'Testing download functionality...');
          try {
            const downloadResponse = await fetch(data.downloadUrl);
            if (downloadResponse.ok) {
              const blob = await downloadResponse.blob();
              addTestResult('Download', 'success', `Download successful, size: ${blob.size} bytes`);
            } else {
              addTestResult('Download', 'error', `Download failed: ${downloadResponse.status}`);
            }
          } catch (error) {
            addTestResult('Download', 'error', `Download error: ${error}`);
          }
        } else {
          addTestResult('File Upload', 'error', data.error, data);
        }
      } catch (error) {
        addTestResult('File Upload', 'error', `Upload error: ${error}`);
      }
    } else {
      addTestResult('File Upload', 'error', 'No file selected for testing');
    }

    setIsRunningTests(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
      case 'available':
      case 'success':
        return '✅';
      case 'error':
      case 'not available':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'available':
      case 'success':
        return 'text-green-400';
      case 'error':
      case 'not available':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="px-6 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🔧 MasterAI Debug Console</h1>
          <div className="flex space-x-4">
            <button
              onClick={runHealthCheck}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Refresh Health Check
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-white/20 hover:border-white/40 text-white rounded-lg transition-colors"
            >
              Back to App
            </button>
          </div>
        </div>
      </nav>

      <div className="px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Health Check */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🏥 System Health Check</h2>
            
            {healthCheck ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">API Status:</span>
                      <span className={`font-semibold ${getStatusColor(healthCheck.status)}`}>
                        {getStatusIcon(healthCheck.status)} {healthCheck.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">FFmpeg:</span>
                      <span className={`font-semibold ${getStatusColor(healthCheck.ffmpeg)}`}>
                        {getStatusIcon(healthCheck.ffmpeg)} {healthCheck.ffmpeg}
                      </span>
                    </div>
                  </div>
                </div>

                {healthCheck.error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-300 font-semibold">Error:</p>
                    <p className="text-red-200">{healthCheck.error}</p>
                  </div>
                )}

                {healthCheck.endpoints && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-gray-300 text-sm">
                      Last checked: {new Date(healthCheck.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Running health check...</p>
              </div>
            )}
          </div>

          {/* FFmpeg Installation Guide */}
          {healthCheck?.ffmpeg === 'not available' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-yellow-300 mb-4">⚠️ FFmpeg Not Found</h3>
              <p className="text-yellow-200 mb-4">FFmpeg is required for audio processing. Install it using:</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-yellow-300 font-semibold">macOS (with Homebrew):</p>
                  <code className="block bg-black/30 p-2 rounded text-green-300 font-mono">
                    brew install ffmpeg
                  </code>
                </div>
                
                <div>
                  <p className="text-yellow-300 font-semibold">Ubuntu/Debian:</p>
                  <code className="block bg-black/30 p-2 rounded text-green-300 font-mono">
                    sudo apt update && sudo apt install ffmpeg
                  </code>
                </div>
                
                <div>
                  <p className="text-yellow-300 font-semibold">Windows:</p>
                  <p className="text-yellow-200">Download from <a href="https://ffmpeg.org/download.html" className="text-blue-300 underline">ffmpeg.org</a> and add to PATH</p>
                </div>
              </div>
              
              <p className="text-yellow-200 mt-4">After installation, restart the development server and refresh this page.</p>
            </div>
          )}

          {/* Test Suite */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🧪 Test Suite</h2>
            
            {/* File Upload for Testing */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Upload Test Audio File (Optional):
              </label>
              <input
                type="file"
                accept=".mp3,.wav,.flac,.m4a,.aac"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
              />
              {selectedFile && (
                <p className="text-gray-400 text-sm mt-2">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>

            {/* Run Tests Button */}
            <button
              onClick={runAllTests}
              disabled={isRunningTests}
              className={`w-full py-3 rounded-lg font-semibold transition-colors mb-6 ${
                isRunningTests
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </button>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Test Results:</h3>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-500/10 border-green-500/30'
                        : result.status === 'error'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{result.test}</span>
                      <span className={getStatusColor(result.status)}>
                        {getStatusIcon(result.status)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{result.message}</p>
                    {result.details && (
                      <pre className="mt-2 text-xs text-gray-400 bg-black/20 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">💻 System Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-300">Browser:</p>
                <p className="text-white font-mono">{navigator.userAgent}</p>
              </div>
              
              <div>
                <p className="text-gray-300">Timestamp:</p>
                <p className="text-white font-mono">{new Date().toISOString()}</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🔗 Quick Links</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/api/generate-master"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-500/30 transition-colors"
              >
                <h3 className="font-semibold text-blue-300">API Health Check</h3>
                <p className="text-gray-300 text-sm">GET /api/generate-master</p>
              </a>
              
              <a
                href="/generator"
                className="block p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-500/30 transition-colors"
              >
                <h3 className="font-semibold text-purple-300">Upload Page</h3>
                <p className="text-gray-300 text-sm">Test file upload</p>
              </a>
              
              <a
                href="/"
                className="block p-4 bg-green-600/20 hover:bg-green-600/30 rounded-lg border border-green-500/30 transition-colors"
              >
                <h3 className="font-semibold text-green-300">Main App</h3>
                <p className="text-gray-300 text-sm">Back to homepage</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}