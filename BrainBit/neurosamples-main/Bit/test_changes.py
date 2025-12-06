#!/usr/bin/env python3
"""
Test script for verifying the fixes to the calibration issues.
"""

import sys
import os

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all modules can be imported without errors."""
    try:
        from bipolar_calibration_screen import BipolarCalibrationScreen
        print("✓ BipolarCalibrationScreen imported successfully")
    except Exception as e:
        print(f"✗ Failed to import BipolarCalibrationScreen: {e}")
        return False
    
    try:
        from monopolar_calibration_screen import MonopolarCalibrationScreen
        print("✓ MonopolarCalibrationScreen imported successfully")
    except Exception as e:
        print(f"✗ Failed to import MonopolarCalibrationScreen: {e}")
        return False
    
    try:
        from main import ThreadSafeGUIUpdater
        print("✓ ThreadSafeGUIUpdater imported successfully")
    except Exception as e:
        print(f"✗ Failed to import ThreadSafeGUIUpdater: {e}")
        return False
    
    return True

def test_ui_files():
    """Test that all required UI files exist."""
    required_files = [
        "newui/BipolarCalibrationScreen.ui",
        "newui/MonopolarCalibrationScreen.ui",
        "newui/MainApplicationWindow.ui"
    ]
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✓ {file_path} exists")
        else:
            print(f"✗ {file_path} not found")
            return False
    
    return True

def main():
    """Run all tests."""
    print("Testing calibration fixes...")
    print("=" * 40)
    
    success = True
    success &= test_ui_files()
    success &= test_imports()
    
    print("=" * 40)
    if success:
        print("All tests passed! ✓")
        return 0
    else:
        print("Some tests failed! ✗")
        return 1

if __name__ == "__main__":
    sys.exit(main())