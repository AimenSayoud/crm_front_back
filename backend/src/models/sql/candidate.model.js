const mongoose = require('mongoose');
const { Schema } = mongoose;

// Candidate Education Schema
const CandidateEducationSchema = new Schema(
  {
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    field_of_study: {
      type: String,
      required: true
    },
    start_date: {
      type: Date
    },
    end_date: {
      type: Date
    },
    is_current: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Candidate Experience Schema
const CandidateExperienceSchema = new Schema(
  {
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true
    },
    company: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    start_date: {
      type: Date
    },
    end_date: {
      type: Date
    },
    current: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Candidate Skill Schema
const CandidateSkillSchema = new Schema(
  {
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true
    },
    skill_id: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true
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

// Candidate Preferences Schema
const CandidatePreferencesSchema = new Schema(
  {
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      unique: true
    },
    job_types: [{
      type: String
    }],
    industries: [{
      type: String
    }],
    locations: [{
      type: String
    }],
    remote_work: {
      type: Boolean,
      default: false
    },
    salary_expectation_min: {
      type: Number
    },
    salary_expectation_max: {
      type: Number
    },
    availability_date: {
      type: Date
    },
    willing_to_relocate: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Main Candidate Profile Schema
const CandidateProfileSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    // Personal Information
    current_position: {
      type: String
    },
    current_company: {
      type: String
    },
    summary: {
      type: String
    },
    years_of_experience: {
      type: Number,
      default: 0
    },
    date_of_birth: {
      type: Date
    },
    nationality: {
      type: String
    },
    
    // Location
    location: {
      type: String
    },
    city: {
      type: String
    },
    country: {
      type: String
    },
    address: {
      type: String
    },
    postal_code: {
      type: String
    },
    
    // Profile Status
    profile_completed: {
      type: Boolean,
      default: false
    },
    profile_visibility: {
      type: String,
      default: 'public'
    },
    is_open_to_opportunities: {
      type: Boolean,
      default: true
    },
    
    // Documents
    cv_urls: {
      type: Map,
      of: String
    },
    cover_letter_url: {
      type: String
    },
    
    // Social/Professional Links
    linkedin_url: {
      type: String
    },
    github_url: {
      type: String
    },
    portfolio_url: {
      type: String
    },
    
    // Additional Information
    languages: [{
      language: String,
      proficiency: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: Date,
      expiry_date: Date,
      credential_id: String,
      url: String
    }],
    awards: [{
      title: String,
      issuer: String,
      date: Date,
      description: String
    }],
    publications: [{
      title: String,
      publisher: String,
      date: Date,
      url: String,
      description: String
    }],
    
    // Preferences
    willing_to_relocate: {
      type: Boolean,
      default: false
    },
    salary_expectation: {
      type: Number
    },
    
    // Notes
    notes: {
      type: String
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

// Virtual references to related models
CandidateProfileSchema.virtual('preferences', {
  ref: 'CandidatePreferences',
  localField: '_id',
  foreignField: 'candidate_id',
  justOne: true
});

CandidateProfileSchema.virtual('education_records', {
  ref: 'CandidateEducation',
  localField: '_id',
  foreignField: 'candidate_id'
});

CandidateProfileSchema.virtual('experience_records', {
  ref: 'CandidateExperience',
  localField: '_id',
  foreignField: 'candidate_id'
});

CandidateProfileSchema.virtual('skills', {
  ref: 'CandidateSkill',
  localField: '_id',
  foreignField: 'candidate_id'
});

CandidateProfileSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'candidate_id'
});

// Indexes
CandidateProfileSchema.index({ user_id: 1 }, { unique: true });
CandidateProfileSchema.index({ current_position: 1 });
CandidateProfileSchema.index({ years_of_experience: 1 });
CandidateProfileSchema.index({ country: 1, city: 1 });
CandidateProfileSchema.index({ is_open_to_opportunities: 1 });

CandidateSkillSchema.index({ candidate_id: 1, skill_id: 1 }, { unique: true });
CandidateEducationSchema.index({ candidate_id: 1 });
CandidateExperienceSchema.index({ candidate_id: 1 });

// Create models (reuse existing if already compiled)
const CandidateProfile = mongoose.models.CandidateProfile || mongoose.model('CandidateProfile', CandidateProfileSchema);
const CandidateEducation = mongoose.models.CandidateEducation || mongoose.model('CandidateEducation', CandidateEducationSchema);
const CandidateExperience = mongoose.models.CandidateExperience || mongoose.model('CandidateExperience', CandidateExperienceSchema);
const CandidateSkill = mongoose.models.CandidateSkill || mongoose.model('CandidateSkill', CandidateSkillSchema);
const CandidatePreferences = mongoose.models.CandidatePreferences || mongoose.model('CandidatePreferences', CandidatePreferencesSchema);

module.exports = {
  CandidateProfile,
  CandidateEducation,
  CandidateExperience,
  CandidateSkill,
  CandidatePreferences
};