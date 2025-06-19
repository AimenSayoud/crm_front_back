const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
  linkedin: { type: String },
  twitter: { type: String },
  facebook: { type: String },
  instagram: { type: String }
}, { _id: false, strict: false }); // strict: false allows additional social media fields

const companyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  is_primary: { type: Boolean, default: false }
}, { timestamps: true });

const hiringPreferencesSchema = new mongoose.Schema({
  preferred_experience_years: { type: Number },
  required_education: [{ type: String }],
  culture_values: [{ type: String }],
  interview_process: [{ type: String }]
}, { _id: false });

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  industry: { type: String, required: true },
  description: { type: String },
  company_size: { 
    type: String, 
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    required: true 
  },
  
  // Contact Info
  website: { type: String },
  email: { type: String },
  phone: { type: String },
  location: { type: String },
  
  // Address
  address: { type: String },
  city: { type: String },
  country: { type: String },
  postal_code: { type: String },
  
  // Company Details
  founded_year: { type: Number },
  registration_number: { type: String },
  tax_id: { type: String },
  
  // Media
  logo_url: { type: String },
  cover_image_url: { type: String },
  social_media: socialMediaSchema,
  
  // Status
  is_verified: { type: Boolean, default: false },
  is_premium: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending'
  },
  
  // Metrics
  total_employees: { type: Number, default: 0 },
  active_jobs: { type: Number, default: 0 },
  
  // Additional Info
  notes: { type: String },
  
  // Embedded subdocuments
  contacts: [companyContactSchema],
  hiring_preferences: hiringPreferencesSchema,
  
  // Relationships
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ company_size: 1 });
companySchema.index({ location: 1 });
companySchema.index({ status: 1 });
companySchema.index({ is_verified: 1 });
companySchema.index({ is_premium: 1 });

// Virtual for primary contact
companySchema.virtual('primary_contact').get(function() {
  return this.contacts.find(contact => contact.is_primary);
});

// Method to update active jobs count
companySchema.methods.updateActiveJobsCount = async function() {
  const Job = mongoose.model('Job');
  const count = await Job.countDocuments({ 
    company_id: this._id, 
    status: 'active' 
  });
  this.active_jobs = count;
  return this.save();
};

// Pre-save hook to ensure only one primary contact
companySchema.pre('save', function(next) {
  if (this.contacts && this.contacts.length > 0) {
    const primaryContacts = this.contacts.filter(c => c.is_primary);
    if (primaryContacts.length > 1) {
      // Keep only the first as primary
      this.contacts.forEach((contact, index) => {
        if (index > 0 && contact.is_primary) {
          contact.is_primary = false;
        }
      });
    }
  }
  next();
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;