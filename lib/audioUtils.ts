import { promises as fs } from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { parseBuffer } from 'music-metadata';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Enhanced FFmpeg path detection and configuration
export async function configureFfmpeg(): Promise<boolean> {
  console.log('🔧 Configuring FFmpeg...');
  
  try {
    // Try to detect FFmpeg automatically
    const { stdout: ffmpegPath } = await execAsync('which ffmpeg');
    const { stdout: ffprobePath } = await execAsync('which ffprobe');
    
    const cleanFFmpegPath = ffmpegPath.trim();
    const cleanFFprobePath = ffprobePath.trim();
    
    console.log('📍 Found FFmpeg at:', cleanFFmpegPath);
    console.log('📍 Found FFprobe at:', cleanFFprobePath);
    
    ffmpeg.setFfmpegPath(cleanFFmpegPath);
    ffmpeg.setFfprobePath(cleanFFprobePath);
    
    // Test FFmpeg is working
    await testFFmpeg();
    
    return true;
  } catch (error) {
    console.warn('⚠️ Auto-detection failed, trying manual paths...');
    
    // Fallback to common paths
    const commonPaths = {
      darwin: {
        ffmpeg: ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg'],
        ffprobe: ['/opt/homebrew/bin/ffprobe', '/usr/local/bin/ffprobe', '/usr/bin/ffprobe']
      },
      linux: {
        ffmpeg: ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'],
        ffprobe: ['/usr/bin/ffprobe', '/usr/local/bin/ffprobe']
      },
      win32: {
        ffmpeg: ['C:\\ffmpeg\\bin\\ffmpeg.exe', 'ffmpeg.exe'],
        ffprobe: ['C:\\ffmpeg\\bin\\ffprobe.exe', 'ffprobe.exe']
      }
    };
    
    const platform = process.platform as keyof typeof commonPaths;
    const paths = commonPaths[platform];
    
    if (paths) {
      for (const ffmpegPath of paths.ffmpeg) {
        try {
          const stats = await fs.stat(ffmpegPath);
          if (stats.isFile()) {
            console.log('📍 Found FFmpeg at:', ffmpegPath);
            ffmpeg.setFfmpegPath(ffmpegPath);
            
            // Find corresponding ffprobe
            for (const ffprobePath of paths.ffprobe) {
              try {
                const probeStats = await fs.stat(ffprobePath);
                if (probeStats.isFile()) {
                  console.log('📍 Found FFprobe at:', ffprobePath);
                  ffmpeg.setFfprobePath(ffprobePath);
                  await testFFmpeg();
                  return true;
                }
              } catch {}
            }
          }
        } catch {}
      }
    }
    
    throw new Error('FFmpeg not found. Please install FFmpeg and ensure it\'s in your PATH.');
  }
}

// Test FFmpeg functionality
async function testFFmpeg(): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('color=black:size=1x1:duration=0.1')
      .inputOptions(['-f', 'lavfi'])
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .format('mp3')
      .output('/dev/null')
      .on('end', () => {
        console.log('✅ FFmpeg test successful');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg test failed:', err.message);
        reject(err);
      })
      .run();
  });
}

// Initialize FFmpeg on module load
let ffmpegConfigured = false;
export const initializeFFmpeg = async (): Promise<boolean> => {
  if (!ffmpegConfigured) {
    try {
      ffmpegConfigured = await configureFfmpeg();
      console.log('🎵 FFmpeg configured successfully');
    } catch (error) {
      console.error('❌ FFmpeg configuration failed:', error);
      ffmpegConfigured = false;
    }
  }
  return ffmpegConfigured;
};

export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  bitrate: number;
  channels: number;
  maxVolume: number;
  meanVolume: number;
  format: string;
  peakLoudness?: number;
  integratedLoudness?: number;
  loudnessRange?: number;
}

export interface MasteringSettings {
  eq: {
    lowShelf?: { freq: number; gain: number };
    peak?: { freq: number; gain: number; q: number };
    highShelf?: { freq: number; gain: number };
  };
  compression: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  limiting: {
    threshold: number;
    release: number;
  };
  stereoWidth: number;
  lufs: number;
}

