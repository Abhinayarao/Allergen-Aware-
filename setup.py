#!/usr/bin/env python3
"""
Setup script for the Allergen-Aware Recipe Advisor FastAPI backend.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required.")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version}")
    return True

def check_dependencies():
    """Check if required dependencies are available."""
    required_commands = ['pip', 'python']
    missing_commands = []
    
    for cmd in required_commands:
        if not shutil.which(cmd):
            missing_commands.append(cmd)
    
    if missing_commands:
        print(f"❌ Missing required commands: {', '.join(missing_commands)}")
        return False
    
    print("✅ Required commands available")
    return True

def install_dependencies():
    """Install Python dependencies."""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True, text=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        print(f"Error output: {e.stderr}")
        return False

def create_env_file():
    """Create .env file from template if it doesn't exist."""
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if env_file.exists():
        print("✅ .env file already exists")
        return True
    
    if env_example.exists():
        print("📝 Creating .env file from template...")
        shutil.copy(env_example, env_file)
        print("✅ .env file created from template")
        print("⚠️  Please update .env file with your actual API keys")
        return True
    else:
        print("❌ env.example file not found")
        return False

def check_env_variables():
    """Check if environment variables are set."""
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_KEY",
        "FATSECRET_KEY", 
        "FATSECRET_SECRET",
        "GEMINI_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var) or os.getenv(var) == f"your-{var.lower().replace('_', '-')}":
            missing_vars.append(var)
    
    if missing_vars:
        print("⚠️  Missing or placeholder environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease update your .env file with actual values.")
        return False
    
    print("✅ Environment variables configured")
    return True

def create_directories():
    """Create necessary directories."""
    directories = ["logs", "uploads", "temp"]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"✅ Created directory: {directory}")

def run_tests():
    """Run basic tests to verify setup."""
    print("🧪 Running basic tests...")
    try:
        # Test imports
        import app.main
        import app.auth
        import app.services.fatsecret
        import app.services.gemini
        print("✅ All modules import successfully")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def main():
    """Main setup function."""
    print("🚀 Setting up Allergen-Aware Recipe Advisor API...")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Create .env file
    if not create_env_file():
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Check environment variables
    env_configured = check_env_variables()
    
    # Run tests
    if not run_tests():
        sys.exit(1)
    
    print("=" * 50)
    if env_configured:
        print("🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Update your .env file with actual API keys")
        print("2. Configure Firebase Firestore and service account credentials")
        print("3. Start the server with: python run.py")
    else:
        print("⚠️  Setup completed with warnings!")
        print("\nPlease update your .env file with actual API keys before running the server.")
    
    print("\n📚 Documentation:")
    print("- API Docs: http://localhost:8000/docs")
    print("- ReDoc: http://localhost:8000/redoc")
    print("- Health Check: http://localhost:8000/health")

if __name__ == "__main__":
    main()
