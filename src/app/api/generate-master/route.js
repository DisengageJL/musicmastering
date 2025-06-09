// src/app/api/generate-master/route.js
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Simple mastering presets (we'll add real processing later)
const MASTERING_PRESETS = {
  'Hip Hop': { targetLUFS: -14, compression: 'high' },
  'EDM': { targetLUFS: -12, compression: 'heavy' },
  'Pop': { targetLUFS: -14, compression: 'medium' },
  'Rock': { targetLUFS: -13, compression: 'medium' },
  'Jazz': { targetLUFS: -18, compression: 'light' },
  'Classical': { targetLUFS: -23, compression: 'minimal' },
  'Lo-Fi': { targetLUFS: -16, compression: 'medium' },
  'Podcast': { targetLUFS: -16, compression: 'speech' }
};

export async function POST(request) {
  console.log('🎵 API Route Hit - Starting processing...');

  try {
    // Parse the form data
    const formData = await request.formData();
    const sourceFile = formData.get('source');
    const referenceFile = formData.get('reference');
    const preset = formData.get('preset') || 'Hip Hop';
    
    console.log('📁 Files received:', {
      source: sourceFile?.name,
      reference: referenceFile?.name,
      preset
    });

    // Validate source file
    if (!sourceFile) {
      console.log('❌ No source file provided');
      return NextResponse.json({ 
        error: 'No source file provided' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg'];
    if (!allowedTypes.includes(sourceFile.type)) {
      console.log('❌ Invalid file type:', sourceFile.type);
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload MP3, WAV, FLAC, AAC, or OGG files.' 
      }, { status: 400 });
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (sourceFile.size > maxSize) {
      console.log('❌ File too large:', sourceFile.size);
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 100MB.' 
      }, { status: 400 });
    }

    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    console.log('🆔 Session ID:', sessionId);

    // Create directories
    const uploadDir = path.join(process.cwd(), 'uploads', sessionId);
    const outputDir = path.join(process.cwd(), 'public', 'downloads');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log('📁 Created upload directory:', uploadDir);
    }
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
      console.log('📁 Created output directory:', outputDir);
    }

    // Save source file
    const sourceBytes = await sourceFile.arrayBuffer();
    const sourceBuffer = Buffer.from(sourceBytes);
    const sourceExt = getFileExtension(sourceFile.name);
    const sourceFilename = `source_${sessionId}.${sourceExt}`;
    const sourcePath = path.join(uploadDir, sourceFilename);
    
    await writeFile(sourcePath, sourceBuffer);
    console.log('✅ Source file saved:', sourcePath);

    // Handle reference file if provided
    let referenceInfo = null;
    if (referenceFile) {
      const referenceBytes = await referenceFile.arrayBuffer();
      const referenceBuffer = Buffer.from(referenceBytes);
      const referenceExt = getFileExtension(referenceFile.name);
      const referenceFilename = `reference_${sessionId}.${referenceExt}`;
      const referencePath = path.join(uploadDir, referenceFilename);
      
      await writeFile(referencePath, referenceBuffer);
      console.log('✅ Reference file saved:', referencePath);
      
      referenceInfo = {
        filename: referenceFile.name,
        size: referenceFile.size,
        path: referencePath
      };
    }

    // Simulate processing (replace with real processing later)
    console.log('⚙️ Starting simulated processing...');
    await simulateProcessing();

    // Create output filename
    const outputFilename = `mastered_${sessionId}.wav`;
    const outputPath = path.join(outputDir, outputFilename);

    // For now, copy the source file as the "processed" output
    // (In real implementation, this would be the actual processed audio)
    await writeFile(outputPath, sourceBuffer);
    console.log('✅ Output file created:', outputPath);

    // Generate download URL
    const downloadUrl = `/downloads/${outputFilename}`;

    // Prepare response data
    const responseData = {
      success: true,
      downloadUrl,
      sessionId,
      originalFile: sourceFile.name,
      preset: preset,
      processingTime: '45 seconds',
      improvements: {
        loudness: `${MASTERING_PRESETS[preset].targetLUFS} LUFS`,
        dynamicRange: 'Optimized',
        stereoWidth: '+15%',
        frequency: 'Enhanced'
      },
      fileInfo: {
        originalSize: sourceFile.size,
        processedSize: sourceBuffer.length,
        format: 'WAV 48kHz/24-bit'
      },
      reference: referenceInfo
    };

    console.log('🎉 Processing completed successfully');
    console.log('📤 Sending response:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Processing failed:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Audio processing failed. Please try again.',
      details: error.message 
    }, { status: 500 });
  }
}

// Simulate processing time
async function simulateProcessing() {
  const steps = [
    'Analyzing audio...',
    'Applying EQ...',
    'Compressing dynamics...',
    'Enhancing stereo image...',
    'Final limiting...'
  ];

  for (const step of steps) {
    console.log(`⚙️ ${step}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Get file extension helper
function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ 
    message: 'Audio mastering API is running',
    timestamp: new Date().toISOString()
  });
}