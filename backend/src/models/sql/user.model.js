const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password_hash: {
      type: String,
      required: true
    },
    first_name: {
      type: String,
      required: true,
      trim: true
    },
    last_name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      enum: ['candidate', 'employer', 'admin', 'superadmin'],
      default: 'candidate'
    },
    is_active: {
      type: Boolean,
      default: true
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String,
      default: null
    },
    last_login: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password_hash;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Virtual for full name
UserSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

// Virtual references to related models
UserSchema.virtual('candidate_profile', {
  ref: 'CandidateProfile',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true
});

UserSchema.virtual('employer_profiles', {
  ref: 'EmployerProfile',
  localField: '_id',
  foreignField: 'user_id'
});

UserSchema.virtual('admin_profile', {
  ref: 'AdminProfile',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true
});

UserSchema.virtual('superadmin_profile', {
  ref: 'SuperAdminProfile',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true
});

UserSchema.virtual('posted_jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'posted_by'
});

UserSchema.virtual('sent_messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'sender_id'
});

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

// Avoid OverwriteModelError by checking if the model already exists
const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;