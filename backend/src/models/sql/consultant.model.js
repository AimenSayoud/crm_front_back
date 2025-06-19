const mongoose = require('mongoose');
const { Schema } = mongoose;

// Consultant Profile Schema
const ConsultantProfileSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    specialization: {
      type: String,
      required: true
    },
    experience_years: {
      type: Number,
      required: true,
      min: 0
    },
    certifications: [{
      name: String,
      issuer: String,
      date_obtained: Date,
      expiry_date: Date
    }],
    success_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    total_placements: {
      type: Number,
      default: 0,
      min: 0
    },
    active_candidates: {
      type: Number,
      default: 0,
      min: 0
    },
    commission_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    bio: {
      type: String
    },
    linkedin_url: {
      type: String
    },
    portfolio_url: {
      type: String
    },
    is_active: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total_reviews: {
      type: Number,
      default: 0,
      min: 0
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
ConsultantProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

ConsultantProfileSchema.virtual('managed_candidates', {
  ref: 'CandidateProfile',
  localField: 'user_id',
  foreignField: 'consultant_id'
});

// Indexes
ConsultantProfileSchema.index({ user_id: 1 }, { unique: true });
ConsultantProfileSchema.index({ specialization: 1 });
ConsultantProfileSchema.index({ is_active: 1 });
ConsultantProfileSchema.index({ success_rate: -1 });
ConsultantProfileSchema.index({ total_placements: -1 });

// Create model (reuse existing if already compiled)
const ConsultantProfile = mongoose.models.ConsultantProfile || mongoose.model('ConsultantProfile', ConsultantProfileSchema);

module.exports = ConsultantProfile; 