// src/app/ai-assistant/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useAuthStore, selectUser } from '@/store/useAuthStore';
import { useDataStore } from '@/store/useDataStore';
// Import services from new services folder structure
import { openai } from '@/services';

// Extracted Components
import ApiKeySettingsModal from '@/components/ai-assistant/ApiKeySettingsModal';
import ChatHeader from '@/components/ai-assistant/ChatHeader';
import ChatMessageList from '@/components/ai-assistant/ChatMessageList';
import ChatInput from '@/components/ai-assistant/ChatInput';
import CommandProcessor from '@/components/ai-assistant/CommandProcessor';

// UI Components
import { CommandMenu} from '@/components/CommandMenu/';
import { CMD_ANALYZE_CV, CMD_GENERATE_EMAIL, CMD_GENERATE_INTERVIEW_QUESTIONS, 
  CMD_GENERATE_JOB_DESCRIPTION, CMD_GENERATE_CANDIDATE_FEEDBACK, CMD_GENERATE_SUGGESTIONS,
  CMD_OPEN_CHAT, CMD_SEARCH_CANDIDATE, CMD_SEARCH_COMPANY} from '@/components/CommandMenu/types';

import SimpleSearchMenu from '@/components/ui/SimpleSearchMenu';
import CVAnalyzer from '@/components/CVAnalyzer/CVAnalyzer';
import { Candidate, Company } from '@/types';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
  entityReference?: {
    type: 'candidate' | 'company';
    id: string;
    name: string;
  };
}

