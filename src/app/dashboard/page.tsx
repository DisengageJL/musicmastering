'use client';

import { useState, useEffect } from 'react';

interface UserData {
  email: string;
  name: string;
  subscriptionStatus: string;
  joinDate: string;
  billingDate: string;
  tracksProcessedThisMonth: number;
  totalTracksProcessed: number;
}

interface ProcessingHistory {
  id: string;
  fileName: string;
  preset: string;
  processedDate: string;
  downloadUrl: string | null;
  status: 'completed' | 'processing' | 'failed' | 'expired';
  expiresIn: string;
  canReprocess: boolean;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'account'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    // In a real app, this would fetch from your API
    // For now, we'll use mock data and session storage
    const loadUserData = () => {
      const paymentData = sessionStorage.getItem('paymentConfirmed');
      let email = 'user@example.com';
      
      if (paymentData) {
        const data = JSON.parse(paymentData);
        email = data.email || email;
      }

      setUserData({
        email: email,
        name: email.split('@')[0],
        subscriptionStatus: 'Active',
        joinDate: 'June 2025',
        billingDate: 'July 4, 2025',
        tracksProcessedThisMonth: 12,
        totalTracksProcessed: 47
      });

      // Mock processing history with expiration dates
      setProcessingHistory([
        {
          id: '1',
          fileName: 'My_Song_v2.mp3',
          preset: 'Hip Hop',
          processedDate: '2 hours ago',
          downloadUrl: '/downloads/my_song_v2_mastered.wav',
          status: 'completed',
          expiresIn: '29 days',
          canReprocess: true
        },
        {
          id: '2',
          fileName: 'Podcast_Episode_05.wav',
          preset: 'Podcast',
          processedDate: '1 day ago',
          downloadUrl: '/downloads/podcast_05_mastered.wav',
          status: 'completed',
          expiresIn: '28 days',
          canReprocess: true
        },
        {
          id: '3',
          fileName: 'Demo_Track.mp3',
          preset: 'Pop',
          processedDate: '25 days ago',
          downloadUrl: '/downloads/demo_track_mastered.wav',
          status: 'completed',
          expiresIn: '5 days',
          canReprocess: true
        },
        {
          id: '4',
          fileName: 'Beat_Instrumental.wav',
          preset: 'EDM',
          processedDate: '35 days ago',
          downloadUrl: null,
          status: 'expired',
          expiresIn: 'Expired',
          canReprocess: true
        }
      ]);
    };

