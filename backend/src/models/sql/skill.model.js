const mongoose = require('mongoose');
const { Schema } = mongoose;

// Skill Category Schema
const SkillCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String
    },
    display_order: {
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

// Main Skill Schema
const SkillSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'SkillCategory'
    },
    description: {
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
SkillSchema.virtual('category', {
  ref: 'SkillCategory',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true
});

SkillSchema.virtual('candidate_skills', {
  ref: 'CandidateSkill',
  localField: '_id',
  foreignField: 'skill_id'
});

SkillSchema.virtual('job_skills', {
  ref: 'JobSkillRequirement',
  localField: '_id',
  foreignField: 'skill_id'
});

// Virtual for skill category relationship
SkillCategorySchema.virtual('skills', {
  ref: 'Skill',
  localField: '_id',
  foreignField: 'category_id'
});

// Indexes
SkillSchema.index({ name: 1 }, { unique: true });
SkillSchema.index({ category_id: 1 });
SkillSchema.index({ name: 'text', description: 'text' });

SkillCategorySchema.index({ name: 1 }, { unique: true });
SkillCategorySchema.index({ display_order: 1 });

// Create models (reuse existing if already compiled)
const Skill = mongoose.models.Skill || mongoose.model('Skill', SkillSchema);
const SkillCategory = mongoose.models.SkillCategory || mongoose.model('SkillCategory', SkillCategorySchema);

module.exports = {
  Skill,
  SkillCategory
};