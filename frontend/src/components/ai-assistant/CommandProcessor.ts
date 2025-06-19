// src/components/ai-assistant/CommandProcessor.ts
import { Candidate, Company } from '@/types';

// Service class for handling AI Assistant commands
export class CommandProcessor {
  private commandThatNeedsEntity: string | null = null;
  
  constructor(
    private setSelectedCandidate: (candidate: Candidate) => void,
    private setSelectedCompany: (company: Company) => void,
    private addMessage: (message: any) => void,
    private generateAIResponse: (query: string) => Promise<string>,
    private setIsProcessing: (isProcessing: boolean) => void,
    private updateLastMessage: (updatedContent: any) => void
  ) {}

  // Set current pending command
  setCommandThatNeedsEntity(commandId: string | null) {
    this.commandThatNeedsEntity = commandId;
  }

  // Get current pending command
  getCommandThatNeedsEntity() {
    return this.commandThatNeedsEntity;
  }
  
  // Execute a command with a selected entity
  async executeCommand(commandId: string, entity: Candidate | Company) {
    const entityName = 'firstName' in entity 
      ? `${entity.firstName} ${entity.lastName}` 
      : entity.name;
      
    console.log(`🔄 Executing command: ${commandId} for ${entityName}`);
    
    this.addMessage({ 
      content: `Okay, I will ${commandId.replace(/_/g, ' ')} for ${entityName}. One moment...`, 
      sender: 'assistant', 
      isLoading: true 
    });
    
    this.setIsProcessing(true);
    this.commandThatNeedsEntity = null;

    try {
      // Prepare the query based on the command type
      let query = '';
      
      if (commandId === 'generate_email') {
        query = `draft an email for ${entityName}`;
      } else if (commandId === 'generate_suggestions') {
        query = `provide suggestions for working with ${entityName}`;
      } else if (commandId === 'generate_candidate_feedback') {
        query = `provide feedback for candidate ${entityName}`;
      } else if (commandId === 'generate_interview_questions') {
        if ('firstName' in entity) {
          query = `interview questions for ${entityName} for ${entity.position} position`;
        } else {
          query = `interview questions for a role at ${entityName}`;
        }
      } else if (commandId === 'generate_job_description') {
        if (!('firstName' in entity)) {
          query = `job description for a role at ${entityName} in the ${entity.industry} industry`;
        } else {
          query = `job description for a role similar to ${entityName}'s position (${entity.position})`;
        }
      } else if (commandId === 'open_chat') {
        query = `tell me about ${entityName}`;
      } else {
        query = `help with ${commandId.replace(/_/g, ' ')} for ${entityName}`;
      }
      
      // Generate response
      const responseContent = await this.generateAIResponse(query);
      
      // Update message with response
      this.updateLastMessage({ 
        content: responseContent, 
        entityReference: { 
          type: 'firstName' in entity ? 'candidate' : 'company', 
          id: entity.id, 
          name: entityName 
        } 
      });
    } catch (error: any) {
      console.error(`❌ Error during action "${commandId}":`, error);
      this.updateLastMessage({ 
        content: `Error during action "${commandId}": ${error.message || 'Please try again.'}` 
      });
    } finally {
      this.setIsProcessing(false);
    }
  }
  
  // Helper to handle entity selection for command
  handleEntitySelectionForCommand(
    entityType: 'candidate' | 'company',
    selectedEntity: Candidate | Company | null,
    entity: Candidate | Company,
    commandId: string
  ) {
    const currentEntityType = 'firstName' in selectedEntity! ? 'candidate' : 'company';
    
    if (entityType === currentEntityType) {
      return this.executeCommand(commandId, selectedEntity!);
    } else {
      // Entity type mismatch, set new entity
      if (entityType === 'candidate' && !('firstName' in entity)) {
        this.setSelectedCandidate(entity as unknown as Candidate);
      } else if (entityType === 'company' && 'firstName' in entity) {
        this.setSelectedCompany(entity as unknown as Company);
      }
      
      // Then execute command with new entity
      return this.executeCommand(commandId, entity);
    }
  }
}

export default CommandProcessor;