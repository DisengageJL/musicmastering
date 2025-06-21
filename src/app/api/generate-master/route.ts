// src/app/api/generate-master/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  initializeFFmpeg, 
  analyzeAudioAdvanced, 
  applyAdvancedMastering,
  applyReferenceMastering,
  isValidAudioFormat,
  cleanupTempFiles,
  type MasteringSettings,
  type AudioAnalysis
} from '@/lib/audioProcessing';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per window (more restrictive for FFmpeg)
const requestTracker = new Map<string, { count: number; resetTime: number }>();

// Mastering presets with professional settings
const MASTERING_PRESETS: Record<string, MasteringSettings> = {
  'hip-hop': {
    eq: {
      lowShelf: { freq: 80, gain: 2 },
      peak: { freq: 2500, gain: 1, q: 0.8 },
      highShelf: { freq: 10000, gain: 1.5 }
    },
    compression: {
      threshold: -18,
      ratio: 4,
      attack: 3,
      release: 100
    },
    limiting: {
      threshold: -1,
      release: 50
    },
    stereoWidth: 110,
    lufs: -14
  },
  'pop': {
    eq: {
      lowShelf: { freq: 100, gain: 1 },
      peak: { freq: 3000, gain: 2, q: 1.2 },
      highShelf: { freq: 8000, gain: 2 }
    },
    compression: {
      threshold: -16,
      ratio: 3,
      attack: 5,
      release: 80
    },
    limiting: {
      threshold: -0.5,
      release: 30
    },
    stereoWidth: 105,
    lufs: -12
  },
  'rock': {
    eq: {
      lowShelf: { freq: 60, gain: 1.5 },
      peak: { freq: 1200, gain: 1.5, q: 0.6 },
      highShelf: { freq: 6000, gain: 1 }
    },
    compression: {
      threshold: -20,
      ratio: 6,
      attack: 1,
      release: 60
    },
    limiting: {
      threshold: -1,
      release: 20
    },
    stereoWidth: 100,
    lufs: -11
  },
  'electronic': {
    eq: {
      lowShelf: { freq: 50, gain: 2.5 },
      peak: { freq: 4000, gain: 1, q: 1.0 },
      highShelf: { freq: 12000, gain: 2 }
    },
    compression: {
      threshold: -15,
      ratio: 4,
      attack: 0.5,
      release: 40
    },
    limiting: {
      threshold: -0.3,
      release: 10
    },
    stereoWidth: 120,
    lufs: -9
  },
  'classical': {
    eq: {
      lowShelf: { freq: 40, gain: 0.5 },
      peak: { freq: 2000, gain: 0.5, q: 0.5 },
      highShelf: { freq: 8000, gain: 0.5 }
    },
    compression: {
      threshold: -25,
      ratio: 1.5,
      attack: 10,
      release: 200
    },
    limiting: {
      threshold: -3,
      release: 100
    },
    stereoWidth: 100,
    lufs: -23
  },
  'jazz': {
    eq: {
      lowShelf: { freq: 80, gain: 0.5 },
      peak: { freq: 1500, gain: 1, q: 0.7 },
      highShelf: { freq: 7000, gain: 1 }
    },
    compression: {
      threshold: -22,
      ratio: 2.5,
      attack: 8,
      release: 120
    },
    limiting: {
      threshold: -2,
      release: 80
    },
    stereoWidth: 105,
    lufs: -18
  },
  'podcast': {
    eq: {
      lowShelf: { freq: 100, gain: -1 },
      peak: { freq: 3000, gain: 2, q: 1.0 },
      highShelf: { freq: 8000, gain: 0.5 }
    },
    compression: {
      threshold: -20,
      ratio: 6,
      attack: 2,
      release: 60
    },
    limiting: {
      threshold: -3,
      release: 50
    },
    stereoWidth: 100,
    lufs: -16
  }
};

interface ProcessingRequest {
  source: File;
  reference?: File;
  preset: string;
  mode: 'preset' | 'reference';
  paymentConfirmed: boolean;
}

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const tracker = requestTracker.get(key);

  if (!tracker || now > tracker.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    requestTracker.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime };
  }

  if (tracker.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: tracker.resetTime };
  }

  tracker.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_REQUESTS - tracker.count, 
    resetTime: tracker.resetTime 
  };
}

async function ensureTempDirectory(): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
  return tempDir;
}