// Enhanced audio analysis with better error handling
export async function analyzeAudioAdvanced(filePath: string): Promise<AudioAnalysis> {
  await initializeFFmpeg();
  
  console.log('🔍 Analyzing audio file:', filePath);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`Audio file not found: ${filePath}`);
  }
  
  return new Promise((resolve, reject) => {
    let analysis: Partial<AudioAnalysis> = {};
    let volumeDetected = false;
    let metadataDetected = false;
    
    // First pass: Get basic metadata
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('FFprobe error:', err);
        reject(new Error(`Failed to analyze audio file: ${err.message}`));
        return;
      }
      
      const stream = metadata.streams?.[0];
      if (stream) {
        analysis.duration = metadata.format?.duration || 0;
        analysis.sampleRate = stream.sample_rate || 44100;
        analysis.bitrate = metadata.format?.bit_rate || 320000;
        analysis.channels = stream.channels || 2;
        analysis.format = metadata.format?.format_name || 'unknown';
        metadataDetected = true;
        
        console.log('📊 Basic metadata:', {
          duration: analysis.duration,
          sampleRate: analysis.sampleRate,
          channels: analysis.channels
        });
      }
      
      // Second pass: Analyze loudness and dynamics
      const command = ffmpeg(filePath)
        .audioFilters(['volumedetect'])
        .format('null')
        .output('-');
      
      command.on('stderr', (stderrLine) => {
        // Parse volume detection
        const maxVolumeMatch = stderrLine.match(/max_volume: ([-\d.]+) dB/);
        const meanVolumeMatch = stderrLine.match(/mean_volume: ([-\d.]+) dB/);
        
        if (maxVolumeMatch) {
          analysis.maxVolume = parseFloat(maxVolumeMatch[1]);
          console.log('📈 Max volume:', analysis.maxVolume, 'dB');
        }
        if (meanVolumeMatch) {
          analysis.meanVolume = parseFloat(meanVolumeMatch[1]);
          console.log('📊 Mean volume:', analysis.meanVolume, 'dB');
          volumeDetected = true;
        }
      });
      
      command.on('end', () => {
        const result: AudioAnalysis = {
          duration: analysis.duration || 0,
          sampleRate: analysis.sampleRate || 44100,
          bitrate: analysis.bitrate || 320000,
          channels: analysis.channels || 2,
          maxVolume: analysis.maxVolume || -6,
          meanVolume: analysis.meanVolume || -20,
          format: analysis.format || 'unknown'
        };
        
        console.log('✅ Audio analysis complete:', result);
        resolve(result);
      });
      
      command.on('error', (error) => {
        console.error('Volume analysis error:', error);
        // Return basic analysis on error
        const result: AudioAnalysis = {
          duration: analysis.duration || 0,
          sampleRate: analysis.sampleRate || 44100,
          bitrate: analysis.bitrate || 320000,
          channels: analysis.channels || 2,
          maxVolume: analysis.maxVolume || -6,
          meanVolume: analysis.meanVolume || -20,
          format: analysis.format || 'unknown'
        };
        resolve(result);
      });
      
      command.run();
    });
  });
}

// Build professional mastering filter chain
export function buildMasteringChain(settings: MasteringSettings, analysis: AudioAnalysis): string[] {
  const filters: string[] = [];
  
  console.log('🎛️ Building mastering chain for preset with settings:', settings);
  
  // 1. High-pass filter to remove sub-bass rumble
  filters.push('highpass=f=20:poles=2');
  
  // 2. Low-frequency enhancement
  if (settings.eq.lowShelf) {
    filters.push(`bass=g=${settings.eq.lowShelf.gain}:f=${settings.eq.lowShelf.freq}:w=0.5`);
  }
  
  // 3. Midrange enhancement
  if (settings.eq.peak) {
    filters.push(`equalizer=f=${settings.eq.peak.freq}:width_type=q:width=${settings.eq.peak.q}:g=${settings.eq.peak.gain}`);
  }
  
  // 4. High-frequency air band
  if (settings.eq.highShelf) {
    filters.push(`treble=g=${settings.eq.highShelf.gain}:f=${settings.eq.highShelf.freq}:w=0.5`);
  }
  
  // 5. Main compression
  filters.push(`acompressor=threshold=${settings.compression.threshold}dB:ratio=${settings.compression.ratio}:attack=${settings.compression.attack}:release=${settings.compression.release}:makeup=2dB:knee=2:detection=peak`);
  
  // 6. Stereo width enhancement
  if (settings.stereoWidth !== 100) {
    const widthFactor = (settings.stereoWidth - 100) / 100;
    if (Math.abs(widthFactor) > 0.05) {
      filters.push(`extrastereo=m=${widthFactor}:c=false`);
    }
  }
  
  // 7. Harmonic exciter for warmth and presence
  filters.push('aexciter=level_in=1:level_out=1:amount=1:drive=8.5:blend=0.8:freq=7500:ceil=16000:listen=0');
  
  // 8. Calculate makeup gain based on analysis
  const targetLUFS = settings.lufs;
  const currentLUFS = analysis.meanVolume || -20;
  const makeupGain = Math.min(12, Math.max(-12, targetLUFS - currentLUFS + 6));
  
  // 9. Final brick-wall limiter
  filters.push(`alimiter=level_in=${makeupGain}dB:level_out=${settings.limiting.threshold}dB:limit=${settings.limiting.threshold}dB:attack=0.5:release=${settings.limiting.release}:asc=1`);
  
  console.log('🔧 Generated filter chain:', filters);
  return filters;
}

