const mongoose = require('mongoose');
const { Schema } = mongoose;

// Application Status History Schema
const ApplicationStatusHistorySchema = new Schema(
  {
    application_id: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: [
        'submitted', 'under_review', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn',
        'under_review_recruitmentplus', 'presented_to_employer', 'interview_scheduled', 'offer_made'
      ]
    },
    comment: {
      type: String
    },
    changed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    changed_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Application Note Schema
const ApplicationNoteSchema = new Schema(
  {
    application_id: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note_text: {
      type: String,
      required: true
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Main Application Schema
const ApplicationSchema = new Schema(
  {
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true
    },
    job_id: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    
    // Application details
    cover_letter: {
      type: String
    },
    source: {
      type: String,
      maxlength: 100
    },
    
    // Dates
    applied_at: {
      type: Date,
      default: Date.now,
      required: true
    },
    last_updated: {
      type: Date,
      default: Date.now
    },
    
    // Status
    status: {
      type: String,
      enum: [
        'submitted', 'under_review', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn',
        'under_review_recruitmentplus', 'presented_to_employer', 'interview_scheduled', 'offer_made'
      ],
      default: 'submitted',
      required: true
    },
    
    // Interview details
    interview_date: {
      type: Date
    },
    interview_type: {
      type: String,
      maxlength: 50
    },
    
    // Offer details
    offer_salary: {
      type: Number
    },
    offer_currency: {
      type: String,
      maxlength: 3,
      default: 'GBP'
    },
    offer_date: {
      type: Date
    },
    offer_expiry_date: {
      type: Date
    },
    offer_response: {
      type: String,
      maxlength: 20
    },
    
    // Notes
    internal_notes: {
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
ApplicationSchema.virtual('candidate', {
  ref: 'CandidateProfile',
  localField: 'candidate_id',
  foreignField: '_id',
  justOne: true
});

ApplicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'job_id',
  foreignField: '_id',
  justOne: true
});

ApplicationSchema.virtual('status_history', {
  ref: 'ApplicationStatusHistory',
  localField: '_id',
  foreignField: 'application_id'
});

ApplicationSchema.virtual('notes', {
  ref: 'ApplicationNote',
  localField: '_id',
  foreignField: 'application_id'
});

// Indexes
ApplicationSchema.index({ candidate_id: 1, job_id: 1 }, { unique: true });
ApplicationSchema.index({ job_id: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ applied_at: -1 });
ApplicationSchema.index({ interview_date: 1 });
ApplicationSchema.index({ offer_date: 1 });

ApplicationStatusHistorySchema.index({ application_id: 1 });
ApplicationStatusHistorySchema.index({ changed_at: -1 });

ApplicationNoteSchema.index({ application_id: 1 });
ApplicationNoteSchema.index({ user_id: 1 });

// Create models
const Application = mongoose.model('Application', ApplicationSchema);
const ApplicationStatusHistory = mongoose.model('ApplicationStatusHistory', ApplicationStatusHistorySchema);
const ApplicationNote = mongoose.model('ApplicationNote', ApplicationNoteSchema);

module.exports = {
  Application,
  ApplicationStatusHistory,
  ApplicationNote
};