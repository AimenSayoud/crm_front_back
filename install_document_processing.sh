#!/bin/bash

# Installation script for PDF/DOCX support in RecrutementPlus CRM
# This script installs required Python dependencies and runs tests

echo "🚀 Installing PDF/DOCX Support for RecrutementPlus CRM"
echo "================================================="

# Check if we're in the right directory
if [[ ! -f "rec_back/requirements.txt" ]]; then
    echo "❌ Error: Please run this script from the RecrutementPlus_CRM_FullStack root directory"
    exit 1
fi

echo "📍 Current directory: $(pwd)"

# Navigate to backend directory
cd rec_back

echo "📦 Installing Python dependencies..."

# Check if virtual environment exists
if [[ -d "venv" ]]; then
    echo "🔍 Found existing virtual environment"
    source venv/bin/activate
else
    echo "⚠️  No virtual environment found. Please create one first:"
    echo "   python -m venv venv"
    echo "   source venv/bin/activate"
    exit 1
fi

# Install new dependencies
echo "⬇️  Installing document processing libraries..."
pip install PyPDF2==3.0.1
pip install python-docx==0.8.11  
pip install pdfplumber==0.9.0

# Install all requirements to ensure compatibility
echo "📋 Installing all requirements..."
pip install -r requirements.txt

echo ""
echo "✅ Dependencies installed successfully!"

# Run tests if requested
read -p "🧪 Run document parser tests? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔍 Running document parser tests..."
    python test_document_parser.py
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start your backend server: uvicorn app.main:app --reload"
echo "   2. Test the new /analyze-cv-file endpoint"
echo "   3. Update your frontend and test file upload functionality"
echo ""
echo "📁 Sample files for testing:"
echo "   • Place PDF, DOCX, or TXT CV files in this directory"
echo "   • Use the test script to verify text extraction"
echo ""
echo "🔗 New API endpoint: POST /api/v1/ai-tools/analyze-cv-file"
echo "   - Accepts: multipart/form-data with 'file' field"
echo "   - Supports: PDF, DOCX, TXT files (max 10MB)"
echo "   - Returns: CV analysis + job matches + file info"