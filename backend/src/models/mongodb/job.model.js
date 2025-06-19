const mongoose = require('mongoose');

const salaryRangeSchema = new mongoose.Schema({
  min: { type: Number },
  max: { type: Number },
  currency: { type: String, default: 'USD' },
  period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' }
}, { _id: false });

const jobRequirementSchema = new mongoose.Schema({
  skill_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  proficiency_level: { type: Number, min: 1, max: 5, default: 3 },
  is_required: { type: Boolean, default: true },
  years_of_experience: { type: Number, default: 0 }
}, { _id: false });

const applicationProcessSchema = new mongoose.Schema({
  steps: [{ type: String }],
  estimated_duration: { type: String },
  interview_rounds: { type: Number, default: 1 },
  assessment_required: { type: Boolean, default: false },
  assessment_type: { type: String }
}, { _id: false });

const jobSchema = new mongoose.Schema({
  company_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  },
  posted_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Basic Info
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String },
  responsibilities: { type: String },
  
  // Job Details
  job_type: { 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'temporary'],
    required: true 
  },
  experience_level: { 
    type: String, 
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
    required: true 
  },
  department: { type: String },
  
  // Location
  location: { type: String },
  city: { type: String },
  country: { type: String },
  remote_type: { 
    type: String, 
    enum: ['onsite', 'remote', 'hybrid', 'flexible'],
    default: 'onsite'
  },
  
  // Compensation
  salary_range: salaryRangeSchema,
  benefits: [{ type: String }],
  show_salary: { type: Boolean, default: true },
  
  // Requirements
  skills_required: [jobRequirementSchema],
  education_required: { type: String },
  years_of_experience_min: { type: Number, default: 0 },
  years_of_experience_max: { type: Number },
  languages_required: [{ type: String }],
  certifications_required: [{ type: String }],
  
  // Application Process
  application_process: applicationProcessSchema,
  application_deadline: { type: Date },
  start_date: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['draft', 'active', 'paused', 'closed', 'filled'],
    default: 'draft'
  },
  is_featured: { type: Boolean, default: false },
  is_urgent: { type: Boolean, default: false },
  
  // Metrics
  views_count: { type: Number, default: 0 },
  applications_count: { type: Number, default: 0 },
  shares_count: { type: Number, default: 0 },
  
  // Additional Info
  external_apply_url: { type: String },
  internal_notes: { type: String },
  rejection_reasons: [{ type: String }],
  
  // Dates
  published_at: { type: Date },
  expires_at: { type: Date },
  filled_at: { type: Date }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
jobSchema.index({ company_id: 1, status: 1 });
jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ job_type: 1 });
jobSchema.index({ experience_level: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ remote_type: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ published_at: -1 });
jobSchema.index({ 'skills_required.skill_id': 1 });

// Virtual for company details
jobSchema.virtual('company', {
  ref: 'Company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for poster details
jobSchema.virtual('poster', {
  ref: 'User',
  localField: 'posted_by',
  foreignField: '_id',
  justOne: true
});

// Method to publish job
jobSchema.methods.publish = function() {
  this.status = 'active';
  this.published_at = new Date();
  if (!this.expires_at) {
    // Default expiry after 30 days
    this.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  return this.save();
};

// Method to close job
jobSchema.methods.close = function(filled = false) {
  this.status = filled ? 'filled' : 'closed';
  if (filled) {
    this.filled_at = new Date();
  }
  return this.save();
};

// Method to increment view count
jobSchema.methods.incrementViews = function() {
  this.views_count += 1;
  return this.save();
};

// Pre-save hook to auto-expire jobs
jobSchema.pre('save', function(next) {
  if (this.status === 'active' && this.expires_at && new Date() > this.expires_at) {
    this.status = 'closed';
  }
  next();
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;