#!/usr/bin/env python3
"""
Update Pydantic Validators

This script focuses on:
1. Updating @validator to @field_validator
2. Updating model_validation imports
"""

import os
import re

# App code files that might have validators
TARGET_DIRECTORIES = [
    "app/models",
    "app/schemas"
]

def fix_validator_in_file(file_path):
    """Fix validator decorators in a file"""
    if not os.path.exists(file_path):
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes = []
    
    # Replace @validator with @field_validator
    if '@validator' in content:
        content = content.replace('@validator', '@field_validator')
        changes.append("- Replaced @validator with @field_validator")
        
        # Update imports
        if 'from pydantic import validator' in content:
            content = content.replace(
                'from pydantic import validator',
                'from pydantic import field_validator'
            )
            changes.append("- Updated import: validator → field_validator")
        elif 'from pydantic import ' in content and ', validator' in content:
            content = content.replace(', validator', ', field_validator')
            changes.append("- Updated import: validator → field_validator")
    
    # Write back the modified content if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}:")
        for change in changes:
            print(f"  {change}")
        return True
    
    return False

def find_python_files(directories):
    """Find all Python files in given directories (recursive)"""
    python_files = []
    for directory in directories:
        if not os.path.exists(directory):
            print(f"Directory not found: {directory}")
            continue
            
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    python_files.append(os.path.join(root, file))
    return python_files

def main():
    print("Updating Pydantic validators in application code...")
    
    # Find Python files
    python_files = find_python_files(TARGET_DIRECTORIES)
    print(f"Found {len(python_files)} Python files to check")
    
    # Process files
    modified_files = 0
    for file_path in python_files:
        if fix_validator_in_file(file_path):
            modified_files += 1
    
    print(f"\nCompleted! Modified {modified_files} files to update Pydantic validators")

if __name__ == "__main__":
    main()