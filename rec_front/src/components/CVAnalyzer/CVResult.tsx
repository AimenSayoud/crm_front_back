// src/components/CVAnalyzer/CVResult.tsx
import React, { useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { FiUser, FiCalendar, FiBookmark, FiTag, FiBriefcase, FiAward, FiInfo, FiTarget } from 'react-icons/fi';

interface CVResultProps {
  analysis: {
    skills?: string[];
    education?: Array<{
      degree?: string;
      institution?: string;
      field?: string;
      start_year?: string;
      end_year?: string;
    }>;
    experience?: Array<{
      title?: string;
      company?: string;
      duration?: string;
      start_date?: string;
      end_date?: string;
      current?: boolean;
      responsibilities?: string[];
    }>;
    total_experience_years?: number;
    summary?: string;
  };
  jobMatches?: Array<{
    job_id: number;
    job_title: string;
    company_name: string;
    match_score: number;
    matching_skills: string[];
    non_matching_skills: string[];
    match_explanation: string;
    improvement_suggestion: string;
  }>;
}

// A component for displaying analysis results
const CVResult: React.FC<CVResultProps> = ({ analysis, jobMatches }) => {
  const { theme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState('summary');
  
  // Tabs for different sections
  const tabs = [
    { id: 'summary', label: 'Summary', icon: <FiInfo /> },
    { id: 'skills', label: 'Skills', icon: <FiTag /> },
    { id: 'experience', label: 'Experience', icon: <FiBriefcase /> },
    { id: 'education', label: 'Education', icon: <FiBookmark /> },
    // Only show job matches tab if matches exist
    ...(jobMatches && jobMatches.length > 0 ? [{ id: 'jobMatches', label: 'Job Matches', icon: <FiTarget /> }] : []),
  ];

  return (
    <div className="rounded-lg shadow-sm" style={{ backgroundColor: colors.card, borderColor: colors.border, border: '1px solid' }}>
      {/* Header with success indicator */}
      <div className="p-3 flex items-center rounded-t-lg" style={{ background: theme === 'light' ? 'linear-gradient(to right, #f0fdf4, #eff6ff)' : 'linear-gradient(to right, rgba(20, 83, 45, 0.2), rgba(30, 58, 138, 0.2))' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: theme === 'light' ? '#dcfce7' : '#166534' }}>
          <FiUser style={{ color: theme === 'light' ? '#16a34a' : '#86efac' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Analysis Complete</h2>
          <p className="text-xs" style={{ color: `${colors.text}90` }}>
            AI successfully extracted candidate information
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex overflow-x-auto sticky top-0 z-10" style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.card }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className="px-4 py-3 flex items-center text-sm font-medium transition-colors relative"
            style={{ 
              color: activeTab === tab.id 
                ? theme === 'light' ? '#0f766e' : '#2dd4bf'
                : `${colors.text}70`,
              ':hover': activeTab !== tab.id ? { color: colors.text } : {}
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ backgroundColor: theme === 'light' ? '#0f766e' : '#14b8a6' }} />
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: theme === 'light' ? '#f9fafb' : 'rgba(17, 24, 39, 0.5)', borderColor: colors.border, border: '1px solid' }}>
              <h3 className="font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                <FiInfo className="mr-2" /> Professional Summary
              </h3>
              <p className="text-sm" style={{ color: `${colors.text}E6` }}>
                {analysis.summary || 'No summary available.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: theme === 'light' ? '#f9fafb' : 'rgba(17, 24, 39, 0.5)', borderColor: colors.border, border: '1px solid' }}>
                <h3 className="font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                  <FiCalendar className="mr-2" /> Total Experience
                </h3>
                <p className="text-sm" style={{ color: `${colors.text}E6` }}>
                  {analysis.total_experience_years !== undefined 
                    ? `${analysis.total_experience_years} year${analysis.total_experience_years === 1 ? '' : 's'}`
                    : 'Not available'}
                </p>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: theme === 'light' ? '#f9fafb' : 'rgba(17, 24, 39, 0.5)', borderColor: colors.border, border: '1px solid' }}>
                <h3 className="font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                  <FiTag className="mr-2" /> Key Skills
                </h3>
                <p className="text-sm" style={{ color: `${colors.text}E6` }}>
                  {analysis.skills && analysis.skills.length > 0 
                    ? analysis.skills.slice(0, 5).join(', ') + (analysis.skills.length > 5 ? '...' : '')
                    : 'No skills detected'}
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: theme === 'light' ? '#f9fafb' : 'rgba(17, 24, 39, 0.5)', borderColor: colors.border, border: '1px solid' }}>
              <h3 className="font-medium mb-2 flex items-center" style={{ color: colors.text }}>
                <FiUser className="mr-2" /> Career Highlights
              </h3>
              {analysis.experience && analysis.experience.length > 0 ? (
                <div className="text-sm" style={{ color: `${colors.text}E6` }}>
                  <p>Most recent position: {analysis.experience[0]?.title || 'N/A'} at {analysis.experience[0]?.company || 'N/A'}</p>
                  <p>Companies worked for: {Array.from(new Set(analysis.experience.map(exp => exp.company).filter(Boolean))).length}</p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: `${colors.text}E6` }}>No experience data available</p>
              )}
            </div>
          </div>
        )}
        
        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium" style={{ color: colors.text }}>
                Skills Assessment
              </h3>
              {analysis.skills && analysis.skills.length > 0 && (
                <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: theme === 'light' ? '#dbeafe' : 'rgba(30, 58, 138, 0.5)', color: theme === 'light' ? '#1d4ed8' : '#93c5fd' }}>
                  {analysis.skills.length} skills identified
                </div>
              )}
            </div>
            
            {analysis.skills && analysis.skills.length > 0 ? (
              <>
                {/* Categorized skills (we'll assume some categories based on common skills) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="rounded-lg overflow-hidden" style={{ borderColor: colors.border, border: '1px solid' }}>
                    <div className="px-4 py-2" style={{ backgroundColor: theme === 'light' ? '#eff6ff' : 'rgba(30, 58, 138, 0.4)', borderBottom: `1px solid ${colors.border}` }}>
                      <h4 className="font-medium" style={{ color: theme === 'light' ? '#1d4ed8' : '#bfdbfe' }}>Technical Skills</h4>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2" style={{ backgroundColor: colors.card }}>
                      {analysis.skills
                        .filter(skill => 
                          /^(java|python|c\+\+|react|node|html|css|sql|javascript|typescript|php|ruby|swift|kotlin|aws|azure|ml|ai|analytics|data|cloud|devops|agile|scrum).*/i.test(skill))
                        .map((skill, index) => (
                          <div 
                            key={index} 
                            className="px-3 py-1.5 rounded-full text-sm flex items-center"
                            style={{ 
                              color: theme === 'light' ? '#0f766e' : '#5eead4',
                              backgroundColor: theme === 'light' ? '#f0fdfa' : 'rgba(19, 78, 74, 0.2)'
                            }}
                          >
                            <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: theme === 'light' ? '#0d9488' : '#2dd4bf' }}></span>
                            {skill}
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div className="rounded-lg overflow-hidden" style={{ borderColor: colors.border, border: '1px solid' }}>
                    <div className="px-4 py-2" style={{ backgroundColor: theme === 'light' ? '#f0fdf4' : 'rgba(20, 83, 45, 0.4)', borderBottom: `1px solid ${colors.border}` }}>
                      <h4 className="font-medium" style={{ color: theme === 'light' ? '#15803d' : '#bbf7d0' }}>Soft Skills</h4>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2" style={{ backgroundColor: colors.card }}>
                      {analysis.skills
                        .filter(skill => 
                          /^(communication|leadership|teamwork|problem.solving|critical|creativity|collaboration|adaptability|time.management|organization|presentation|negotiation).*/i.test(skill))
                        .map((skill, index) => (
                          <div 
                            key={index} 
                            className="px-3 py-1.5 rounded-full text-sm flex items-center"
                            style={{ 
                              color: theme === 'light' ? '#1d4ed8' : '#93c5fd',
                              backgroundColor: theme === 'light' ? '#eff6ff' : 'rgba(30, 58, 138, 0.2)'
                            }}
                          >
                            <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: theme === 'light' ? '#2563eb' : '#60a5fa' }}></span>
                            {skill}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                
                {/* All skills */}
                <div className="mt-5">
                  <h4 className="text-sm font-medium mb-3" style={{ color: colors.text }}>All Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill, index) => (
                      <div 
                        key={index} 
                        className="px-3 py-1.5 rounded-full text-sm transition-transform hover:scale-105"
                        style={{ 
                          color: theme === 'light' ? '#0f766e' : '#5eead4',
                          backgroundColor: theme === 'light' ? '#f0fdfa' : 'rgba(19, 78, 74, 0.2)'
                        }}
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg p-4" style={{ 
                backgroundColor: theme === 'light' ? '#fefce8' : 'rgba(113, 63, 18, 0.3)', 
                borderColor: theme === 'light' ? '#fef9c3' : '#854d0e',
                border: '1px solid' 
              }}>
                <p className="text-sm flex items-center" style={{ color: theme === 'light' ? '#854d0e' : '#fef08a' }}>
                  <FiInfo className="mr-2" style={{ color: theme === 'light' ? '#eab308' : '#fde047' }} />
                  No skills were detected in the CV. The CV may not explicitly list skills, or the AI couldn't identify them.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium" style={{ color: colors.text }}>
                Work Experience
              </h3>
              {analysis.experience && analysis.experience.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ 
                    backgroundColor: theme === 'light' ? '#f3e8ff' : 'rgba(88, 28, 135, 0.5)', 
                    color: theme === 'light' ? '#7e22ce' : '#d8b4fe' 
                  }}>
                    {analysis.experience.length} positions
                  </div>
                  {analysis.total_experience_years !== undefined && (
                    <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ 
                      backgroundColor: theme === 'light' ? '#dbeafe' : 'rgba(30, 58, 138, 0.5)', 
                      color: theme === 'light' ? '#1d4ed8' : '#93c5fd' 
                    }}>
                      {analysis.total_experience_years} years total
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {analysis.experience && analysis.experience.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute top-0 bottom-0 left-[15px] w-0.5" style={{ backgroundColor: theme === 'light' ? '#99f6e4' : 'rgba(19, 78, 74, 0.6)' }} />
                
                <div className="space-y-6 ml-8">
                  {analysis.experience.map((exp, index) => (
                    <div 
                      key={index} 
                      className="relative pb-1 group"
                    >
                      {/* Timeline dot */}
                      <div className="absolute w-8 h-8 rounded-full border-2 flex items-center justify-center -left-11 top-0" style={{ 
                        backgroundColor: colors.card,
                        borderColor: theme === 'light' ? '#0d9488' : '#2dd4bf'
                      }}>
                        <FiBriefcase style={{ color: theme === 'light' ? '#0d9488' : '#2dd4bf' }} />
                      </div>
                      
                      {/* Content card */}
                      <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow" style={{ 
                        backgroundColor: theme === 'light' ? '#f9fafb' : 'rgba(17, 24, 39, 0.5)', 
                        borderColor: colors.border, 
                        border: '1px solid' 
                      }}>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-base text-gray-800 dark:text-gray-100">
                                {exp.title || 'Untitled Position'}
                              </h4>
                              <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                                <span className="font-medium">{exp.company || 'Unknown Company'}</span>
                              </p>
                            </div>
                            <div className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {exp.duration || 'Unknown Duration'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Responsibilities */}
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <div className="p-4">
                            <h5 className="text-xs uppercase tracking-wider font-medium mb-2 text-gray-600 dark:text-gray-400">
                              Key Responsibilities
                            </h5>
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                              {exp.responsibilities.map((resp, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 mr-2 flex-shrink-0 ${
                                    idx < 3 ? 'bg-teal-600 dark:bg-teal-400' : 'bg-teal-400/60 dark:bg-teal-600/60'
                                  }`} />
                                  <span className={idx >= 3 ? 'text-gray-600 dark:text-gray-400' : ''}>
                                    {resp}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm flex items-center text-yellow-800 dark:text-yellow-200">
                  <FiInfo className="mr-2 text-yellow-500" />
                  No work experience data was extracted from the CV.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-1 text-gray-800 dark:text-gray-100">
              Education
            </h3>
            
            {analysis.education && analysis.education.length > 0 ? (
              <div className="space-y-4">
                {analysis.education.map((edu, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex">
                    <div className="mr-4 mt-1">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                        <FiAward className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1 text-gray-800 dark:text-gray-100">
                        {edu.degree || 'Degree Not Specified'}
                        {edu.field ? ` in ${edu.field}` : ''}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {edu.institution || 'Institution Not Specified'}
                      </p>
                      {(edu.start_year || edu.end_year) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {edu.start_year ? edu.start_year : ''} 
                          {edu.start_year && edu.end_year ? ' - ' : ''} 
                          {edu.end_year ? edu.end_year : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No education data was extracted from the CV.
              </p>
            )}
          </div>
        )}
        
        {/* Job Matches Tab */}
        {activeTab === 'jobMatches' && jobMatches && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                Best Job Matches
              </h3>
              {jobMatches.length > 0 && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  {jobMatches.length} potential matches
                </div>
              )}
            </div>
            
            {jobMatches.length > 0 ? (
              <div className="space-y-6">
                {jobMatches.map((job, index) => (
                  <div 
                    key={index} 
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Job header with color-coded match score */}
                    <div className="relative">
                      {/* Match score indicator */}
                      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
                        <div 
                          className={`absolute rotate-45 transform origin-bottom-left w-28 h-28 -right-20 -top-3 flex items-center justify-center ${
                            job.match_score >= 85 ? 'bg-green-500' : 
                            job.match_score >= 70 ? 'bg-blue-500' : 
                            job.match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                        >
                          <span className="text-white font-bold text-xs absolute right-[19px] top-[17px] rotate-[50deg]">
                            {job.match_score}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Header content */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3">
                            <FiBriefcase className="text-teal-600 dark:text-teal-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-base text-gray-800 dark:text-gray-100">
                              {job.job_title}
                            </h4>
                            <p className="text-sm mt-0.5 text-gray-700 dark:text-gray-300">
                              {job.company_name}
                            </p>
                          </div>
                        </div>
                        
                        {/* Match score visualization */}
                        <div className="pr-8">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  job.match_score >= 85 ? 'bg-green-500' : 
                                  job.match_score >= 70 ? 'bg-blue-500' : 
                                  job.match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${job.match_score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Skills comparison */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Matching skills */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium flex items-center text-gray-800 dark:text-gray-100">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          Matching Skills ({job.matching_skills.length})
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {job.matching_skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Missing skills */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium flex items-center text-gray-800 dark:text-gray-100">
                          <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                          Skills to Develop ({job.non_matching_skills.length})
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {job.non_matching_skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 rounded-full text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.non_matching_skills.length === 0 && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              No missing skills detected!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Match explanation */}
                    <div className="px-4 pb-4">
                      <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-medium mb-1.5 text-gray-800 dark:text-gray-100">
                          Why this is a good match:
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {job.match_explanation}
                        </p>
                        
                        <h5 className="text-sm font-medium mt-3 mb-1.5 text-gray-800 dark:text-gray-100">
                          How to improve your fit:
                        </h5>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {job.improvement_suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm flex items-center text-yellow-800 dark:text-yellow-200">
                  <FiInfo className="mr-2 text-yellow-500" />
                  No job matches found. Try adjusting your CV to match more job requirements.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CVResult;