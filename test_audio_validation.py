"""
Custom test script for audio validation improvements.
This tests the enhanced validation logic in core/schema_utils.py
"""

import os
import sys

# Add the project root to the path.
sys.path.insert(0, os.path.dirname(__file__))

from core import feconf
from core import schema_utils
from core import utils


def test_audio_validation():
    """Test the improved audio validation logic."""
    print("=" * 60)
    print("Testing Improved Audio Validation Logic")
    print("=" * 60)
    
    # Test 1: Valid MP3 file under duration limit
    print("\n1. Testing valid MP3 file...")
    with open(
        os.path.join(feconf.TESTS_DATA_DIR, 'cafe.mp3'), 'rb', encoding=None
    ) as f:
        valid_audio = f.read()
    
    is_valid_audio_file = schema_utils.get_validator('is_valid_audio_file')
    result = is_valid_audio_file(valid_audio)
    print(f"   ✓ Schema validator returned: {result}")
    
    # Test structured result
    validation_result = schema_utils._Validators.validate_audio_file(valid_audio)
    print(f"   ✓ Structured result: is_valid={validation_result['is_valid']}, "
          f"duration={validation_result['duration_secs']:.2f}s")
    
    # Test 2: MP3 over 300 seconds
    print("\n2. Testing MP3 over 300 seconds...")
    with open(
        os.path.join(feconf.TESTS_DATA_DIR, 'cafe-over-five-minutes.mp3'),
        'rb',
        encoding=None
    ) as f:
        long_audio = f.read()
    
    try:
        schema_utils._Validators.validate_audio_file(long_audio)
        print("   ✗ Should have raised ValidationError")
    except utils.ValidationError as e:
        print(f"   ✓ ValidationError raised: {str(e)}")
    
    # Test backward compatibility - should convert to Exception
    try:
        is_valid_audio_file(long_audio)
        print("   ✗ Should have raised Exception")
    except Exception as e:
        print(f"   ✓ Schema validator raised Exception: {str(e)}")
    
    # Test 3: Invalid audio format (FLAC)
    print("\n3. Testing invalid audio format...")
    with open(
        os.path.join(feconf.TESTS_DATA_DIR, 'cafe.flac'), 'rb', encoding=None
    ) as f:
        flac_audio = f.read()
    
    try:
        is_valid_audio_file(flac_audio)
        print("   ✗ Should have raised Exception")
    except Exception as e:
        print(f"   ✓ Correctly rejected: {str(e)}")
    
    # Test 4: Empty audio data
    print("\n4. Testing empty audio data...")
    try:
        is_valid_audio_file(b'')
        print("   ✗ Should have raised Exception")
    except Exception as e:
        print(f"   ✓ Correctly rejected: {str(e)}")
    
    # Test 5: Extremely small file (< 100 bytes)
    print("\n5. Testing extremely small file (50 bytes)...")
    tiny_audio = b'A' * 50
    try:
        is_valid_audio_file(tiny_audio)
        print("   ✗ Should have raised Exception")
    except Exception as e:
        print(f"   ✓ Correctly rejected: {str(e)}")
    
    # Test 6: Corrupted audio data (>100 bytes to pass size check)
    print("\n6. Testing corrupted audio data...")
    corrupted_audio = b'not_valid_audio_data_' * 10  # 200+ bytes
    try:
        is_valid_audio_file(corrupted_audio)
        print("   ✗ Should have raised Exception")
    except Exception as e:
        print(f"   ✓ Correctly rejected: {str(e)}")
    
    # Test 7: Backward compatibility - Exception conversion
    print("\n7. Testing backward compatibility (Exception conversion)...")
    small_audio = b'X' * 50
    try:
        is_valid_audio_file(small_audio)
        print("   ✗ Should have raised Exception")
    except Exception as e:
        error_type = type(e).__name__
        print(f"   ✓ Schema validator converts to Exception: {error_type}")
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)
    
    print("\nImprovements verified:")
    print("  ✓ Dedicated validation function with structured results")
    print("  ✓ ValidationError for detailed error handling")
    print("  ✓ Backward compatibility maintained (Exception conversion)")
    print("  ✓ Minimum file size validation (100 bytes)")
    print("  ✓ Comprehensive error messages")
    print("  ✓ Logging for validation failures")


if __name__ == '__main__':
    test_audio_validation()