const AiAssistantPage = () => {
  const { colors, theme } = useTheme();
  const user = useAuthStore(selectUser);

  // Use the Zustand store
  const {
    candidates,
    companies,
    selectedEntity,
    isLoadingCandidates,
    isLoadingCompanies,
    candidatesError,
    companiesError,
    fetchCandidates,
    fetchCompanies,
    setSelectedCandidate,
    setSelectedCompany,
    clearSelectedEntity,
  } = useDataStore();

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'initial-greeting', 
      content: "Hello! I'm your AI assistant for recruitment. How can I help you today? You can type a question or use '/' for commands.", 
      sender: 'assistant', 
      timestamp: new Date() 
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UI state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showCandidateSearch, setShowCandidateSearch] = useState(false);
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [showCVAnalyzer, setShowCVAnalyzer] = useState(false);
  
  // Command processor
  const [commandProcessor] = useState(() => new CommandProcessor(
    setSelectedCandidate,
    setSelectedCompany,
    (message) => addMessage(message),
    (query) => generateAIResponse(query),
    setIsProcessing,
    (updatedContent) => updateLastMessage(updatedContent)
  ));

  // Fetch data when component mounts
  useEffect(() => {
    console.log("🚀 AI Assistant page mounted");
    fetchCandidates(user?.officeId);
    fetchCompanies(user?.officeId);
  }, [fetchCandidates, fetchCompanies, user?.officeId]);

  // Add a message to the chat
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...message, id: Date.now().toString(), timestamp: new Date() }]);
  };

  // Update the last message in the chat
  const updateLastMessage = (updatedContent: Partial<Message>) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = { 
          ...newMessages[newMessages.length - 1], 
          ...updatedContent, 
          isLoading: false 
        };
      }
      return newMessages;
    });
  };

  // Main function to generate AI responses
  const generateAIResponse = async (userQuery: string): Promise<string> => {
    console.log("🤖 Generating AI response for:", userQuery);
    const lowerQuery = userQuery.toLowerCase();

    try {
      // Handle CV Analysis directly if triggered by keyword
      if (lowerQuery.startsWith('analyze cv') || lowerQuery.startsWith('/analyze_cv')) {
        const cvText = userQuery.replace(/analyze cv/i, '').replace(/\/analyze_cv/i, '').trim();
        if (cvText) {
          const analysis = await openai.resume.analyzeCv(cvText);
          
          // Format the response
          let formattedResponse = `✅ **CV Analysis Complete!**\n\n`;
          if (analysis?.summary) formattedResponse += `**Summary:**\n${analysis.summary}\n\n`;
          if (analysis?.total_experience_years !== undefined) {
            formattedResponse += `**Total Experience:** ${analysis.total_experience_years} years\n`;
          }
          if (analysis?.skills && analysis.skills.length > 0) {
            formattedResponse += `**Skills:** ${analysis.skills.join(', ')}\n`;
          }
          if (analysis?.education && analysis.education.length > 0) {
            formattedResponse += `**Education:**\n${analysis.education.map(edu => 
              `  - ${edu.degree || 'N/A'} at ${edu.institution || 'N/A'} (${edu.end_year || 'N/A'})`
            ).join('\n')}\n`;
          }
          if (analysis?.experience && analysis.experience.length > 0) { 
            formattedResponse += `**Experience:**\n${analysis.experience.map(exp => 
              `  - ${exp.title || 'N/A'} at ${exp.company || 'N/A'} (${exp.duration || 'N/A'})`
            ).join('\n')}\n`;
          }
          
          return formattedResponse.trim() || "CV Analyzed, but no specific details extracted.";
        }
        return "It looks like you wanted to analyze a CV, but the text was missing. Please use the format: analyze cv [CV text here]";
      }

      // Handle queries with a selected entity context
      if (selectedEntity) {
        const isCandidate = 'firstName' in selectedEntity;
        const entityName = isCandidate 
          ? `${selectedEntity.firstName} ${selectedEntity.lastName}` 
          : selectedEntity.name;
        
        if (isCandidate) { 
          // Candidate context
          const candidate = selectedEntity;
          
          if (lowerQuery.includes('email') || lowerQuery.includes('draft an email')) {
            const purpose = lowerQuery.includes('email for') 
              ? lowerQuery.replace(/.*email for/i, '').trim() 
              : 'general inquiry';
              
            return await openai.email.generateCandidateEmail(
              candidate, 
              `Regarding: ${purpose}`, 
              `From AI Assistant query: ${userQuery}`
            );
          }
          
          if (lowerQuery.includes('interview questions')) {
            return await openai.interview.generatePositionInterviewQuestions(
              candidate.position, 
              undefined, 
              `For candidate: ${candidate.firstName} ${candidate.lastName}`
            );
          }
          
          if (lowerQuery.includes('feedback')) {
            return await openai.candidate.generateCandidateFeedback(candidate);
          }
          
          // Default for candidate context
          return await openai.chat.processGeneralQuery(
            userQuery, 
            `Context: Candidate - ${entityName}, Position: ${candidate.position}`
          );
          
        } else { 
          // Company context
          const company = selectedEntity;
          
          if (lowerQuery.includes('email') || lowerQuery.includes('draft an email')) {
            const purpose = lowerQuery.includes('email for') 
              ? lowerQuery.replace(/.*email for/i, '').trim() 
              : 'general inquiry';
              
            return await openai.email.generateCompanyEmail(
              company, 
              `Regarding: ${purpose}`, 
              `From AI Assistant query: ${userQuery}`
            );
          }
          
          if (lowerQuery.includes('job description')) {
            const positionMatch = lowerQuery.match(/job description for (?:an? )?(.*?) position/i);
            const position = positionMatch?.[1]?.trim() || 'a suitable role';
            
            return await openai.job.generateJobDescriptionService(position, company.name, company.industry);
          }
          
          if (lowerQuery.includes('interview questions')) {
            const positionMatch = lowerQuery.match(/interview questions for (?:an? )?(.*?) position/i);
            const position = positionMatch?.[1]?.trim() || 'a role';
            
            return await openai.interview.generatePositionInterviewQuestions(position, company.name);
          }
          
          // Default for company context
          return await openai.chat.processGeneralQuery(
            userQuery, 
            `Context: Company - ${entityName}, Industry: ${company.industry}`
          );
        }
      }

      // Handle generic queries without specific entity context
      if (lowerQuery.includes('job description') || lowerQuery.includes('draft a job description')) {
        const positionMatch = lowerQuery.match(/job description for (?:an? )?(.*?) position/i) || 
                             lowerQuery.match(/draft a job description for (?:an? )?(.*?) position/i);
        const position = positionMatch?.[1]?.trim() || 'a generic role';
        
        return await openai.job.generateJobDescriptionService(position, 'Your Company (Generic)');
      }
      
      if (lowerQuery.includes('interview questions') || lowerQuery.includes('create interview questions')) {
        const positionMatch = lowerQuery.match(/interview questions for (?:an? )?(.*?) position/i) || 
                             lowerQuery.match(/create interview questions for (?:an? )?(.*?) position/i);
        const position = positionMatch?.[1]?.trim() || 'a generic role';
        
        return await openai.interview.generatePositionInterviewQuestions(position);
      }

      // Default to general query processing
      return await openai.chat.processGeneralQuery(userQuery);

    } catch (error: any) {
      console.error("❌ Error in generateAIResponse:", error);
      return `I encountered an issue processing that: ${error.message || "Please try a different query or check the service."}`;
    }
  };

  // Handle sending a message
  const handleSendMessage = async (query?: string) => {
    const currentQuery = (query || input).trim();
    if (!currentQuery || isProcessing) return;

    // Add user message
    addMessage({ content: currentQuery, sender: 'user' });
    setInput('');
    
    // Show loading state
    setIsProcessing(true);
    addMessage({ content: '', sender: 'assistant', isLoading: true });

    try {
      // Generate response
      const responseContent = await generateAIResponse(currentQuery);
      
      // Update message with response
      updateLastMessage({
        content: responseContent,
        entityReference: selectedEntity ? {
          type: 'firstName' in selectedEntity ? 'candidate' : 'company',
          id: selectedEntity.id,
          name: 'firstName' in selectedEntity
            ? `${selectedEntity.firstName} ${selectedEntity.lastName}`
            : selectedEntity.name,
        } : undefined,
      });
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      updateLastMessage({ 
        content: `Sorry, I encountered an error: ${error.message || 'Please try again.'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Command action handlers
  const handleGenerateGenericJobDescription = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    addMessage({ 
      content: "Generating a generic job description...", 
      sender: 'assistant', 
      isLoading: true 
    });
    
    try {
      const jd = await openai.job.generateJobDescriptionService("General Position", "Our Company");
      updateLastMessage({ content: jd });
    } catch (error: any) {
      updateLastMessage({ 
        content: `Error generating job description: ${error.message || 'Please try again.'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateGenericInterviewQuestions = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    addMessage({ 
      content: "Generating generic interview questions...", 
      sender: 'assistant', 
      isLoading: true 
    });
    
    try {
      const questions = await openai.interview.generatePositionInterviewQuestions("General Role");
      updateLastMessage({ content: questions });
    } catch (error: any) {
      updateLastMessage({ 
        content: `Error generating interview questions: ${error.message || 'Please try again.'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle entity selection
  const handleSelectCandidate = (candidate: Candidate) => {
    console.log("👤 Selected candidate:", candidate.firstName, candidate.lastName);
    setSelectedCandidate(candidate);
    setShowCandidateSearch(false);
    
    const newName = `${candidate.firstName} ${candidate.lastName}`;
    addMessage({ 
      content: `Switched context to candidate: ${newName}. You can now ask questions or generate content related to them.`, 
      sender: 'assistant' 
    });
    
    // Execute pending command if there is one
    const pendingCommand = commandProcessor.getCommandThatNeedsEntity();
    if (pendingCommand) {
      commandProcessor.executeCommand(pendingCommand, candidate);
    }
  };

  const handleSelectCompany = (company: Company) => {
    console.log("🏢 Selected company:", company.name);
    setSelectedCompany(company);
    setShowCompanySearch(false);
    
    addMessage({ 
      content: `Switched context to company: ${company.name}. You can now ask questions or generate content related to them.`, 
      sender: 'assistant' 
    });
    
    // Execute pending command if there is one
    const pendingCommand = commandProcessor.getCommandThatNeedsEntity();
    if (pendingCommand) {
      commandProcessor.executeCommand(pendingCommand, company);
    }
  };
  
  // Handle command selection and entity requirements
  const handleInitiateEntitySelectionForCommand = (
    entityTypeRequired: 'candidate' | 'company' | 'either' | null,
    commandId: string
  ) => {
    console.log(`🔄 Command initiated: ${commandId}, requires: ${entityTypeRequired}`);
    setShowCommandMenu(false); 

    // Handle commands that don't require entities
    if (entityTypeRequired === null) {
      if (commandId === CMD_ANALYZE_CV) {
        setShowCVAnalyzer(true);
        return; 
      }
      
      if (commandId === CMD_GENERATE_JOB_DESCRIPTION) {
        addMessage({ 
          content: "Okay, generating a generic job description template.", 
          sender: 'assistant' 
        });
        handleGenerateGenericJobDescription();
        return;
      }
      
      if (commandId === CMD_GENERATE_INTERVIEW_QUESTIONS) {
        addMessage({ 
          content: "Okay, generating generic interview questions.", 
          sender: 'assistant' 
        });
        handleGenerateGenericInterviewQuestions();
        return;
      }
      
      if (commandId === CMD_OPEN_CHAT && !selectedEntity) {
        addMessage({ 
          content: "You can ask general questions, or use /search_candidate or /search_company to set a context.", 
          sender: 'assistant'
        });
        return;
      }
    }
    
    // Remember command for after entity selection
    commandProcessor.setCommandThatNeedsEntity(commandId);

    // Check if we already have the required entity selected
    if (selectedEntity) {
      const currentEntityType = 'firstName' in selectedEntity ? 'candidate' : 'company';
      
      if (entityTypeRequired === 'either' || entityTypeRequired === currentEntityType) {
        commandProcessor.executeCommand(commandId, selectedEntity);
        return;
      } else {
        addMessage({ 
          content: `This command needs a ${entityTypeRequired}. You currently have a ${currentEntityType} selected. Please select a ${entityTypeRequired}.`, 
          sender: 'assistant' 
        });
        
        if (entityTypeRequired === 'candidate') {
          setShowCandidateSearch(true);
        } else if (entityTypeRequired === 'company') {
          setShowCompanySearch(true);
        }
        return;
      }
    }
    
    // No entity selected, prompt for selection
    if (entityTypeRequired === 'candidate') {
      addMessage({ 
        content: `To ${commandId.replace(/_/g, ' ')}, please select a candidate first.`, 
        sender: 'assistant' 
      });
      setShowCandidateSearch(true);
    } else if (entityTypeRequired === 'company') {
      addMessage({ 
        content: `To ${commandId.replace(/_/g, ' ')}, please select a company first.`, 
        sender: 'assistant' 
      });
      setShowCompanySearch(true);
    } else if (entityTypeRequired === 'either') {
      addMessage({ 
        content: `To ${commandId.replace(/_/g, ' ')}, please select a candidate or a company. Starting with candidate search.`, 
        sender: 'assistant' 
      });
      setShowCandidateSearch(true);
    }
  };

  // Input handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSlashCommand = () => {
    console.log("🔄 Slash command initiated");
    setShowCommandMenu(true);
  };

  // Handler for CV Analyzer completion
  const handleCVAnalysisComplete = async (analysisResults: any, cvText: string) => {
    setShowCVAnalyzer(false);
    setIsProcessing(true);
    
    // Show loading message first
    addMessage({ 
      content: "Processing the CV analysis results...", 
      sender: 'assistant', 
      isLoading: true 
    });
    
    try {
      // Format the response based on the analysis results
      let formattedResponse = `✅ **CV Analysis Complete!**\n\n`;
      
      const analysis = analysisResults.analysis || analysisResults;
      
      if (analysis?.summary) formattedResponse += `**Summary:**\n${analysis.summary}\n\n`;
      if (analysis?.total_experience_years !== undefined) {
        formattedResponse += `**Total Experience:** ${analysis.total_experience_years} years\n`;
      }
      if (analysis?.skills && analysis.skills.length > 0) {
        formattedResponse += `**Skills:** ${analysis.skills.join(', ')}\n`;
      }
      if (analysis?.education && analysis.education.length > 0) {
        formattedResponse += `**Education:**\n${analysis.education.map((edu: any) => 
          `  - ${edu.degree || 'N/A'} at ${edu.institution || 'N/A'} (${edu.end_year || 'N/A'})`
        ).join('\n')}\n`;
      }
      if (analysis?.experience && analysis.experience.length > 0) { 
        formattedResponse += `**Experience:**\n${analysis.experience.map((exp: any) => 
          `  - ${exp.title || 'N/A'} at ${exp.company || 'N/A'} (${exp.duration || 'N/A'})`
        ).join('\n')}\n`;
      }
      
      // Add job matches if available
      if (analysisResults.jobMatches && analysisResults.jobMatches.length > 0) {
        formattedResponse += `\n**Job Matches:**\n`;
        analysisResults.jobMatches.forEach((match: any, index: number) => {
          formattedResponse += `${index + 1}. **${match.job_title}** at ${match.company_name} - Match: ${match.match_score}%\n`;
          formattedResponse += `   Matching skills: ${match.matching_skills.join(', ')}\n`;
          if (index < 2) { // Show more details for top matches
            formattedResponse += `   ${match.match_explanation}\n`;
            formattedResponse += `   Tip: ${match.improvement_suggestion}\n`;
          }
        });
      }
      
      // Update the message with the formatted response
      updateLastMessage({
        content: formattedResponse.trim() || "CV Analyzed, but no specific details extracted.",
      });
    } catch (error: any) {
      console.error('❌ Error processing CV analysis results:', error);
      updateLastMessage({ 
        content: `Sorry, I encountered an error processing the CV analysis: ${error.message || 'Please try again.'}` 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: theme === 'light' ? '#F8FAFC' : '#0F172A' }}>
      {/* API Key Modal */}
      <ApiKeySettingsModal 
        isOpen={showApiKeySettings} 
        onClose={() => setShowApiKeySettings(false)} 
      />

      {/* CV Analyzer */}
      <CVAnalyzer 
        isOpen={showCVAnalyzer}
        onClose={() => setShowCVAnalyzer(false)}
        onAnalysisComplete={handleCVAnalysisComplete}
      />

      {/* Command Menu */}
      <CommandMenu
        isOpen={showCommandMenu}
        onClose={() => setShowCommandMenu(false)}
        onSelectCandidate={handleSelectCandidate} 
        onSelectCompany={handleSelectCompany}   
        onInitiateEntitySelection={handleInitiateEntitySelectionForCommand}
        selectedEntity={selectedEntity}
      />

      {/* Search Modals */}
      <SimpleSearchMenu
        isOpen={showCandidateSearch}
        type="candidates"
        items={candidates}
        isLoading={isLoadingCandidates}
        error={candidatesError}
        onSelect={(item) => { 
          if ('firstName' in item) handleSelectCandidate(item); 
        }}
        onClose={() => {
          setShowCandidateSearch(false);
          if(commandProcessor.getCommandThatNeedsEntity() && !selectedEntity) {
            addMessage({ 
              content: `Action "${commandProcessor.getCommandThatNeedsEntity()?.replace(/_/g, ' ')}" cancelled as no candidate was selected.`, 
              sender: 'assistant' 
            });
            commandProcessor.setCommandThatNeedsEntity(null);
          }
        }}
        title="Select a Candidate to Set Context"
      />
      
      <SimpleSearchMenu
        isOpen={showCompanySearch}
        type="companies"
        items={companies}
        isLoading={isLoadingCompanies}
        error={companiesError}
        onSelect={(item) => { 
          if (!('firstName' in item)) handleSelectCompany(item); 
        }}
        onClose={() => {
          setShowCompanySearch(false);
          if(commandProcessor.getCommandThatNeedsEntity() && !selectedEntity) {
            addMessage({ 
              content: `Action "${commandProcessor.getCommandThatNeedsEntity()?.replace(/_/g, ' ')}" cancelled as no company was selected.`, 
              sender: 'assistant' 
            });
            commandProcessor.setCommandThatNeedsEntity(null);
          }
        }}
        title="Select a Company to Set Context"
      />

      {/* Main Chat Interface */}
      <div className="flex flex-col h-full w-full overflow-hidden" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <ChatHeader
          selectedEntity={selectedEntity}
          onClearEntity={clearSelectedEntity}
          onOpenSettings={() => setShowApiKeySettings(true)}
        />

        {/* Chat Area */}
        <div className="flex flex-1 overflow-hidden p-4">
          <div className="flex flex-col flex-1 max-h-full rounded-xl overflow-hidden border shadow-sm" 
            style={{ 
              backgroundColor: colors.card, 
              borderColor: colors.border,
              boxShadow: theme === 'light' 
                ? '0 1px 3px rgba(0, 0, 0, 0.05)' 
                : '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Messages */}
            <ChatMessageList messages={messages} />
            
            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <ChatInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onSend={() => handleSendMessage()}
                onSlashCommand={handleSlashCommand}
                placeholder={selectedEntity
                  ? `Ask about ${'firstName' in selectedEntity ? `${selectedEntity.firstName} ${selectedEntity.lastName}` : selectedEntity.name}... or type /`
                  : "Type / for commands or ask a general recruitment question..."}
                disabled={isProcessing}
                entityName={selectedEntity ? ('firstName' in selectedEntity ? `${selectedEntity.firstName} ${selectedEntity.lastName}` : selectedEntity.name) : null}
                entityType={selectedEntity ? ('firstName' in selectedEntity ? 'candidate' : 'company') : null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;