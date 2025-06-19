const mongoose = require('mongoose');
const { Schema } = mongoose;

// Job Skill Requirement Schema
const JobSkillRequirementSchema = new Schema(
  {
    job_id: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    skill_id: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
    },
    is_required: {
      type: Boolean,
      default: true
    },
    proficiency_level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    },
    years_experience: {
      type: Number
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Main Job Schema
const JobSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    posted_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Job details
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    responsibilities: {
      type: [String]
    },
    requirements: {
      type: [String]
    },
    
    // Location and type
    location: {
      type: String,
      required: true
    },
    contract_type: {
      type: String,
      required: true,
      enum: ['Permanent', 'Contract', 'Freelance', 'Internship', 'Temporary']
    },
    job_type: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary']
    },
    experience_level: {
      type: String,
      enum: ['entry_level', 'junior', 'mid_level', 'senior', 'lead', 'principal']
    },
    
    // Remote work
    remote_option: {
      type: Boolean,
      default: false
    },
    is_remote: {
      type: Boolean,
      default: false
    },
    is_hybrid: {
      type: Boolean,
      default: false
    },
    
    // Salary
    salary_min: {
      type: Number
    },
    salary_max: {
      type: Number
    },
    salary_currency: {
      type: String,
      default: 'GBP',
      maxlength: 3
    },
    
    // Status and dates
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'filled', 'cancelled'],
      default: 'draft'
    },
    posting_date: {
      type: Date
    },
    deadline_date: {
      type: Date
    },
    
    // Additional details
    benefits: {
      type: [String]
    },
    company_culture: {
      type: String
    },
    requires_cover_letter: {
      type: Boolean,
      default: false
    },
    internal_notes: {
      type: String
    },
    
    // Visibility and metrics
    is_featured: {
      type: Boolean,
      default: false
    },
    view_count: {
      type: Number,
      default: 0
    },
    application_count: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for displaying salary range
JobSchema.virtual('salary_range_display').get(function() {
  if (this.salary_min && this.salary_max) {
    return `£${this.salary_min.toLocaleString()} - £${this.salary_max.toLocaleString()}`;
  } else if (this.salary_min) {
    return `£${this.salary_min.toLocaleString()}+`;
  } else if (this.salary_max) {
    return `Up to £${this.salary_max.toLocaleString()}`;
  }
  return 'Salary not specified';
});

// Virtual references to related models
JobSchema.virtual('company', {
  ref: 'Company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

JobSchema.virtual('posted_by_user', {
  ref: 'User',
  localField: 'posted_by',
  foreignField: '_id',
  justOne: true
});

JobSchema.virtual('skill_requirements', {
  ref: 'JobSkillRequirement',
  localField: '_id',
  foreignField: 'job_id'
});

JobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'job_id'
});

// Indexes
JobSchema.index({ company_id: 1 });
JobSchema.index({ posted_by: 1 });
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ location: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ contract_type: 1 });
JobSchema.index({ job_type: 1 });
JobSchema.index({ experience_level: 1 });
JobSchema.index({ is_remote: 1 });
JobSchema.index({ is_featured: 1 });
JobSchema.index({ posting_date: -1 });
JobSchema.index({ deadline_date: 1 });

JobSkillRequirementSchema.index({ job_id: 1, skill_id: 1 }, { unique: true });

// Create models (reuse existing if already compiled)
const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);
const JobSkillRequirement = mongoose.models.JobSkillRequirement || mongoose.model('JobSkillRequirement', JobSkillRequirementSchema);

module.exports = {
  Job,
  JobSkillRequirement
};