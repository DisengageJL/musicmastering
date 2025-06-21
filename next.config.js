import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enable server components and other experimental features
    serverComponentsExternalPackages: [
      'fluent-ffmpeg', 
      'music-metadata',
      'sharp',
      'formidable'
    ],
  },
  
  // Handle external packages that need to run on server
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      // Mark FFmpeg and related packages as external for server builds
      config.externals.push({
        'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
        'music-metadata': 'commonjs music-metadata',
        'sharp': 'commonjs sharp',
        'formidable': 'commonjs formidable',
      });
    }
    
    // Handle audio file imports
    config.module.rules.push({
      test: /\.(mp3|wav|flac|m4a|aac|ogg)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });
    
    // Handle node modules that might have issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      buffer: false,
    };
    
    return config;
  },
  
  // Headers for audio streaming and CORS
  async headers() {
    return [
      // API routes headers
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // Download endpoint specific headers
      {
        source: '/api/download/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Security headers for all pages
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for clean URLs
  async redirects() {
    return [
      {
        source: '/master',
        destination: '/generator',
        permanent: true,
      },
      {
        source: '/upload',
        destination: '/generator',
        permanent: true,
      },
      {
        source: '/test',
        destination: '/debug',
        permanent: true,
      },
    ];
  },
  
  // Image optimization (for waveform generation if needed)
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Output configuration for deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Compression for better performance
  compress: true,
  
  // Environment variables that should be available on client side
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    APP_VERSION: process.env.npm_package_version || '1.0.0',
  },
  
  // PoweredByHeader
  poweredByHeader: false,
  
  // Development-specific optimizations
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      // Ignore type errors during development for faster builds
      ignoreBuildErrors: false,
    },
    eslint: {
      // Ignore ESLint errors during development builds
      ignoreDuringBuilds: false,
    },
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Remove console.logs in production
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
    // Enable SWC minification
    swcMinify: true,
  }),
};

export default nextConfig;