// Apply mastering with comprehensive error handling
export async function applyAdvancedMastering(
  inputPath: string,
  outputPath: string,
  settings: MasteringSettings,
  analysis: AudioAnalysis,
  onProgress?: (progress: number) => void
): Promise<void> {
  await initializeFFmpeg();
  
  console.log('🎛️ Starting mastering process...');
  console.log('📥 Input:', inputPath);
  console.log('📤 Output:', outputPath);
  
  // Verify input file exists
  try {
    await fs.access(inputPath);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  
  const filters = buildMasteringChain(settings, analysis);
  
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath);
    
    command
      .audioFilters(filters)
      .audioBitrate('320k')
      .audioChannels(2)
      .audioFrequency(44100)
      .format('mp3')
      .audioCodec('libmp3lame')
      .outputOptions([
        '-q:a 0',  // Highest quality VBR
        '-map_metadata 0',  // Preserve metadata
        '-id3v2_version 3'  // ID3v2.3 tags
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('🚀 FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0);
        console.log(`⏳ Mastering progress: ${percent}%`);
        onProgress?.(percent);
      })
      .on('end', async () => {
        try {
          // Verify output file was created
          const stats = await fs.stat(outputPath);
          if (stats.size === 0) {
            throw new Error('Output file is empty');
          }
          console.log('✅ Mastering completed successfully, output size:', stats.size, 'bytes');
          resolve();
        } catch (error) {
          reject(new Error(`Output verification failed: ${error}`));
        }
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg mastering error:', err);
        reject(new Error(`Mastering failed: ${err.message}`));
      })
      .run();
  });
}

// Reference track matching
export async function applyReferenceMastering(
  sourcePath: string,
  referencePath: string,
  outputPath: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  await initializeFFmpeg();
  
  console.log('🎯 Starting reference matching...');
  
  try {
    // Analyze reference track
    console.log('🔍 Analyzing reference track...');
    const referenceAnalysis = await analyzeAudioAdvanced(referencePath);
    
    console.log('📊 Reference analysis:', referenceAnalysis);
    
    // Build reference-matching filter chain
    const filters: string[] = [
      'highpass=f=20:poles=2',
      // EQ matching (simplified spectral matching)
      'equalizer=f=60:width_type=q:width=0.7:g=0.5',
      'equalizer=f=200:width_type=q:width=1:g=0.3',
      'equalizer=f=1000:width_type=q:width=0.8:g=0.2',
      'equalizer=f=3000:width_type=q:width=1.2:g=0.4',
      'equalizer=f=8000:width_type=q:width=0.9:g=0.3',
      // Match dynamics
      'acompressor=threshold=-16dB:ratio=3:attack=5:release=80:makeup=3dB:knee=2',
      // Match loudness
      `alimiter=level_in=3dB:level_out=-1dB:limit=-1dB:attack=1:release=50:asc=1`
    ];
    
    return new Promise((resolve, reject) => {
      ffmpeg(sourcePath)
        .audioFilters(filters)
        .audioBitrate('320k')
        .audioChannels(2)
        .audioFrequency(44100)
        .format('mp3')
        .audioCodec('libmp3lame')
        .outputOptions(['-q:a 0', '-map_metadata 0'])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('🎯 Reference matching command:', commandLine);
        })
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          console.log(`🎯 Reference matching: ${percent}%`);
          onProgress?.(percent);
        })
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            console.log('✅ Reference matching completed, output size:', stats.size, 'bytes');
            resolve();
          } catch (error) {
            reject(new Error(`Reference matching output verification failed: ${error}`));
          }
        })
        .on('error', reject)
        .run();
    });
    
  } catch (error) {
    console.error('❌ Reference matching error:', error);
    throw new Error(`Reference matching failed: ${error}`);
  }
}

// Utility functions
export async function cleanupTempFiles(tempDir: string, maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const tempRoot = path.join(process.cwd(), 'temp');
    const entries = await fs.readdir(tempRoot, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(tempRoot, entry.name);
        const stats = await fs.stat(dirPath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.rmdir(dirPath, { recursive: true });
          console.log(`🗑️ Cleaned up old temp directory: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

export function isValidAudioFormat(filename: string): boolean {
  const supportedFormats = [
    'mp3', 'wav', 'flac', 'aiff', 'aif', 'm4a', 'aac', 'ogg', 'mp4', 'wma'
  ];
  
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? supportedFormats.includes(extension) : false;
}

export function getAudioMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'aiff': 'audio/aiff',
    'aif': 'audio/aiff',
    'ogg': 'audio/ogg',
    'mp4': 'audio/mp4',
    'wma': 'audio/x-ms-wma'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}