async function saveUploadedFile(file: File, sessionDir: string, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(sessionDir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

// Health check endpoint
export async function GET() {
  try {
    console.log('🏥 Health check requested');
    
    // Initialize FFmpeg and check if it's available
    const ffmpegReady = await initializeFFmpeg();
    
    return NextResponse.json({
      status: 'ok',
      ffmpeg: ffmpegReady ? 'available' : 'not available',
      timestamp: new Date().toISOString(),
      presets: Object.keys(MASTERING_PRESETS),
      endpoints: {
        health: 'GET /api/generate-master',
        process: 'POST /api/generate-master'
      }
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      ffmpeg: 'not available',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Main processing endpoint
export async function POST(request: NextRequest) {
  const sessionId = uuidv4();
  let sessionDir: string | null = null;
  
  console.log(`🎵 Processing request ${sessionId}`);
  
  // Check rate limiting
  const rateLimitKey = getRateLimitKey(request);
  const rateLimit = checkRateLimit(rateLimitKey);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      }
    );
  }

  try {
    // Initialize FFmpeg
    console.log('🔧 Initializing FFmpeg...');
    const ffmpegReady = await initializeFFmpeg();
    if (!ffmpegReady) {
      throw new Error('FFmpeg is not available. Please ensure FFmpeg is installed and configured.');
    }

    // Create session directory
    const tempDir = await ensureTempDirectory();
    sessionDir = path.join(tempDir, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Parse form data
    const formData = await request.formData();
    const sourceFile = formData.get('source') as File;
    const referenceFile = formData.get('reference') as File | null;
    const preset = (formData.get('preset') as string) || 'pop';
    const mode = (formData.get('mode') as string) || 'preset';
    const paymentConfirmed = formData.get('paymentConfirmed') === 'true';

    // Validate inputs
    if (!sourceFile) {
      throw new Error('No source audio file provided');
    }

    if (!isValidAudioFormat(sourceFile.name)) {
      throw new Error('Unsupported audio format. Please use MP3, WAV, FLAC, M4A, AAC, or OGG.');
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (sourceFile.size > maxSize) {
      throw new Error('File too large. Maximum size is 100MB.');
    }

    if (!paymentConfirmed && process.env.NODE_ENV === 'production') {
      throw new Error('Payment confirmation required');
    }

    // Validate preset
    if (mode === 'preset' && !MASTERING_PRESETS[preset]) {
      throw new Error(`Invalid preset: ${preset}`);
    }

    console.log(`📁 Processing: ${sourceFile.name} (${Math.round(sourceFile.size / 1024)}KB)`);
    console.log(`🎛️ Mode: ${mode}, Preset: ${preset}`);

    // Save uploaded files
    const sourcePath = await saveUploadedFile(sourceFile, sessionDir, `source_${sourceFile.name}`);
    let referencePath: string | undefined;

    if (referenceFile && mode === 'reference') {
      if (!isValidAudioFormat(referenceFile.name)) {
        throw new Error('Unsupported reference audio format');
      }
      referencePath = await saveUploadedFile(referenceFile, sessionDir, `reference_${referenceFile.name}`);
      console.log(`🎯 Reference track: ${referenceFile.name}`);
    }

    // Analyze source audio
    console.log('🔍 Analyzing source audio...');
    const sourceAnalysis = await analyzeAudioAdvanced(sourcePath);
    console.log('📊 Source analysis:', sourceAnalysis);

    // Generate output filename
    const outputFilename = `mastered_${Date.now()}.mp3`;
    const outputPath = path.join(sessionDir, outputFilename);

    let processingStartTime = Date.now();
    let progress = 0;

    // Process audio based on mode
    if (mode === 'reference' && referencePath) {
      console.log('🎯 Applying reference matching...');
      await applyReferenceMastering(
        sourcePath,
        referencePath,
        outputPath,
        (progressPercent) => {
          progress = progressPercent;
          console.log(`⏳ Reference matching progress: ${progress}%`);
        }
      );
    } else {
      console.log(`🎛️ Applying ${preset} preset mastering...`);
      const masteringSettings = MASTERING_PRESETS[preset];
      await applyAdvancedMastering(
        sourcePath,
        outputPath,
        masteringSettings,
        sourceAnalysis,
        (progressPercent) => {
          progress = progressPercent;
          console.log(`⏳ Mastering progress: ${progress}%`);
        }
      );
    }

    const processingTime = Math.round((Date.now() - processingStartTime) / 1000);

    // Analyze output audio
    console.log('🔍 Analyzing processed audio...');
    const outputAnalysis = await analyzeAudioAdvanced(outputPath);
    console.log('📊 Output analysis:', outputAnalysis);

    // Get file stats
    const outputStats = await fs.stat(outputPath);
    const outputSize = outputStats.size;

    console.log(`✅ Processing complete in ${processingTime}s, output: ${Math.round(outputSize / 1024)}KB`);

    // Create download URL
    const downloadUrl = `/api/download/${sessionId}/${outputFilename}`;

    // Schedule cleanup (cleanup temp files after 24 hours)
    setTimeout(async () => {
      try {
        await fs.rm(sessionDir!, { recursive: true, force: true });
        console.log(`🗑️ Cleaned up session: ${sessionId}`);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 24 * 60 * 60 * 1000);

    // Return success response
    return NextResponse.json({
      success: true,
      sessionId,
      downloadUrl,
      processingTime,
      outputSize,
      originalAnalysis: sourceAnalysis,
      processedAnalysis: outputAnalysis,
      settings: mode === 'preset' ? MASTERING_PRESETS[preset] : { mode: 'reference' },
      improvements: {
        loudnessChange: outputAnalysis.meanVolume - sourceAnalysis.meanVolume,
        dynamicRangeChange: outputAnalysis.maxVolume - sourceAnalysis.maxVolume,
        formatImprovement: `${sourceAnalysis.format} → MP3 320kbps`,
        processingApplied: mode === 'reference' ? 'Reference Matching' : `${preset} Preset`
      }
    }, {
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });

  } catch (error: any) {
    console.error(`❌ Processing failed for session ${sessionId}:`, error);

    // Cleanup on error
    if (sessionDir) {
      try {
        await fs.rm(sessionDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    // Handle specific error types
    let errorMessage = 'Audio processing failed';
    let statusCode = 500;

    if (error.message.includes('not found') || error.message.includes('ENOENT')) {
      errorMessage = 'Audio file could not be processed';
      statusCode = 400;
    } else if (error.message.includes('FFmpeg')) {
      errorMessage = 'Audio processing service unavailable';
      statusCode = 503;
    } else if (error.message.includes('Rate limit')) {
      errorMessage = error.message;
      statusCode = 429;
    } else if (error.message.includes('Payment')) {
      errorMessage = error.message;
      statusCode = 402;
    } else if (error.message.includes('format') || error.message.includes('size')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        sessionId
      },
      { status: statusCode }
    );
  }
}

// Cleanup endpoint (can be called manually or via cron)
export async function DELETE() {
  try {
    console.log('🧹 Starting cleanup of old temp files...');
    await cleanupTempFiles('temp');
    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup completed successfully' 
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}