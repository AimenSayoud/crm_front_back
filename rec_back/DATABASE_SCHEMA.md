# Database Schema Reference

This document provides a reference for the database schema used in the RecrutementPlus CRM system. It details each table's structure, relationships, and important information for developers.

## Core Tables

### Users

The `users` table stores authentication and basic user information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'employee',  -- 'super_admin', 'admin', 'employee'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    office_id UUID REFERENCES offices(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Candidates

The `candidates` table stores basic candidate information, linked to more detailed profile data.

```sql
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR,
    current_position VARCHAR,
    current_company VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    consultant_id UUID REFERENCES consultants(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Candidate Profiles

The `candidate_profiles` table stores detailed information about candidates.

```sql
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    resume_text TEXT,
    years_of_experience NUMERIC,
    education TEXT,
    certifications TEXT[],
    linkedin_url VARCHAR,
    github_url VARCHAR,
    portfolio_url VARCHAR,
    desired_salary NUMERIC,
    availability_date DATE,
    remote_preference VARCHAR,
    relocation_willingness BOOLEAN DEFAULT FALSE,
    preferred_locations VARCHAR[],
    summary TEXT,
    cv_analysis JSONB,
    career_level VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Companies

The `companies` table stores company information for employers.

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    industry VARCHAR,
    size VARCHAR,
    location VARCHAR,
    website VARCHAR,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    logo_url VARCHAR
);
```

### Jobs

The `jobs` table stores job openings.

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id),
    description TEXT,
    location VARCHAR,
    salary_min NUMERIC,
    salary_max NUMERIC,
    experience_level VARCHAR,
    employment_type VARCHAR,
    remote_option BOOLEAN DEFAULT FALSE,
    status VARCHAR NOT NULL DEFAULT 'open',  -- 'open', 'closed', 'draft'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    posted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    responsibilities TEXT,
    requirements TEXT,
    benefits TEXT,
    application_instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Applications

The `applications` table tracks job applications.

```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    status VARCHAR NOT NULL DEFAULT 'applied',  -- 'applied', 'screening', 'interviewing', 'offered', 'hired', 'rejected'
    application_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    resume_url VARCHAR,
    cover_letter_text TEXT,
    notes TEXT,
    source VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(job_id, candidate_id)
);
```

### Skills

The `skills` table stores skill definitions.

```sql
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    category VARCHAR,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

## Relationship Tables

### Candidate Skills

The `candidate_skills` table connects candidates to their skills with proficiency levels.

```sql
CREATE TABLE candidate_skills (
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    skill_id UUID NOT NULL REFERENCES skills(id),
    proficiency_level INTEGER NOT NULL DEFAULT 1,  -- 1-5 scale
    years_of_experience NUMERIC,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (candidate_id, skill_id)
);
```

### Job Skills

The `job_skills` table connects jobs to required skills with proficiency levels.

```sql
CREATE TABLE job_skills (
    job_id UUID NOT NULL REFERENCES jobs(id),
    skill_id UUID NOT NULL REFERENCES skills(id),
    required_level INTEGER NOT NULL DEFAULT 1,  -- 1-5 scale
    is_required BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (job_id, skill_id)
);
```

## Messaging System

### Conversations

The `conversations` table stores messaging conversations.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Conversation Participants

The `conversation_participants` table links users to conversations.

```sql
CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (conversation_id, user_id)
);
```

### Messages

The `messages` table stores individual messages in conversations.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url VARCHAR,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

## AI and Analytics

### Email Templates

The `email_templates` table stores templates for AI-generated emails.

```sql
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    category VARCHAR,
    template_type VARCHAR NOT NULL,  -- 'interview_invitation', 'job_offer', 'rejection', etc.
    conversation_metadata JSONB,  -- Variables and instructions for AI
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### AI Interactions

The `ai_interactions` table tracks AI tool usage.

```sql
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    interaction_type VARCHAR NOT NULL,  -- 'cv_analysis', 'job_match', 'email_generation', etc.
    prompt TEXT,
    response JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    entity_type VARCHAR,  -- 'candidate', 'job', etc.
    entity_id UUID,
    tokens_used INTEGER,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT
);
```

## Consulting and Admin

### Consultants

The `consultants` table stores information about recruitment consultants.

```sql
CREATE TABLE consultants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR,
    specialization VARCHAR[],
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Offices

