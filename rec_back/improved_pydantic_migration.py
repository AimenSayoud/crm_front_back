#!/usr/bin/env python3
"""
Improved Pydantic v1 to v2 Migration Script

This script performs a more thorough search for regex patterns and other
Pydantic v1 to v2 migration issues.

Usage:
    python improved_pydantic_migration.py [directory]

If no directory is provided, it will scan the current directory.
"""

import os
import re
import sys
from pathlib import Path

def fix_pydantic_file(file_path):
    """Fix a single Python file for Pydantic v2 compatibility"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes = []
    
    # Pattern 1: Field(..., pattern=
    pattern1 = r'Field\((.*?)pattern=(.*?)(?:,|\))'
    matches = re.finditer(pattern1, content, re.DOTALL)
    
    for match in matches:
        old_text = match.group(0)
        new_text = old_text.replace('pattern=', 'pattern=')
        content = content.replace(old_text, new_text)
        changes.append(f"- Replaced 'pattern=' with 'pattern=' in: {old_text[:50]}...")
    
    # Pattern 2: regex pattern inside field arguments
    pattern2 = r'([^a-zA-Z0-9_])pattern=([^,\)]+)'
    matches = re.finditer(pattern2, content)
    
    for match in matches:
        old_text = match.group(0)
        new_text = match.group(1) + 'pattern=' + match.group(2)
        content = content.replace(old_text, new_text)
        changes.append(f"- Replaced 'pattern=' with 'pattern=' in: {old_text}")
    
    # Replace orm_mode with from_attributes
    pattern3 = r'class Config:\s*[^\}]*orm_mode\s*=\s*True'
    matches = re.finditer(pattern3, content, re.DOTALL)
    
    for match in matches:
        old_text = match.group(0)
        new_text = old_text.replace('orm_mode = True', 'from_attributes = True')
        content = content.replace(old_text, new_text)
        changes.append(f"- Replaced 'orm_mode = True' with 'from_attributes = True'")

    # Replace dict() with model_dump()
    if '.dict(' in content:
        changes.append(f"- Found potential .dict() calls that may need to be changed to .model_dump()")
    
    # Replace json() with model_dump_json()
    if '.json(' in content:
        changes.append(f"- Found potential .json() calls that may need to be changed to .model_dump_json()")
    
    # Look for validator decorators
    if '@validator' in content:
        changes.append(f"- Found @validator decorators that should be changed to @field_validator")
    
    # Write back the modified content if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}:")
        for change in changes:
            print(f"  {change}")
        return True
    elif changes:
        # Report potential changes even if no actual changes were made
        print(f"Potential changes in {file_path}:")
        for change in changes:
            print(f"  {change}")
        return False
    
    return False

def scan_specific_file(file_path):
    """Scan a specific file for Pydantic issues"""
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} does not exist")
        return False
    
    return fix_pydantic_file(file_path)

def find_python_files(directory):
    """Find all Python files in a directory (recursive)"""
    python_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def main():
    # Get directory or specific file to scan
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = '.'
    
    # Check if it's a directory or a file
    if os.path.isdir(path):
        # Find Python files
        print(f"Scanning {path} for Python files...")
        python_files = find_python_files(path)
        print(f"Found {len(python_files)} Python files")
        
        # Process files
        modified_files = 0
        for file_path in python_files:
            if fix_pydantic_file(file_path):
                modified_files += 1
        
        print(f"\nModified {modified_files} files for Pydantic v2 compatibility")
    elif os.path.isfile(path):
        # Process single file
        print(f"Scanning single file: {path}")
        if scan_specific_file(path):
            print("File was modified")
        else:
            print("No changes made to file")
    else:
        print(f"Error: {path} is not a valid file or directory")
        sys.exit(1)

if __name__ == "__main__":
    main()