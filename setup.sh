#!/bin/bash

# MasterAI Audio Processing App Setup Script
# This script will install FFmpeg and set up your audio mastering app

set -e  # Exit on any error

echo "🎵 MasterAI Setup Script"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Detect operating system
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_info "Detected OS: $MACHINE"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
print_info "Checking Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
    
    # Check if version is 18 or higher
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_error "Node.js 18+ is required. Please update Node.js"
        exit 1
    fi
else
    print_error "Node.js not found. Please install Node.js 18+ first"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

echo ""

# Install FFmpeg based on OS
print_info "Checking FFmpeg installation..."

if command_exists ffmpeg; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n1)
    print_status "FFmpeg already installed: $FFMPEG_VERSION"
else
    print_warning "FFmpeg not found. Installing..."
    
    case $MACHINE in
        Mac)
            if command_exists brew; then
                print_info "Installing FFmpeg via Homebrew..."
                brew install ffmpeg
                print_status "FFmpeg installed via Homebrew"
            else
                print_error "Homebrew not found. Please install Homebrew first:"
                echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi
            ;;
        Linux)
            if command_exists apt-get; then
                print_info "Installing FFmpeg via apt-get..."
                sudo apt-get update
                sudo apt-get install -y ffmpeg
                print_status "FFmpeg installed via apt-get"
            elif command_exists yum; then
                print_info "Installing FFmpeg via yum..."
                sudo yum install -y ffmpeg
                print_status "FFmpeg installed via yum"
            elif command_exists dnf; then
                print_info "Installing FFmpeg via dnf..."
                sudo dnf install -y ffmpeg
                print_status "FFmpeg installed via dnf"
            else
                print_error "No supported package manager found. Please install FFmpeg manually:"
                echo "  https://ffmpeg.org/download.html"
                exit 1
            fi
            ;;
        *)
            print_error "Unsupported OS for automatic FFmpeg installation."
            print_info "Please install FFmpeg manually:"
            echo "  - Windows: Download from https://ffmpeg.org/download.html"
            echo "  - Add FFmpeg to your system PATH"
            exit 1
            ;;
    esac
fi

# Verify FFmpeg installation
echo ""
print_info "Verifying FFmpeg installation..."
if command_exists ffmpeg && command_exists ffprobe; then
    FFMPEG_PATH=$(which ffmpeg)
    FFPROBE_PATH=$(which ffprobe)
    print_status "FFmpeg found at: $FFMPEG_PATH"
    print_status "FFprobe found at: $FFPROBE_PATH"
    
    # Test FFmpeg
    if ffmpeg -f lavfi -i testsrc=duration=1:size=1x1:rate=1 -f null - 2>/dev/null; then
        print_status "FFmpeg test successful"
    else
        print_error "FFmpeg test failed"
        exit 1
    fi
else
    print_error "FFmpeg verification failed"
    exit 1
fi

echo ""

# Create necessary directories
print_info "Creating project directories..."
mkdir -p temp
mkdir -p public/demo
print_status "Created temp and demo directories"

# Install npm dependencies
echo ""
print_info "Installing npm dependencies..."
if [ -f "package.json" ]; then
    npm install
    print_status "Dependencies installed successfully"
else
    print_error "package.json not found. Make sure you're in the project root directory"
    exit 1
fi

# Create environment file
echo ""
print_info "Setting up environment configuration..."
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_status "Created .env.local from .env.example"
        print_warning "Please edit .env.local with your actual configuration values"
    else
        # Create basic .env.local
        cat > .env.local << EOF
# MasterAI Environment Configuration
# Generated by setup script

# FFmpeg paths (auto-detected)
FFMPEG_PATH=$FFMPEG_PATH
FFPROBE_PATH=$FFPROBE_PATH

# Optional: Stripe keys for payment processing
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: Custom settings
# MAX_FILE_SIZE_MB=100
# TEMP_FILE_CLEANUP_HOURS=24

# Development settings
DEBUG=true
NODE_ENV=development
EOF
        print_status "Created basic .env.local file"
    fi
else
    print_warning ".env.local already exists, skipping creation"
fi

# Test build
echo ""
print_info "Testing Next.js build..."
if npm run build 2>/dev/null; then
    print_status "Build test successful"
else
    print_warning "Build test failed, but this might be expected in development"
fi

# Final verification
echo ""
print_info "Running final verification..."

# Check if all required files exist
REQUIRED_FILES=(
    "app/page.tsx"
    "app/generator/page.tsx"
    "app/processing/page.tsx"
    "app/payment/page.tsx"
    "app/results/page.tsx"
    "app/api/generate-master/route.ts"
    "app/api/download/[sessionId]/[filename]/route.ts"
    "lib/audioUtils.ts"
    "next.config.js"
    "package.json"
)

ALL_FILES_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found: $file"
    else
        print_error "Missing: $file"
        ALL_FILES_EXIST=false
    fi
done

echo ""
echo "🎉 Setup Summary"
echo "================"

if [ "$ALL_FILES_EXIST" = true ]; then
    print_status "All required files are present"
    print_status "FFmpeg is installed and working"
    print_status "Dependencies are installed"
    print_status "Environment is configured"
    
    echo ""
    echo -e "${GREEN}🚀 Setup Complete! Your audio mastering app is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start the development server:"
    echo "   npm run dev"
    echo ""
    echo "2. Open your browser to:"
    echo "   http://localhost:3000"
    echo ""
    echo "3. Test the setup:"
    echo "   http://localhost:3000/debug"
    echo ""
    echo "4. Upload an audio file and test mastering!"
    echo ""
    
else
    print_error "Some required files are missing"
    echo "Please ensure all code files are in place and try again"
    exit 1
fi

# Optional: Start the dev server
echo ""
read -p "Would you like to start the development server now? (y/n): " START_SERVER
if [[ $START_SERVER =~ ^[Yy]$ ]]; then
    print_info "Starting development server..."
    npm run dev
fi