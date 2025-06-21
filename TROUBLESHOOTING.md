# 🔧 MasterAI Troubleshooting Guide

This guide will help you resolve common issues with the audio processing functionality.

## 🚨 Quick Diagnostics

### 1. Run the Debug Page
Visit `http://localhost:3000/debug` to check:
- ✅ API health status
- ✅ FFmpeg availability  
- ✅ File upload/processing tests
- ✅ System information

### 2. Check Health Endpoint
```bash
curl http://localhost:3000/api/generate-master
```

Expected response:
```json
{
  "status": "ok",
  "ffmpeg": "available",
  "timestamp": "2024-..."
}
```

## ❌ Common Issues & Solutions

### Issue 1: "FFmpeg not found" Error

**Symptoms:**
- API returns `"ffmpeg": "not available"`
- Error: "FFmpeg is not available"
- Processing fails immediately

**Solutions:**

#### macOS:
```bash
# Install via Homebrew
brew install ffmpeg

# Verify installation
which ffmpeg
ffmpeg -version
```

#### Ubuntu/Debian:
```bash
# Update packages and install
sudo apt update
sudo apt install ffmpeg

# Verify installation
which ffmpeg
ffmpeg -version
```

#### Windows:
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract to `C:\ffmpeg\`
3. Add `C:\ffmpeg\bin` to system PATH
4. Restart terminal/IDE
5. Verify: `ffmpeg -version`

#### Check FFmpeg Paths:
Update `/lib/audioUtils.ts` if FFmpeg is in a custom location:
```typescript
// Update these paths
ffmpeg.setFfmpegPath('/your/custom/path/to/ffmpeg');
ffmpeg.setFfprobePath('/your/custom/path/to/ffprobe');
```

---

### Issue 2: File Upload Fails

**Symptoms:**
- "No source file provided" error
- Files don't reach the server
- FormData appears empty

**Solutions:**

#### Check File Size:
```javascript
// In next.config.js, increase body size limit
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '200mb', // Increase as needed
    },
  },
}
```

#### Verify Supported Formats:
Supported: MP3, WAV, FLAC, AIFF, M4A, AAC, OGG, MP4, WMA

#### Debug File Upload:
```javascript
// Add to your upload handler
console.log('File size:', file.size);
console.log('File type:', file.type);
console.log('File name:', file.name);
```

---

### Issue 3: Processing Fails with Audio Error

**Symptoms:**
- "Failed to analyze audio file"
- "Mastering failed" errors
- Empty output files

**Solutions:**

#### Check Input File:
```bash
# Test file manually with FFmpeg
ffmpeg -i your-audio-file.mp3 -f null -

# Check file info
ffprobe your-audio-file.mp3
```

#### Verify Temp Directory:
```bash
# Ensure temp directory exists and is writable
mkdir -p temp
chmod 755 temp

# Check if files are being created
ls -la temp/
```

#### Check File Permissions:
```bash
# Make sure Node.js can read/write temp files
sudo chown -R $USER:$USER temp/
```

---

### Issue 4: "Module not found" Errors

**Symptoms:**
- Import errors for `fluent-ffmpeg`
- `music-metadata` not found
- Build failures

**Solutions:**

#### Reinstall Dependencies:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Check Node.js Version:
```bash
# Ensure Node.js 18+
node --version

# Update if needed
nvm install 18
nvm use 18
```

#### Update package.json:
Ensure all dependencies are present:
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.3",
    "music-metadata": "^10.5.0",
    "formidable": "^3.5.1",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/fluent-ffmpeg": "^2.1.27",
    "@types/uuid": "^10.0.0"
  }
}
```

---

### Issue 5: Memory Issues with Large Files

**Symptoms:**
- Server crashes with large files
- "Out of memory" errors
- Slow processing

**Solutions:**

#### Increase Node.js Memory:
```bash
# Start with more memory
node --max-old-space-size=4096 node_modules/.bin/next dev
```

#### Add to package.json:
```json
{
  "scripts": {
    "dev": "node --max-old-space-size=4096 node_modules/.bin/next dev",
    "build": "node --max-old-space-size=4096 node_modules/.bin/next build"
  }
}
```

