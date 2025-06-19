const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: [
      'programming_language',
      'framework',
      'database',
      'cloud',
      'devops',
      'soft_skill',
      'tool',
      'methodology',
      'design',
      'language',
      'certification',
      'other'
    ]
  },
  description: { type: String },
  aliases: [{ type: String }], // Alternative names for the skill
  related_skills: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Skill' 
  }],
  is_technical: { type: Boolean, default: true },
  is_active: { type: Boolean, default: true },
  usage_count: { type: Number, default: 0 }, // How many times this skill is used
  demand_level: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
  // Additional metadata
  icon_url: { type: String },
  color_code: { type: String }, // For UI display
  experience_levels: [{ 
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert']
  }]
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
skillSchema.index({ name: 'text' });
skillSchema.index({ category: 1 });
skillSchema.index({ is_active: 1 });
skillSchema.index({ usage_count: -1 });

// Static method to find skills by category
skillSchema.statics.findByCategory = function(category) {
  return this.find({ category, is_active: true }).sort('name');
};

// Static method to search skills
skillSchema.statics.searchSkills = function(query) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { aliases: { $in: [new RegExp(query, 'i')] } }
    ],
    is_active: true
  }).limit(20);
};

// Method to increment usage count
skillSchema.methods.incrementUsage = function() {
  this.usage_count += 1;
  return this.save();
};

// Pre-save hook to lowercase name for consistency
skillSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.toLowerCase();
  }
  if (this.aliases && this.aliases.length > 0) {
    this.aliases = this.aliases.map(alias => alias.toLowerCase());
  }
  next();
});

const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema);

module.exports = Skill;