const mongoose = require('mongoose');
const { Schema } = mongoose;

// Admin Profile Schema
const AdminProfileSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    admin_role: {
      type: String,
      enum: ['system_admin', 'user_admin', 'content_admin', 'finance_admin', 'support_admin'],
      default: 'user_admin'
    },
    department: {
      type: String
    },
    permissions: [{
      resource: String,
      action: String, // read, write, delete, full_access
      scope: String
    }],
    is_active: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    last_action_at: {
      type: Date
    },
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

// SuperAdmin Profile Schema
const SuperAdminProfileSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    security_level: {
      type: Number,
      default: 1
    },
    has_system_access: {
      type: Boolean,
      default: true
    },
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

// Virtual references
AdminProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

SuperAdminProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Indexes
AdminProfileSchema.index({ user_id: 1 }, { unique: true });
AdminProfileSchema.index({ admin_role: 1 });
AdminProfileSchema.index({ status: 1 });

SuperAdminProfileSchema.index({ user_id: 1 }, { unique: true });

// Create models
const AdminProfile = mongoose.model('AdminProfile', AdminProfileSchema);
const SuperAdminProfile = mongoose.model('SuperAdminProfile', SuperAdminProfileSchema);

module.exports = {
  AdminProfile,
  SuperAdminProfile
};