const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field_of_study: { type: String, required: true },
  start_date: { type: Date },
  end_date: { type: Date },
  grade: { type: String },
  description: { type: String },
  is_current: { type: Boolean, default: false }
}, { timestamps: true });

const workExperienceSchema = new mongoose.Schema({
  company_name: { type: String, required: true },
  position: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date },
  location: { type: String },
  description: { type: String },
  is_current: { type: Boolean, default: false }
}, { timestamps: true });

const candidateSkillSchema = new mongoose.Schema({
  skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  proficiency_level: { type: Number, min: 1, max: 5, required: true },
  years_of_experience: { type: Number, min: 0 },
  is_primary: { type: Boolean, default: false }
}, { _id: false });

const jobPreferencesSchema = new mongoose.Schema({
  desired_job_types: [{ type: String }],
  desired_locations: [{ type: String }],
  remote_preference: { type: String, enum: ['remote', 'hybrid', 'onsite', 'flexible'] },
  relocation_willingness: { type: Boolean, default: false },
  desired_salary_min: { type: Number },
  desired_salary_max: { type: Number },
  desired_benefits: [{ type: String }],
  availability_date: { type: Date }
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema({
  email_job_matches: { type: Boolean, default: true },
  email_application_updates: { type: Boolean, default: true },
  email_messages: { type: Boolean, default: true },
  email_marketing: { type: Boolean, default: false }
}, { _id: false });

const candidateProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  summary: { type: String },
  years_of_experience: { type: Number, default: 0 },
  phone: { type: String },
  location: { type: String },
  linkedin_url: { type: String },
  github_url: { type: String },
  portfolio_url: { type: String },
  resume_url: { type: String },
  cv_urls: [{ type: String }],
  career_level: { 
    type: String, 
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
    default: 'entry'
  },
  profile_completion: { type: Number, default: 0, min: 0, max: 100 },
  profile_completed: { type: Boolean, default: false },
  
  // Embedded subdocuments
  education: [educationSchema],
  work_experience: [workExperienceSchema],
  skills: [candidateSkillSchema],
  job_preferences: jobPreferencesSchema,
  notification_settings: notificationSettingsSchema
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
candidateProfileSchema.index({ user_id: 1 });
candidateProfileSchema.index({ location: 1 });
candidateProfileSchema.index({ career_level: 1 });
candidateProfileSchema.index({ 'skills.skill_id': 1 });
candidateProfileSchema.index({ years_of_experience: 1 });

// Virtual for full name (assuming user model has first_name and last_name)
candidateProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Method to calculate profile completion
candidateProfileSchema.methods.calculateProfileCompletion = function() {
  let completion = 0;
  const weights = {
    summary: 10,
    phone: 5,
    location: 5,
    education: 15,
    work_experience: 20,
    skills: 15,
    resume_url: 10,
    linkedin_url: 5,
    job_preferences: 10,
    profile_photo: 5
  };

  if (this.summary) completion += weights.summary;
  if (this.phone) completion += weights.phone;
  if (this.location) completion += weights.location;
  if (this.education && this.education.length > 0) completion += weights.education;
  if (this.work_experience && this.work_experience.length > 0) completion += weights.work_experience;
  if (this.skills && this.skills.length > 0) completion += weights.skills;
  if (this.resume_url || (this.cv_urls && this.cv_urls.length > 0)) completion += weights.resume_url;
  if (this.linkedin_url) completion += weights.linkedin_url;
  if (this.job_preferences && Object.keys(this.job_preferences).length > 2) completion += weights.job_preferences;

  this.profile_completion = completion;
  this.profile_completed = completion >= 80;
  return completion;
};

// Pre-save hook to update profile completion
candidateProfileSchema.pre('save', function(next) {
  this.calculateProfileCompletion();
  next();
});

const CandidateProfile = mongoose.models.CandidateProfile || mongoose.model('CandidateProfile', candidateProfileSchema);

module.exports = CandidateProfile;