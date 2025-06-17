#!/usr/bin/env python3
"""
Targeted Pydantic v1 to v2 Migration Script

This script only targets your application code and skips any files in the virtual environment.

Usage:
    python targeted_pydantic_migration.py
"""

import os
import re
import sys

# Your application code directory
APP_DIR = "app"

def fix_pydantic_file(file_path):
    """Fix a single Python file for Pydantic v2 compatibility"""
    # Skip any files in the virtual environment
    if "venv" in file_path or "site-packages" in file_path:
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes = []
    
    # Replace regex with pattern in all Field definitions
    pattern = r'Field\((.*?)regex=(.*?)(?:,|\))'
    matches = re.finditer(pattern, content, re.DOTALL)
    
    for match in matches:
        old_text = match.group(0)
        new_text = old_text.replace('regex=', 'pattern=')
        content = content.replace(old_text, new_text)
        changes.append(f"- Replaced 'regex=' with 'pattern=' in: {old_text[:50]}...")
    
    # Replace regex patterns in other Field arguments
    pattern2 = r'([^a-zA-Z0-9_])regex=([^,\)]+)'
    matches = re.finditer(pattern2, content)
    
    for match in matches:
        old_text = match.group(0)
        new_text = match.group(1) + 'pattern=' + match.group(2)
        content = content.replace(old_text, new_text)
        changes.append(f"- Replaced 'regex=' with 'pattern=' in: {old_text}")
    
    # Replace orm_mode with from_attributes
    pattern3 = r'class Config:\s*[^\}]*orm_mode\s*=\s*True'
    matches = re.finditer(pattern3, content, re.DOTALL)
    
    for match in matches:
        old_text = match.group(0)
        new_text = old_text.replace('orm_mode = True', 'from_attributes = True')
        content = content.replace(old_text, new_text)
        changes.append(f"- Replaced 'orm_mode = True' with 'from_attributes = True'")
    
    # Write back the modified content if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}:")
        for change in changes:
            print(f"  {change}")
        return True
    
    return False

def find_python_files(directory):
    """Find all Python files in a directory (recursive)"""
    python_files = []
    for root, _, files in os.walk(directory):
        # Skip virtual environment directories
        if "venv" in root or "site-packages" in root:
            continue
        
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def main():
    # Find Python files in the app directory
    print(f"Scanning {APP_DIR} for Python files...")
    python_files = find_python_files(APP_DIR)
    print(f"Found {len(python_files)} Python files")
    
    # Process files
    modified_files = 0
    for file_path in python_files:
        if fix_pydantic_file(file_path):
            modified_files += 1
    
    print(f"\nModified {modified_files} files for Pydantic v2 compatibility")

if __name__ == "__main__":
    main()