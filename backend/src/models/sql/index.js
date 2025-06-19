const User = require('./user.model');
const { 
  CandidateProfile,
  CandidateEducation,
  CandidateExperience,
  CandidateSkill,
  CandidatePreferences
} = require('./candidate.model');
const { 
  Company,
  CompanyContact,
  CompanyHiringPreferences,
  RecruitmentHistory,
  EmployerProfile 
} = require('./company.model');
const { 
  Job,
  JobSkillRequirement 
} = require('./job.model');
const { 
  Application,
  ApplicationStatusHistory,
  ApplicationNote 
} = require('./application.model');
const { 
  Skill,
  SkillCategory 
} = require('./skill.model');
const {
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  MessageReadReceipt,
  MessageReaction,
  EmailTemplate
} = require('./messaging.model');
const {
  AdminProfile,
  SuperAdminProfile
} = require('./admin.model');

module.exports = {
  // User model
  User,
  
  // Candidate models
  CandidateProfile,
  CandidateEducation,
  CandidateExperience,
  CandidateSkill,
  CandidatePreferences,
  
  // Company models
  Company,
  CompanyContact,
  CompanyHiringPreferences,
  RecruitmentHistory,
  EmployerProfile,
  
  // Job models
  Job,
  JobSkillRequirement,
  
  // Application models
  Application,
  ApplicationStatusHistory,
  ApplicationNote,
  
  // Skill models
  Skill,
  SkillCategory,
  
  // Messaging models
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  MessageReadReceipt,
  MessageReaction,
  EmailTemplate,
  
  // Admin models
  AdminProfile,
  SuperAdminProfile
};