The `offices` table stores company office locations.

```sql
CREATE TABLE offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    state VARCHAR,
    country VARCHAR NOT NULL,
    postal_code VARCHAR,
    phone VARCHAR,
    is_headquarters BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

## Key Features of the Schema

1. **UUID Primary Keys**: All tables use UUID primary keys for better security and distribution.

2. **Timestamp Tracking**: All tables include created_at, updated_at, and (optionally) deleted_at columns.

3. **Soft Deletion**: Records are marked as deleted using deleted_at rather than being physically removed.

4. **Active Status**: All tables include an is_active flag for quick filtering.

5. **Audit Trail**: Most tables track the user who created the record (created_by).

6. **JSON Storage**: Complex data is stored in JSONB columns (cv_analysis, conversation_metadata).

7. **Relationships**: Clear foreign key relationships between tables.

8. **Enumeration Types**: Status fields use string values ('open', 'closed', etc.) for better readability and flexibility.

## Database Diagram

```
┌────────────┐       ┌──────────────────┐       ┌──────────────┐
│   users    │───┐   │    candidates    │───┐   │     jobs     │
└────────────┘   │   └──────────────────┘   │   └──────────────┘
                 │                          │           │
                 │                          │           │
┌────────────┐   │   ┌──────────────────┐   │   ┌──────┴───────┐
│ consultants│◀──┘   │ candidate_profiles│◀──┘   │  applications│
└────────────┘       └──────────────────┘       └──────────────┘
                                │                       │
                                │                       │
┌────────────┐       ┌──────────┴───────┐       ┌──────┴───────┐
│   skills   │◀──────│  candidate_skills │       │  job_skills  │
└────────────┘       └──────────────────┘       └──────┬───────┘
      │                                                 │
      └─────────────────────────────────────────────────┘
                            
┌────────────┐       ┌──────────────────┐       ┌──────────────┐
│ companies  │       │  conversations   │       │   messages   │
└────────────┘       └──────────────────┘       └──────────────┘
                              │                         │
                              │                         │
                     ┌────────┴───────┐                 │
                     │conversation_   │◀────────────────┘
                     │participants    │
                     └────────────────┘

┌────────────┐       ┌──────────────────┐       ┌──────────────┐
│  offices   │       │  email_templates │       │ai_interactions│
└────────────┘       └──────────────────┘       └──────────────┘
```

## Notes for Developers

1. **Indexes**: In addition to primary keys and foreign keys, consider creating indexes for:
   - `users.email` (already indexed as UNIQUE)
   - `candidates.email` (already indexed as UNIQUE)
   - `applications.status`
   - `jobs.status`
   - `messages.conversation_id` and `messages.sent_at`

2. **Transactions**: Use transactions when creating related records, such as:
   - Creating a candidate and candidate profile
   - Creating a job with required skills
   - Updating application status with notes

3. **Query Optimization**:
   - Use JOIN statements efficiently
   - Be aware of JSONB query performance for complex filtering
   - Consider using LATERAL joins for complex related data retrieval

4. **Data Validation**:
   - Validate data in the API layer using Pydantic models
   - Use database constraints for critical integrity (UNIQUE, NOT NULL, etc.)
   - Consider using CHECK constraints for enum-like fields (status, role, etc.)

5. **Data Migration**:
   - Use Alembic for schema migrations
   - Test migrations thoroughly on a staging environment before production

6. **Schema Evolution**:
   - When adding new columns, consider default values carefully
   - When adding new tables, ensure proper relationship definitions
   - Keep track of schema changes in the Alembic migrations directory