    loadUserData();
  }, []);

  const handleQuickMaster = () => {
    // Redirect to generator with subscription flag
    window.location.href = '/generator?subscription=true';
  };

  const handleReprocess = (item: ProcessingHistory) => {
    if (item.status === 'expired' || !item.downloadUrl) {
      // Redirect to generator with preset and settings pre-filled
      const params = new URLSearchParams({
        reprocess: 'true',
        fileName: item.fileName,
        preset: item.preset,
        subscription: 'true'
      });
      window.location.href = `/generator?${params}`;
    }
  };

  const handleDownload = (downloadUrl: string | null, fileName: string) => {
    if (!downloadUrl) {
      alert('Download has expired. You can reprocess this track for free as a subscriber.');
      return;
    }
    
    // Simulate download
    console.log('Downloading:', fileName);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName.replace('.mp3', '_mastered.wav').replace('.wav', '_mastered.wav');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      
      {/* Header */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-white">🎵 MasterAI</div>
            <div className="px-3 py-1 bg-purple-500 text-white rounded-full text-sm font-medium">
              Pro Member
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 text-sm">Welcome back, {userData.name}!</span>
            <button 
              onClick={() => window.location.href = '/'}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Quick Actions Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Your Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleQuickMaster}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              🎵 Master a New Track
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors backdrop-blur-sm"
            >
              📁 Bulk Upload
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">This Month</p>
                <p className="text-3xl font-bold text-white">{userData.tracksProcessedThisMonth}</p>
                <p className="text-green-400 text-sm">tracks mastered</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v13zM9 19a2 2 0 002 2h2a2 2 0 002-2V9M9 19V9" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Tracks</p>
                <p className="text-3xl font-bold text-white">{userData.totalTracksProcessed}</p>
                <p className="text-blue-400 text-sm">all time</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Subscription</p>
                <p className="text-2xl font-bold text-white">{userData.subscriptionStatus}</p>
                <p className="text-green-400 text-sm">renews {userData.billingDate}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Member Since</p>
                <p className="text-2xl font-bold text-white">{userData.joinDate}</p>
                <p className="text-purple-400 text-sm">premium member</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/5 p-1 rounded-xl">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'history', label: 'Processing History', icon: '📁' },
              { id: 'account', label: 'Account Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {processingHistory.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v13zM9 19a2 2 0 002 2h2a2 2 0 002-2V9M9 19V9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.fileName}</p>
                        <p className="text-gray-300 text-sm">
                          {item.preset} preset • {item.processedDate}
                          {item.status === 'completed' && (
                            <span className="text-yellow-400 ml-2">• Expires in {item.expiresIn}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => item.status === 'expired' ? handleReprocess(item) : handleDownload(item.downloadUrl, item.fileName)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        item.status === 'expired' 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {item.status === 'expired' ? 'Reprocess' : 'Download'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  View All History →
                </button>
              </div>
            </div>

            {/* Storage Policy Notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">📁 Download Policy</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-white font-medium">🕒 30-Day Downloads</p>
                  <p className="text-gray-300 text-sm">All processed tracks are available for download for 30 days after processing.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">🔄 Free Reprocessing</p>
                  <p className="text-gray-300 text-sm">As a subscriber, you can reprocess expired tracks anytime with the same settings.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">⚡ Instant Access</p>
                  <p className="text-gray-300 text-sm">Recent tracks (last 7 days) are available for immediate download.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">💾 Smart Storage</p>
                  <p className="text-gray-300 text-sm">We keep your original files and settings to enable easy reprocessing.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Processing History</h3>
              <span className="text-gray-300 text-sm">{processingHistory.length} tracks processed</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-300 font-medium py-3 px-4">File Name</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-4">Preset</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-4">Processed</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-4">Status</th>
                    <th className="text-left text-gray-300 font-medium py-3 px-4">Expires</th>
                    <th className="text-right text-gray-300 font-medium py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processingHistory.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v13zM9 19a2 2 0 002 2h2a2 2 0 002-2V9M9 19V9" />
                            </svg>
                          </div>
                          <span className="text-white font-medium">{item.fileName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                          {item.preset}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{item.processedDate}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'completed' 
                            ? 'bg-green-500/20 text-green-300'
                            : item.status === 'processing'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : item.status === 'expired'
                                ? 'bg-orange-500/20 text-orange-300'
                                : 'bg-red-500/20 text-red-300'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-sm ${
                          item.expiresIn.includes('day') && parseInt(item.expiresIn) <= 7
                            ? 'text-yellow-400'
                            : item.status === 'expired'
                              ? 'text-red-400'
                              : 'text-gray-300'
                        }`}>
                          {item.expiresIn}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {(item.status === 'completed' || item.status === 'expired') && (
                          <button
                            onClick={() => item.status === 'expired' ? handleReprocess(item) : handleDownload(item.downloadUrl, item.fileName)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              item.status === 'expired' 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {item.status === 'expired' ? 'Reprocess' : 'Download'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={userData.email}
                    readOnly
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={userData.name}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors">
                  Update Profile
                </button>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Subscription Details</h3>
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
                <div>
                  <p className="text-white font-medium">Unlimited Monthly Plan</p>
                  <p className="text-gray-300 text-sm">Active since {userData.joinDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">$20.00</p>
                  <p className="text-gray-300 text-sm">per month</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Next billing date:</span>
                  <span className="text-white">{userData.billingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment method:</span>
                  <span className="text-white">•••• •••• •••• 4242</span>
                </div>
              </div>
              <div className="mt-6 flex space-x-4">
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors">
                  Update Payment
                </button>
                <button className="px-6 py-3 text-red-400 hover:text-red-300 font-medium transition-colors">
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Bulk Upload</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-gray-300 mb-4">
                Upload multiple tracks with the same mastering settings to save time.
              </p>
              <p className="text-sm text-gray-400">
                Coming soon! This feature will allow you to process multiple tracks at once.
              </p>
            </div>
            
            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}