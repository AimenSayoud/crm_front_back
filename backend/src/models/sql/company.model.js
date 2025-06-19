const mongoose = require('mongoose');
const { Schema } = mongoose;

// Company Contact Schema
const CompanyContactSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    title: {
      type: String
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    is_primary: {
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

// Company Hiring Preferences Schema
const CompanyHiringPreferencesSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      unique: true
    },
    preferred_experience_years: {
      type: String
    },
    required_education: {
      type: String
    },
    culture_values: [{
      type: String
    }],
    interview_process: [{
      type: String
    }]
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Recruitment History Schema
const RecruitmentHistorySchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    job_title: {
      type: String,
      required: true
    },
    date_filled: {
      type: Date
    },
    time_to_fill: {
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

// Employer Profile Schema
const EmployerProfileSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    title: {
      type: String
    },
    position: {
      type: String
    },
    department: {
      type: String
    },
    is_primary_contact: {
      type: Boolean,
      default: false
    },
    can_post_jobs: {
      type: Boolean,
      default: true
    },
    jobs_posted: {
      type: Number,
      default: 0
    },
    successful_hires: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Main Company Schema
const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    industry: {
      type: String
    },
    size: {
      type: String,
      enum: ['1-10', '10-50', '50-200', '200-1000', '1000+']
    },
    company_size: {
      type: String,
      enum: ['1-10', '10-50', '50-200', '200-1000', '1000+']
    },
    location: {
      type: String
    },
    description: {
      type: String
    },
    website: {
      type: String
    },
    logo_url: {
      type: String
    },
    
    // Additional fields
    email: {
      type: String
    },
    phone: {
      type: String
    },
    address: {
      type: String
    },
    city: {
      type: String
    },
    country: {
      type: String
    },
    postal_code: {
      type: String
    },
    founded_year: {
      type: Number
    },
    registration_number: {
      type: String
    },
    tax_id: {
      type: String
    },
    cover_image_url: {
      type: String
    },
    social_media: {
      type: Map,
      of: String
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    is_premium: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String
    },
    total_employees: {
      type: Number,
      default: 0
    },
    active_jobs: {
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

// Virtual references to related models
CompanySchema.virtual('employer_profiles', {
  ref: 'EmployerProfile',
  localField: '_id',
  foreignField: 'company_id'
});

CompanySchema.virtual('contacts', {
  ref: 'CompanyContact',
  localField: '_id',
  foreignField: 'company_id'
});

CompanySchema.virtual('hiring_preferences', {
  ref: 'CompanyHiringPreferences',
  localField: '_id',
  foreignField: 'company_id',
  justOne: true
});

CompanySchema.virtual('recruitment_history', {
  ref: 'RecruitmentHistory',
  localField: '_id',
  foreignField: 'company_id'
});

CompanySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company_id'
});

// Indexes
CompanySchema.index({ name: 1 });
CompanySchema.index({ industry: 1 });
CompanySchema.index({ location: 1 });
CompanySchema.index({ country: 1, city: 1 });
CompanySchema.index({ is_verified: 1 });
CompanySchema.index({ is_premium: 1 });

CompanyContactSchema.index({ company_id: 1 });
CompanyContactSchema.index({ email: 1 });
CompanyHiringPreferencesSchema.index({ company_id: 1 }, { unique: true });
RecruitmentHistorySchema.index({ company_id: 1 });
EmployerProfileSchema.index({ user_id: 1 });
EmployerProfileSchema.index({ company_id: 1 });
EmployerProfileSchema.index({ user_id: 1, company_id: 1 }, { unique: true });

// Create models (reuse existing if already compiled)
const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);
const CompanyContact = mongoose.models.CompanyContact || mongoose.model('CompanyContact', CompanyContactSchema);
const CompanyHiringPreferences = mongoose.models.CompanyHiringPreferences || mongoose.model('CompanyHiringPreferences', CompanyHiringPreferencesSchema);
const RecruitmentHistory = mongoose.models.RecruitmentHistory || mongoose.model('RecruitmentHistory', RecruitmentHistorySchema);
const EmployerProfile = mongoose.models.EmployerProfile || mongoose.model('EmployerProfile', EmployerProfileSchema);

module.exports = {
  Company,
  CompanyContact,
  CompanyHiringPreferences,
  RecruitmentHistory,
  EmployerProfile
};