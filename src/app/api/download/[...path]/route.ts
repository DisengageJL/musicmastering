// src/app/api/download/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAudioMimeType } from '@/lib/audioProcessing';

interface DownloadParams {
  params: {
    path: string[];
  };
}

export async function GET(
  request: NextRequest,
  { params }: DownloadParams
) {
  try {
    const { path: pathSegments } = params;
    
    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json(
        { error: 'Invalid download path' },
        { status: 400 }
      );
    }

    const [sessionId, filename] = pathSegments;

    // Validate session ID format (basic validation)
    if (!sessionId.match(/^[a-f0-9-]{36}$/)) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Validate filename
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Construct file path
    const tempDir = path.join(process.cwd(), 'temp');
    const sessionDir = path.join(tempDir, sessionId);
    const filePath = path.join(sessionDir, filename);

    // Security check: ensure file is within session directory
    const normalizedSessionDir = path.resolve(sessionDir);
    const normalizedFilePath = path.resolve(filePath);
    
    if (!normalizedFilePath.startsWith(normalizedSessionDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if file exists
    let fileStats;
    try {
      fileStats = await fs.stat(filePath);
    } catch (error) {
      console.error(`File not found: ${filePath}`);
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      );
    }

    // Check if it's a file (not directory)
    if (!fileStats.isFile()) {
      return NextResponse.json(
        { error: 'Invalid file' },
        { status: 400 }
      );
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine MIME type
    const mimeType = getAudioMimeType(filename);
    
    // Generate a user-friendly filename
    const downloadFilename = filename.startsWith('mastered_') 
      ? `MasterAI_${filename}` 
      : filename;

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set('Content-Length', fileStats.size.toString());
    headers.set('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Add security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');

    console.log(`📥 Downloading: ${filename} (${Math.round(fileStats.size / 1024)}KB) for session ${sessionId}`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { 
        error: 'Download failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : 'Unknown error') : 
          undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}