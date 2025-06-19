// src/components/ai-assistant/CVAnalyzer/CVAnalyzer.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiUpload, FiX, FiLoader, FiCheckCircle, FiAlertCircle, FiCpu } from 'react-icons/fi';
import { useTheme } from '@/app/context/ThemeContext';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import CVResult from './CVResult';

// Import CV analysis service
import { openai } from '@/services';

interface CVAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (analysis: any, cvText: string) => void;
}

type AnalysisStep = 'input' | 'processing' | 'result' | 'error';

const CVAnalyzer: React.FC<CVAnalyzerProps> = ({ isOpen, onClose, onAnalysisComplete }) => {
  const { colors, theme } = useTheme();
  const [cvText, setCvText] = useState('');
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('input');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [jobMatches, setJobMatches] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Clear state when component opens
  React.useEffect(() => {
    if (isOpen) {
      setCvText('');
      setCurrentStep('input');
      setAnalysisResult(null);
      setJobMatches([]);
      setErrorMessage('');
      setProcessingProgress(0);
      setUploadedFile(null);
      setIsDragging(false);
      
      // Reset file input if it exists
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  // Simulate processing progress
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentStep === 'processing') {
      // Reset progress to 0 when starting
      setProcessingProgress(0);
      
      // Faster progress updates to make the animation more noticeable
      interval = setInterval(() => {
        setProcessingProgress(prev => {
          // Cap at 90% - the last 10% happens when we get the actual result
          // Make larger increments to create more visible movement
          const newProgress = prev + (3 * Math.random() + 1); // Between 1-4% per update
          return Math.min(newProgress, 90);
        });
      }, 200); // Faster updates (100ms instead of 200ms)
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep]);

  // Handle pasted text input
  const handleCvTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCvText(e.target.value);
  };

  // State to track file upload details
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFileUpload, setIsFileUpload] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle file upload from input change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  // Process the uploaded file
  const processFile = (file: File) => {
    setUploadedFile(file);
    setIsFileUpload(true);
    
    // Validate file type
    const supportedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const supportedExtensions = ['.txt', '.md', '.pdf', '.docx'];
    
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isSupported = supportedTypes.includes(file.type) || supportedExtensions.includes(`.${fileExtension}`);
    
    if (!isSupported) {
      alert('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      setUploadedFile(null);
      setCvText('');
      setIsFileUpload(false);
      return;
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
      setUploadedFile(null);
      setCvText('');
      setIsFileUpload(false);
      return;
    }
    
    // Only read as text for text-based files
    if (file.type === 'text/plain' || 
        file.name.endsWith('.txt') || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCvText(event.target.result as string);
          setIsFileUpload(false);
        }
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf' || 
               file.name.endsWith('.pdf') ||
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               file.name.endsWith('.docx')) {
      // For PDF and DOCX files, set placeholder text
      const fileType = file.type === 'application/pdf' || file.name.endsWith('.pdf') ? 'PDF' : 'DOCX';
      setCvText(`[File uploaded: ${file.name}]
This ${fileType} file will be processed by our backend.
Type: ${file.type}
Size: ${(file.size / 1024).toFixed(1)} KB

Click "Analyze CV" to process this file.`);
      setIsFileUpload(false);
    } else {
      // Unsupported file type
      setCvText('');
      setIsFileUpload(false);
      alert('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Start CV analysis process
  const handleAnalyze = async () => {
    if (!cvText.trim() && !uploadedFile) return;
    
    // Immediately set to processing step to show animation
    setCurrentStep('processing');
    
    // Clear any previous state
    setAnalysisResult(null);
    setJobMatches([]);
    setErrorMessage('');
    setFileInfo(null);
    
    try {
      console.log("Starting CV analysis process...");
      
      // Add a small artificial delay to ensure animation is visible
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let result;
      
      // Check if we have a file to upload (PDF, DOCX)
      if (uploadedFile && (
          uploadedFile.type === 'application/pdf' || 
          uploadedFile.name.endsWith('.pdf') ||
          uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          uploadedFile.name.endsWith('.docx')
        )) {
        console.log("Processing file upload:", uploadedFile.name);
        
        // Use file upload API with progress tracking
        result = await openai.resume.analyzeCvFile(uploadedFile, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProcessingProgress(Math.min(progress * 0.9, 90)); // Use 90% for upload, 10% for processing
        });
        
        // Store file info for display
        setFileInfo(result.file_info);
        
      } else {
        // Use text analysis for TXT files or pasted text
        console.log("Processing text with length:", cvText.length);
        result = await openai.resume.analyzeCvWithJobMatch(cvText);
      }
      
      console.log("API response received:", result);
      
      // Ensure we complete the progress bar
      setProcessingProgress(100);
      
      // Wait a moment at 100% for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Set results
      setAnalysisResult(result.cv_analysis);
      setJobMatches(result.job_matches || []);
      
      // Move to results step
      setCurrentStep('result');
      
    } catch (error: any) {
      console.error('Error analyzing CV:', error);
      
      // Handle specific error types
      let errorMsg = 'Failed to analyze CV. Please try again.';
      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail || error.response.data?.message;
        
        if (status === 413) {
          errorMsg = 'File is too large. Please upload a file smaller than 10MB.';
        } else if (status === 400 && detail) {
          errorMsg = detail;
        } else if (detail) {
          errorMsg = detail;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setCurrentStep('error');
    }
  };

  // Reset to input step
  const handleReset = () => {
    setCvText('');
    setCurrentStep('input');
    setAnalysisResult(null);
    setJobMatches([]);
    setErrorMessage('');
    setProcessingProgress(0);
  };

  // Complete and close
  const handleComplete = () => {
    if (analysisResult) {
      // Pass both analysis result and job matches to parent
      onAnalysisComplete({
        analysis: analysisResult,
        jobMatches: jobMatches,
        cvText: cvText
      }, cvText);
    }
    onClose();
  };

  // Demo data for pasting
  const sampleCvText = `John Smith
Senior Software Engineer
john.smith@example.com | (123) 456-7890 | New York, NY

SKILLS
JavaScript, TypeScript, React, Node.js, Express, MongoDB, AWS, Docker

EXPERIENCE
Senior Frontend Engineer | Tech Solutions Inc | January 2021 - Present
- Led development of a React-based dashboard used by over 10,000 customers
- Improved application performance by 40% through code optimization
- Mentored junior developers and conducted code reviews

Full Stack Developer | Digital Innovations | March 2018 - December 2020
- Developed and maintained multiple web applications using React and Node.js
- Implemented CI/CD pipeline using GitHub Actions and AWS
- Contributed to open-source projects and internal libraries

EDUCATION
Master of Computer Science | University of Technology | 2016-2018
Bachelor of Science in Software Engineering | State University | 2012-2016`;

  // If not open, don't render
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className="w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
        style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        role="dialog" 
        aria-modal="true"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
          <div className="flex items-center">
            <div className="mr-3 h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20` }}>
              <FiFileText className="w-5 h-5" style={{ color: colors.primary }} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              {currentStep === 'result' ? 'CV Analysis Results' : 'CV Analyzer'}
            </h2>
          </div>
          <button
            className="p-1.5 rounded-full transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose} 
            aria-label="Close CV analyzer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </header>
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Input CV Text */}
            {currentStep === 'input' && (
              <motion.div 
                key="input-step"
                className="p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                    Upload or Paste CV
                  </h3>
                  <p className="text-sm opacity-70 mb-4" style={{ color: colors.text }}>
                    Upload a CV file or paste the text below. Our AI will analyze it and extract key information.
                  </p>

                  {/* File Upload Section */}
                  <div 
                    className={`mb-6 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center relative ${isDragging ? 'bg-opacity-10' : ''}`}
                    style={{ 
                      borderColor: isDragging ? colors.primary : `${colors.primary}40`,
                      backgroundColor: isDragging ? `${colors.primary}10` : ''
                    }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {uploadedFile ? (
                      <>
                        <FiFileText className="w-12 h-12 mb-4" style={{ color: `${colors.primary}80` }} />
                        <h4 className="text-base font-medium mb-2" style={{ color: colors.text }}>
                          {uploadedFile.name}
                        </h4>
                        <p className="text-sm opacity-70 mb-4 text-center" style={{ color: colors.text }}>
                          {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || 'text/plain'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUploadedFile(null);
                              setCvText('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            Remove File
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <FiUpload className="w-12 h-12 mb-4" style={{ color: `${colors.primary}80` }} />
                        <h4 className="text-base font-medium mb-2" style={{ color: colors.text }}>
                          Drag & Drop CV File
                        </h4>
                        <p className="text-sm opacity-70 mb-2 text-center" style={{ color: colors.text }}>
                          Drop your CV file here, or click to browse
                        </p>
                        <p className="text-xs opacity-60 mb-4 text-center" style={{ color: colors.text }}>
                          Supported formats: PDF, DOCX, TXT (Max 10MB)
                        </p>
                        <Button
                          variant="outline"
                          leftIcon={<FiUpload className="w-4 h-4" />}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select File
                        </Button>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="relative mt-6">
                    <h4 className="text-base font-medium mb-2" style={{ color: colors.text }}>
                      Or Paste CV Text
                    </h4>
                    <TextArea
                      value={cvText}
                      onChange={handleCvTextChange}
                      placeholder="Paste CV text here..."
                      rows={10}
                      className="w-full p-3 border rounded-lg resize-none mb-2"
                      style={{ borderColor: colors.border }}
                    />
                    
                    {/* Word count indicator */}
                    <div className="text-xs opacity-60 text-right mb-3" style={{ color: colors.text }}>
                      {cvText.trim().split(/\s+/).filter(Boolean).length} words
                    </div>
                    
                    {/* Sample data button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCvText(sampleCvText)}
                      className="text-xs mb-3"
                    >
                      Use sample CV for testing
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">  
                    <div className="text-sm opacity-70" style={{ color: colors.text }}>
                      {uploadedFile ? 
                        <span>File ready: <strong>{uploadedFile.name}</strong></span> : 
                        cvText.trim().length > 0 ? 
                          <span>{cvText.trim().split(/\s+/).filter(Boolean).length} words entered</span> : 
                          <span>Please upload a file or paste text</span>
                      }
                    </div>                  
                    <Button
                      variant="primary"
                      onClick={handleAnalyze}
                      disabled={cvText.trim().length < 50}
                      leftIcon={<FiCpu className="w-4 h-4" />}
                      className="px-6 py-2"
                    >
                      Analyze CV
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Step 2: Processing */}
            {currentStep === 'processing' && (
              <motion.div 
                key="processing-step"
                className="p-6 flex flex-col items-center justify-center min-h-[300px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative w-20 h-20 mb-4">
                  {/* Base circle */}
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ borderWidth: '4px', borderColor: `${colors.primary}30`, borderStyle: 'solid' }}
                  />
                  
                  {/* Outer spinning circle */}
                  <motion.div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      borderWidth: '4px', 
                      borderLeftColor: colors.primary,
                      borderRightColor: 'transparent',
                      borderTopColor: 'transparent',
                      borderBottomColor: 'transparent',
                      borderStyle: 'solid',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  
                  {/* Inner spinning circle (opposite direction) */}
                  <motion.div 
                    className="absolute inset-4 rounded-full"
                    style={{ 
                      borderWidth: '3px', 
                      borderTopColor: `${colors.primary}80`,
                      borderRightColor: `${colors.primary}20`,
                      borderLeftColor: 'transparent',
                      borderBottomColor: 'transparent',
                      borderStyle: 'solid',
                      opacity: 0.8
                    }}
                    animate={{ rotate: -180 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Pulsing icon */}
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                  >
                    <FiCpu className="w-8 h-8" style={{ color: colors.primary }} />
                  </motion.div>
                </div>
                
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                  Analyzing CV...
                </h3>
                <p className="text-sm opacity-70 mb-6 text-center max-w-md" style={{ color: colors.text }}>
                  Our AI is analyzing the CV to extract skills, experience, education, and other key information. This may take a moment.
                </p>
                
                {/* Enhanced Progress bar with animation */}
                <div className="w-full max-w-md h-3 rounded-full overflow-hidden mb-2" 
                  style={{ 
                    backgroundColor: `${colors.primary}20`,
                    boxShadow: `0 0 4px ${colors.primary}30 inset`
                  }}
                >
                  <motion.div 
                    className="h-full rounded-full" 
                    style={{ 
                      background: `linear-gradient(90deg, ${colors.primary}80, ${colors.primary})`,
                      boxShadow: `0 0 8px ${colors.primary}70`
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${processingProgress}%` }}
                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                  />
                </div>
                
                {/* Animated percentage counter */}
                <motion.div 
                  className="text-sm font-medium"
                  style={{ color: colors.primary }}
                  animate={{ 
                    scale: processingProgress > 90 ? [1, 1.1, 1] : 1,
                    color: processingProgress > 90 ? [colors.primary, colors.text, colors.primary] : colors.primary
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {Math.round(processingProgress)}% complete
                </motion.div>
              </motion.div>
            )}
            
            {/* Step 3: Results */}
            {currentStep === 'result' && analysisResult && (
              <motion.div 
                key="result-step"
                className="p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center mb-4">
                  <FiCheckCircle className="w-6 h-6 mr-2 text-green-500" />
                  <h3 className="text-lg font-medium" style={{ color: colors.text }}>
                    Analysis Complete
                  </h3>
                </div>
                
                <CVResult analysis={analysisResult} jobMatches={jobMatches} />
              </motion.div>
            )}
            
            {/* Step 4: Error */}
            {currentStep === 'error' && (
              <motion.div 
                key="error-step"
                className="p-6 flex flex-col items-center justify-center min-h-[300px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FiAlertCircle className="w-16 h-16 mb-4 text-red-500" />
                <h3 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                  Analysis Failed
                </h3>
                <p className="text-sm opacity-70 mb-6 text-center max-w-md" style={{ color: colors.text }}>
                  {errorMessage}
                </p>
                <Button variant="primary" onClick={handleReset}>
                  Try Again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <footer className="p-4 border-t flex justify-between items-center" style={{ borderColor: colors.border }}>
          {currentStep === 'input' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <div className="text-xs opacity-60" style={{ color: colors.text }}>
                <span>Minimum 50 words required for analysis</span>
              </div>
            </>
          )}
          
          {currentStep === 'processing' && (
            <>
              <Button variant="outline" onClick={onClose} disabled>Cancel</Button>
              <div className="text-xs opacity-60" style={{ color: colors.text }}>
                <span>Please wait while we analyze the CV...</span>
              </div>
            </>
          )}
          
          {currentStep === 'result' && (
            <>
              <Button variant="outline" onClick={handleReset}>New Analysis</Button>
              <Button variant="primary" onClick={handleComplete}>
                Use Results
              </Button>
            </>
          )}
          
          {currentStep === 'error' && (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleReset}>Try Again</Button>
            </>
          )}
        </footer>
      </motion.div>
    </div>
  );
};

export default CVAnalyzer;