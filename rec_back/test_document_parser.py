#!/usr/bin/env python3
"""
Test script for document parser functionality
Run this script to test PDF and DOCX parsing capabilities
"""

import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.services.document_parser import DocumentParser

def test_document_parser():
    """Test the document parser with sample files"""
    print("🔍 Testing Document Parser...")
    
    # Test file validation
    print("\n1. Testing file type validation:")
    
    # Test supported types
    assert DocumentParser.validate_file_type("application/pdf", "test.pdf") == True
    assert DocumentParser.validate_file_type("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "test.docx") == True
    assert DocumentParser.validate_file_type("text/plain", "test.txt") == True
    print("✅ Supported file types validation passed")
    
    # Test unsupported types
    assert DocumentParser.validate_file_type("image/jpeg", "test.jpg") == False
    assert DocumentParser.validate_file_type("application/zip", "test.zip") == False
    print("✅ Unsupported file types validation passed")
    
    # Test file info extraction
    print("\n2. Testing file info extraction:")
    sample_content = b"This is a test file content"
    file_info = DocumentParser.get_file_info(sample_content, "text/plain", "test.txt")
    
    expected_keys = ["filename", "content_type", "size_bytes", "size_kb", "size_mb", "is_supported", "file_extension"]
    for key in expected_keys:
        assert key in file_info, f"Missing key: {key}"
    
    assert file_info["size_bytes"] == len(sample_content)
    assert file_info["is_supported"] == True
    assert file_info["file_extension"] == ".txt"
    print("✅ File info extraction passed")
    
    # Test text extraction from plain text
    print("\n3. Testing text extraction:")
    text_content = b"This is a sample CV content with skills and experience."
    extracted_text = DocumentParser.extract_text_from_file(text_content, "text/plain", "test.txt")
    assert extracted_text == "This is a sample CV content with skills and experience."
    print("✅ Text extraction from plain text passed")
    
    print("\n🎉 All basic tests passed!")
    print("\n📝 To test with actual PDF/DOCX files:")
    print("   1. Place sample PDF/DOCX files in the current directory")
    print("   2. Run the interactive test below")

def interactive_test():
    """Interactive test with user-provided files"""
    print("\n🔧 Interactive File Test")
    print("=" * 40)
    
    # Look for sample files in current directory
    current_dir = Path.cwd()
    sample_files = []
    
    for extension in ['.pdf', '.docx', '.txt']:
        files = list(current_dir.glob(f"*{extension}"))
        sample_files.extend(files)
    
    if not sample_files:
        print("No sample files found in current directory.")
        print("Please add some PDF, DOCX, or TXT files to test.")
        return
    
    print(f"Found {len(sample_files)} sample files:")
    for i, file_path in enumerate(sample_files, 1):
        print(f"  {i}. {file_path.name} ({file_path.stat().st_size} bytes)")
    
    try:
        choice = input(f"\nEnter file number to test (1-{len(sample_files)}) or 'q' to quit: ")
        if choice.lower() == 'q':
            return
        
        file_index = int(choice) - 1
        if file_index < 0 or file_index >= len(sample_files):
            print("Invalid choice.")
            return
        
        selected_file = sample_files[file_index]
        print(f"\n📄 Testing file: {selected_file.name}")
        
        # Read file content
        with open(selected_file, 'rb') as f:
            file_content = f.read()
        
        # Determine content type
        if selected_file.suffix.lower() == '.pdf':
            content_type = 'application/pdf'
        elif selected_file.suffix.lower() == '.docx':
            content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else:
            content_type = 'text/plain'
        
        # Test extraction
        try:
            extracted_text = DocumentParser.extract_text_from_file(
                file_content, content_type, selected_file.name
            )
            
            print(f"\n✅ Successfully extracted {len(extracted_text)} characters")
            print("\n📝 First 500 characters:")
            print("-" * 50)
            print(extracted_text[:500])
            if len(extracted_text) > 500:
                print("...")
            print("-" * 50)
            
            # Test file info
            file_info = DocumentParser.get_file_info(file_content, content_type, selected_file.name)
            print(f"\n📊 File Information:")
            for key, value in file_info.items():
                print(f"   {key}: {value}")
                
        except Exception as e:
            print(f"❌ Error extracting text: {e}")
            
    except ValueError:
        print("Invalid input. Please enter a number.")
    except KeyboardInterrupt:
        print("\nTest cancelled.")

if __name__ == "__main__":
    print("📋 Document Parser Test Suite")
    print("=" * 40)
    
    try:
        # Run basic tests
        test_document_parser()
        
        # Ask for interactive test
        if input("\nRun interactive test with sample files? (y/n): ").lower() == 'y':
            interactive_test()
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("\nPlease ensure you have installed the required dependencies:")
        print("   pip install PyPDF2 python-docx pdfplumber")
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()