// scripts/check-ffmpeg.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

console.log('🔧 Checking FFmpeg installation...\n');

async function checkFFmpegInstallation() {
  const checks = {
    ffmpeg: false,
    ffprobe: false,
    version: null,
    path: null,
    probePath: null
  };

  try {
    // Check if FFmpeg is available
    console.log('📍 Checking FFmpeg...');
    try {
      const { stdout: ffmpegVersion } = await execAsync('ffmpeg -version');
      const versionMatch = ffmpegVersion.match(/ffmpeg version ([^\s]+)/);
      if (versionMatch) {
        checks.version = versionMatch[1];
        checks.ffmpeg = true;
        console.log(`   ✅ FFmpeg found: ${checks.version}`);
      }
    } catch (error) {
      console.log('   ❌ FFmpeg not found in PATH');
    }

    // Check FFmpeg path
    try {
      const { stdout: ffmpegPath } = await execAsync(process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg');
      checks.path = ffmpegPath.trim();
      console.log(`   📂 FFmpeg location: ${checks.path}`);
    } catch (error) {
      console.log('   ⚠️  Could not determine FFmpeg path');
    }

    // Check if FFprobe is available
    console.log('\n📍 Checking FFprobe...');
    try {
      const { stdout: ffprobeVersion } = await execAsync('ffprobe -version');
      if (ffprobeVersion.includes('ffprobe version')) {
        checks.ffprobe = true;
        console.log('   ✅ FFprobe found');
      }
    } catch (error) {
      console.log('   ❌ FFprobe not found in PATH');
    }

    // Check FFprobe path
    try {
      const { stdout: ffprobePath } = await execAsync(process.platform === 'win32' ? 'where ffprobe' : 'which ffprobe');
      checks.probePath = ffprobePath.trim();
      console.log(`   📂 FFprobe location: ${checks.probePath}`);
    } catch (error) {
      console.log('   ⚠️  Could not determine FFprobe path');
    }

    return checks;
  } catch (error) {
    console.error('Error during FFmpeg check:', error);
    return checks;
  }
}

async function createTempDirectory() {
  const tempDir = path.join(process.cwd(), 'temp');
  try {
    await fs.access(tempDir);
    console.log('📁 Temp directory already exists');
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
    console.log('📁 Created temp directory');
  }
}

async function testFFmpegFunctionality(checks) {
  if (!checks.ffmpeg || !checks.ffprobe) {
    console.log('\n⚠️  Skipping functionality test - FFmpeg not fully available');
    return false;
  }

  console.log('\n🧪 Testing FFmpeg functionality...');
  
  try {
    // Test basic FFmpeg command
    const testCommand = process.platform === 'win32' 
      ? 'ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.1" -f null NUL'
      : 'ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.1" -f null /dev/null';
    
    await execAsync(testCommand);
    console.log('   ✅ Basic FFmpeg test passed');
    
    // Test audio filters
    const filterCommand = process.platform === 'win32'
      ? 'ffmpeg -f lavfi -i "sine=frequency=440:duration=0.1" -af "volume=0.5" -f null NUL'
      : 'ffmpeg -f lavfi -i "sine=frequency=440:duration=0.1" -af "volume=0.5" -f null /dev/null';
    
    await execAsync(filterCommand);
    console.log('   ✅ Audio filter test passed');
    
    return true;
  } catch (error) {
    console.log('   ❌ FFmpeg functionality test failed:', error.message);
    return false;
  }
}

function printInstallationInstructions() {
  console.log('\n📋 FFmpeg Installation Instructions:\n');
  
  const platform = process.platform;
  
  switch (platform) {
    case 'darwin': // macOS
      console.log('🍎 macOS Installation:');
      console.log('   Using Homebrew (recommended):');
      console.log('   brew install ffmpeg');
      console.log('');
      console.log('   Using MacPorts:');
      console.log('   sudo port install ffmpeg');
      break;
      
    case 'linux':
      console.log('🐧 Linux Installation:');
      console.log('   Ubuntu/Debian:');
      console.log('   sudo apt update && sudo apt install ffmpeg');
      console.log('');
      console.log('   CentOS/RHEL/Fedora:');
      console.log('   sudo dnf install ffmpeg');
      console.log('   # or for older versions:');
      console.log('   sudo yum install ffmpeg');
      console.log('');
      console.log('   Arch Linux:');
      console.log('   sudo pacman -S ffmpeg');
      break;
      
    case 'win32': // Windows
      console.log('🪟 Windows Installation:');
      console.log('   Option 1 - Download pre-compiled binaries:');
      console.log('   1. Visit https://ffmpeg.org/download.html#build-windows');
      console.log('   2. Download the latest release');
      console.log('   3. Extract to C:\\ffmpeg\\');
      console.log('   4. Add C:\\ffmpeg\\bin to your PATH environment variable');
      console.log('');
      console.log('   Option 2 - Using Chocolatey:');
      console.log('   choco install ffmpeg');
      console.log('');
      console.log('   Option 3 - Using Scoop:');
      console.log('   scoop install ffmpeg');
      break;
      
    default:
      console.log('❓ Unknown platform. Please visit https://ffmpeg.org/download.html');
  }
  
  console.log('\n🔄 After installation:');
  console.log('   1. Restart your terminal/command prompt');
  console.log('   2. Run: npm run check-ffmpeg');
  console.log('   3. Start your development server: npm run dev');
}

function printStatus(checks, functionalityTest) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 FFMPEG INSTALLATION STATUS');
  console.log('='.repeat(50));
  
  console.log(`FFmpeg Executable: ${checks.ffmpeg ? '✅ Found' : '❌ Missing'}`);
  console.log(`FFprobe Executable: ${checks.ffprobe ? '✅ Found' : '❌ Missing'}`);
  
  if (checks.version) {
    console.log(`Version: ${checks.version}`);
  }
  
  if (checks.path) {
    console.log(`FFmpeg Path: ${checks.path}`);
  }
  
  if (checks.probePath) {
    console.log(`FFprobe Path: ${checks.probePath}`);
  }
  
  console.log(`Functionality Test: ${functionalityTest ? '✅ Passed' : '❌ Failed'}`);
  
  console.log('\n' + '='.repeat(50));
  
  if (checks.ffmpeg && checks.ffprobe && functionalityTest) {
    console.log('🎉 SUCCESS: FFmpeg is properly installed and working!');
    console.log('   Your audio mastering app is ready to process real audio files.');
    console.log('   You can now run: npm run dev');
  } else {
    console.log('⚠️  WARNING: FFmpeg is not properly installed.');
    console.log('   Your app will work in demo mode only.');
    console.log('   Install FFmpeg for real audio processing capabilities.');
  }
}

async function writeConfigFile(checks, functionalityTest) {
  const config = {
    ffmpegAvailable: checks.ffmpeg && checks.ffprobe && functionalityTest,
    version: checks.version,
    ffmpegPath: checks.path,
    ffprobePath: checks.probePath,
    lastChecked: new Date().toISOString(),
    platform: process.platform
  };
  
  const configPath = path.join(process.cwd(), '.ffmpeg-config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  console.log('\n📄 Configuration saved to .ffmpeg-config.json');
}

// Main execution
async function main() {
  try {
    // Create temp directory
    await createTempDirectory();
    
    // Check FFmpeg installation
    const checks = await checkFFmpegInstallation();
    
    // Test functionality if available
    const functionalityTest = await testFFmpegFunctionality(checks);
    
    // Print status
    printStatus(checks, functionalityTest);
    
    // Save configuration
    await writeConfigFile(checks, functionalityTest);
    
    // Print installation instructions if needed
    if (!checks.ffmpeg || !checks.ffprobe || !functionalityTest) {
      printInstallationInstructions();
    }
    
    // Exit with appropriate code
    process.exit((checks.ffmpeg && checks.ffprobe && functionalityTest) ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Error during FFmpeg check:', error);
    process.exit(1);
  }
}

main();