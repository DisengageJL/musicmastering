// pages/api/audio/process.js
import AudioProcessor from '../../../lib/audioProcessor';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let inputPath = null;
  let outputPath = null;
  let referencePath = null;

  try {
    // Parse multipart form data
    const form = formidable({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    const [fields, files] = await form.parse(req);
    
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    const referenceFile = Array.isArray(files.reference) ? files.reference[0] : files.reference;
    const preset = Array.isArray(fields.preset) ? fields.preset[0] : fields.preset || 'Pop';
    const useReference = Array.isArray(fields.useReference) ? fields.useReference[0] === 'true' : false;

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Set up file paths
    inputPath = audioFile.filepath;
    const timestamp = Date.now();
    const outputFilename = `mastered_${timestamp}.wav`;
    outputPath = path.join(os.tmpdir(), outputFilename);

    console.log(`🎵 Processing audio with ${preset} preset`);
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output: ${outputPath}`);

    const processor = new AudioProcessor();
    let processingResult;

    // Process with or without reference
    if (useReference && referenceFile) {
      console.log('🎯 Using reference track for matching');
      referencePath = referenceFile.filepath;
      
      // Analyze reference track
      const referenceAnalysis = await processor.analyzeReferenceTrack(referencePath);
      console.log('📊 Reference analysis:', referenceAnalysis);
      
      // Process audio with reference matching
      processingResult = await processor.processAudio(inputPath, outputPath, preset, referenceAnalysis);
    } else {
      // Process audio with preset only
      processingResult = await processor.processAudio(inputPath, outputPath, preset);
    }

    // Read the processed audio file
    const processedAudioBuffer = await fs.readFile(outputPath);
    
    // Get file stats for response
    const outputStats = await fs.stat(outputPath);
    
    // Prepare response data
    const responseData = {
      success: true,
      processingResult,
      outputInfo: {
        size: outputStats.size,
        filename: outputFilename,
        format: 'wav',
        bitDepth: 24,
        sampleRate: 48000
      },
      preset,
      timestamp
    };

    // Set headers for audio download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', JSON.stringify(responseData).length);

    // Send response with processing results
    res.status(200).json({
      ...responseData,
      audioData: processedAudioBuffer.toString('base64') // Send audio as base64
    });

  } catch (error) {
    console.error('❌ Audio processing error:', error);
    res.status(500).json({ 
      error: 'Audio processing failed', 
      details: error.message 
    });
  } finally {
    // Clean up temporary files
    try {
      if (inputPath) await fs.unlink(inputPath).catch(() => {});
      if (outputPath) await fs.unlink(outputPath).catch(() => {});
      if (referencePath) await fs.unlink(referencePath).catch(() => {});
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError.message);
    }
  }
}

// Helper function to validate audio file
function validateAudioFile(file) {
  const allowedTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/flac',
    'audio/mp4',
    'audio/m4a',
    'audio/aac'
  ];

  const allowedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac'];
  
  const hasValidType = allowedTypes.includes(file.mimetype);
  const hasValidExtension = allowedExtensions.some(ext => 
    file.originalFilename?.toLowerCase().endsWith(ext)
  );

  return hasValidType || hasValidExtension;
}