#### Implement File Size Limits:
```javascript
// In your API route
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

---

### Issue 6: Audio Quality Issues

**Symptoms:**
- Poor output quality
- Distorted audio
- Quiet/loud output

**Solutions:**

#### Adjust Mastering Presets:
```typescript
// In MASTERING_PRESETS, fine-tune settings
'Hip Hop': {
  compression: { 
    threshold: -12,  // Less aggressive
    ratio: 3,        // Lower ratio
    // ...
  },
  limiting: { 
    threshold: -1.5, // Less limiting
    // ...
  }
}
```

#### Check Input Quality:
- Use high-quality source files (≥44.1kHz, 16-bit)
- Avoid already-compressed files when possible
- Test with uncompressed WAV/FLAC files

---

### Issue 7: Deployment Issues

**Symptoms:**
- Works locally but fails in production
- Vercel/Netlify deployment errors
- FFmpeg not found in production

**Solutions:**

#### For Vercel:
FFmpeg is not available by default. Options:
1. Use a custom Docker container
2. Use serverless function with FFmpeg layer
3. Use external audio processing service

#### For Docker Deployment:
```dockerfile
FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Your app setup...
```

#### For VPS/Server:
```bash
# Install FFmpeg on server
sudo apt install ffmpeg

# Ensure paths are correct in production
which ffmpeg
```

---

## 🔍 Debug Techniques

### Enable Verbose Logging:
```javascript
// In lib/audioUtils.ts
console.log('🔧 FFmpeg command:', commandLine);
console.log('📊 Analysis result:', analysis);
console.log('🎛️ Applied filters:', filters);
```

### Test Individual Components:

#### Test FFmpeg Directly:
```bash
# Simple test
ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 -t 1 output.mp4

# Audio test
ffmpeg -f lavfi -i sine=frequency=1000:duration=1 test.mp3
```

#### Test API Endpoints:
```bash
# Health check
curl http://localhost:3000/api/generate-master

# Upload test (with file)
curl -X POST \
  -F "source=@test-audio.mp3" \
  -F "preset=Hip Hop" \
  -F "paymentConfirmed=true" \
  http://localhost:3000/api/generate-master
```

### Monitor Server Logs:
```bash
# Watch server logs while testing
npm run dev | grep -E "(🎵|❌|✅)"
```

---

## 📞 Getting Help

### Check These First:
1. ✅ Node.js 18+ installed
2. ✅ FFmpeg installed and in PATH
3. ✅ All dependencies installed (`npm install`)
4. ✅ Temp directory exists and is writable
5. ✅ Audio file is in supported format
6. ✅ File size under limit (100MB default)

### Debug Information to Collect:
```bash
# System info
node --version
npm --version
ffmpeg -version
ls -la temp/

# Error logs from browser console
# Error logs from terminal/server
```

### Test with Sample File:
Download a small MP3 file to test:
```bash
# Create a test tone
ffmpeg -f lavfi -i sine=frequency=440:duration=10 -c:a libmp3lame test-audio.mp3
```

### Environment Variables:
```bash
# Check your .env.local file
cat .env.local

# Verify paths
echo $FFMPEG_PATH
echo $FFPROBE_PATH
```

---

## 🔄 Reset Instructions

If all else fails, try a complete reset:

```bash
# 1. Stop the development server
# Ctrl+C

# 2. Clean everything
rm -rf node_modules package-lock.json .next temp/*
npm cache clean --force

# 3. Reinstall dependencies
npm install

# 4. Verify FFmpeg
which ffmpeg
ffmpeg -version

# 5. Recreate temp directory
mkdir -p temp
chmod 755 temp

# 6. Restart development server
npm run dev

# 7. Test with debug page
# Visit http://localhost:3000/debug
```

---

## 🎯 Performance Tips

### Optimize for Development:
```javascript
// In next.config.js
module.exports = {
  experimental: {
    esmExternals: false, // Faster builds
  },
  typescript: {
    ignoreBuildErrors: true, // Skip type checking for speed
  },
}
```

### Reduce File Sizes:
- Convert large files to MP3 before processing
- Use 44.1kHz sample rate for compatibility
- Limit duration for testing (under 5 minutes)

### Monitor Resources:
```bash
# Watch memory usage
htop

# Monitor file system
df -h
du -sh temp/
```

---

**Still having issues?** Create an issue with:
- Your operating system
- Node.js and npm versions
- FFmpeg version
- Complete error messages
- Steps to reproduce

The debug page at `/debug` provides most of this information automatically!