# RecrutementPlus CRM API Routes Planning

## 📋 Overview

This document outlines the complete API routes structure for the RecrutementPlus CRM platform. The API follows RESTful conventions with role-based access control and comprehensive CRUD operations.

**Base URL:** `/api/v1`  
**Authentication:** JWT Bearer Token  
**Response Format:** JSON  

---

## 🔐 Authentication & Authorization Strategy

### Permission Levels
- **Public**: Registration, login, public job listings
- **Candidate**: Own profile, applications, job search
- **Employer**: Company jobs, applications, candidate viewing
- **Consultant**: Assigned candidates, client management, recruitment process
- **Admin**: User management, system settings, reporting
- **SuperAdmin**: Full system access, analytics, data management

### Middleware Stack
- JWT token validation
- Role-based access control (RBAC)
- Rate limiting per endpoint
- Request logging and audit trails
- CORS handling
- Input validation and sanitization

---

## 🛣️ API Routes Structure

### 1. Authentication & Authorization Routes
**Base:** `/api/v1/auth`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/login` | User login | No | Public |
| POST | `/register` | User registration | No | Public |
| POST | `/refresh` | Refresh tokens | Yes | All |
| POST | `/logout` | User logout | Yes | All |
| POST | `/forgot-password` | Password reset request | No | Public |
| POST | `/reset-password` | Password reset confirmation | No | Public |
| GET | `/profile` | Current user profile | Yes | All |
| PUT | `/profile` | Update user profile | Yes | All |
| POST | `/verify-email` | Email verification | No | Public |
| POST | `/change-password` | Change password | Yes | All |

---

### 2. User Management Routes
**Base:** `/api/v1/users`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | List users (with pagination/filter) | Yes | Admin, SuperAdmin |
| GET | `/{user_id}` | Get user by ID | Yes | Admin, SuperAdmin, Self |
| PUT | `/{user_id}` | Update user | Yes | Admin, SuperAdmin, Self |
| DELETE | `/{user_id}` | Delete user | Yes | Admin, SuperAdmin |
| POST | `/{user_id}/activate` | Activate user | Yes | Admin, SuperAdmin |
| POST | `/{user_id}/deactivate` | Deactivate user | Yes | Admin, SuperAdmin |
| GET | `/{user_id}/activity` | User activity log | Yes | Admin, SuperAdmin |
| POST | `/bulk-import` | Bulk import users | Yes | SuperAdmin |

---

### 3. Candidate Management Routes
**Base:** `/api/v1/candidates`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | List candidates + search/filter | Yes | Employer, Consultant, Admin |
| POST | `/` | Create candidate profile | Yes | Candidate, Admin |
| GET | `/{candidate_id}` | Get candidate details | Yes | Candidate(self), Employer, Consultant, Admin |
| PUT | `/{candidate_id}` | Update candidate | Yes | Candidate(self), Admin |
| DELETE | `/{candidate_id}` | Delete candidate | Yes | Admin, SuperAdmin |
| GET | `/{candidate_id}/cv` | Get CV/resume | Yes | Candidate(self), Employer, Consultant, Admin |
| POST | `/{candidate_id}/cv` | Upload CV/resume | Yes | Candidate(self), Admin |
| GET | `/{candidate_id}/applications` | Candidate applications | Yes | Candidate(self), Consultant, Admin |
| GET | `/{candidate_id}/matches` | Job matches for candidate | Yes | Candidate(self), Consultant |
| POST | `/{candidate_id}/skills` | Add/update skills | Yes | Candidate(self), Admin |
| GET | `/{candidate_id}/analytics` | Candidate analytics | Yes | Candidate(self), Consultant, Admin |
| POST | `/bulk-import` | Bulk import candidates | Yes | Admin, SuperAdmin |
| GET | `/{candidate_id}/education` | Get education records | Yes | Candidate(self), Employer, Consultant, Admin |
| POST | `/{candidate_id}/education` | Add education record | Yes | Candidate(self), Admin |
| PUT | `/{candidate_id}/education/{edu_id}` | Update education record | Yes | Candidate(self), Admin |
| DELETE | `/{candidate_id}/education/{edu_id}` | Delete education record | Yes | Candidate(self), Admin |
| GET | `/{candidate_id}/experience` | Get work experience | Yes | Candidate(self), Employer, Consultant, Admin |
| POST | `/{candidate_id}/experience` | Add work experience | Yes | Candidate(self), Admin |
| PUT | `/{candidate_id}/experience/{exp_id}` | Update work experience | Yes | Candidate(self), Admin |
| DELETE | `/{candidate_id}/experience/{exp_id}` | Delete work experience | Yes | Candidate(self), Admin |

---

### 4. Job Management Routes
**Base:** `/api/v1/jobs`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | List jobs + search/filter | No | Public (limited), All (full) |
| POST | `/` | Create job posting | Yes | Employer, Admin |
| GET | `/{job_id}` | Get job details | No | Public (limited), All (full) |
| PUT | `/{job_id}` | Update job | Yes | Employer(own), Admin |
| DELETE | `/{job_id}` | Delete job | Yes | Employer(own), Admin |
| POST | `/{job_id}/publish` | Publish job | Yes | Employer(own), Admin |
| POST | `/{job_id}/close` | Close job | Yes | Employer(own), Admin |
| GET | `/{job_id}/applications` | Job applications | Yes | Employer(own), Consultant, Admin |
| GET | `/{job_id}/candidates` | Matching candidates | Yes | Employer(own), Consultant, Admin |
| GET | `/{job_id}/analytics` | Job performance analytics | Yes | Employer(own), Admin |
| POST | `/{job_id}/duplicate` | Duplicate job posting | Yes | Employer(own), Admin |
| GET | `/{job_id}/skill-requirements` | Get skill requirements | Yes | All |
| POST | `/{job_id}/skill-requirements` | Add skill requirements | Yes | Employer(own), Admin |
| PUT | `/{job_id}/skill-requirements/{req_id}` | Update skill requirement | Yes | Employer(own), Admin |
| DELETE | `/{job_id}/skill-requirements/{req_id}` | Delete skill requirement | Yes | Employer(own), Admin |

---

### 5. Application Management Routes
**Base:** `/api/v1/applications`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | List applications + filter | Yes | Employer, Consultant, Admin |
| POST | `/` | Submit application | Yes | Candidate |
| GET | `/{application_id}` | Get application details | Yes | Candidate(own), Employer, Consultant, Admin |
| PUT | `/{application_id}` | Update application | Yes | Consultant, Admin |
| POST | `/{application_id}/status` | Change application status | Yes | Employer, Consultant, Admin |
| GET | `/{application_id}/history` | Application status history | Yes | Candidate(own), Employer, Consultant, Admin |
| POST | `/{application_id}/notes` | Add application notes | Yes | Employer, Consultant, Admin |
| GET | `/{application_id}/notes` | Get application notes | Yes | Employer, Consultant, Admin |
| POST | `/{application_id}/schedule-interview` | Schedule interview | Yes | Employer, Consultant, Admin |
| POST | `/{application_id}/make-offer` | Make job offer | Yes | Employer, Admin |
| POST | `/bulk-update` | Bulk status updates | Yes | Consultant, Admin |
| GET | `/pipeline` | Application pipeline view | Yes | Employer, Consultant, Admin |
| POST | `/{application_id}/withdraw` | Withdraw application | Yes | Candidate(own) |

---

### 6. Company Management Routes
**Base:** `/api/v1/companies`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | List companies | Yes | All |
| POST | `/` | Create company | Yes | Admin, SuperAdmin |
| GET | `/{company_id}` | Get company details | Yes | All |
| PUT | `/{company_id}` | Update company | Yes | Employer(own), Admin |
| DELETE | `/{company_id}` | Delete company | Yes | Admin, SuperAdmin |
| GET | `/{company_id}/jobs` | Company jobs | Yes | All |
| GET | `/{company_id}/employees` | Company employees | Yes | Employer(own), Admin |
| GET | `/{company_id}/analytics` | Company analytics | Yes | Employer(own), Admin |
| POST | `/{company_id}/contacts` | Add company contact | Yes | Employer(own), Admin |
| GET | `/{company_id}/contacts` | Get company contacts | Yes | Employer(own), Admin |
| PUT | `/{company_id}/contacts/{contact_id}` | Update company contact | Yes | Employer(own), Admin |
| DELETE | `/{company_id}/contacts/{contact_id}` | Delete company contact | Yes | Employer(own), Admin |
| GET | `/{company_id}/hiring-preferences` | Get hiring preferences | Yes | Employer(own), Admin |
| PUT | `/{company_id}/hiring-preferences` | Update hiring preferences | Yes | Employer(own), Admin |

---

### 7. Consultant Management Routes
**Base:** `/api/v1/consultants`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | List consultants | Yes | Admin, SuperAdmin |
| POST | `/` | Create consultant profile | Yes | Admin, SuperAdmin |
| GET | `/{consultant_id}` | Get consultant details | Yes | Consultant(self), Admin |
| PUT | `/{consultant_id}` | Update consultant | Yes | Consultant(self), Admin |
| DELETE | `/{consultant_id}` | Delete consultant | Yes | Admin, SuperAdmin |
| GET | `/{consultant_id}/clients` | Consultant clients | Yes | Consultant(self), Admin |
| GET | `/{consultant_id}/candidates` | Assigned candidates | Yes | Consultant(self), Admin |
| GET | `/{consultant_id}/performance` | Performance metrics | Yes | Consultant(self), Admin |
| POST | `/{consultant_id}/assign-candidate` | Assign candidate | Yes | Consultant(self), Admin |
| DELETE | `/{consultant_id}/assign-candidate/{candidate_id}` | Unassign candidate | Yes | Consultant(self), Admin |
| GET | `/{consultant_id}/analytics` | Consultant analytics | Yes | Consultant(self), Admin |
| GET | `/{consultant_id}/targets` | Performance targets | Yes | Consultant(self), Admin |
| PUT | `/{consultant_id}/targets` | Update targets | Yes | Admin |

---

### 8. Analytics & Reporting Routes
**Base:** `/api/v1/analytics`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/dashboard` | Dashboard overview | Yes | Admin, SuperAdmin |
| GET | `/applications` | Application analytics | Yes | Employer, Consultant, Admin |
| GET | `/jobs` | Job analytics | Yes | Employer, Admin |
| GET | `/candidates` | Candidate analytics | Yes | Consultant, Admin |
| GET | `/consultants` | Consultant analytics | Yes | Admin, SuperAdmin |
| GET | `/companies` | Company analytics | Yes | Admin, SuperAdmin |
| GET | `/trends` | Trend analysis | Yes | Admin, SuperAdmin |
| POST | `/custom-report` | Generate custom report | Yes | Admin, SuperAdmin |
| GET | `/reports/{report_id}` | Get generated report | Yes | Admin, SuperAdmin |
| POST | `/export` | Export analytics data | Yes | Admin, SuperAdmin |
| GET | `/kpis` | Key performance indicators | Yes | Admin, SuperAdmin |
| GET | `/benchmarks` | Industry benchmarks | Yes | Admin, SuperAdmin |

---

### 9. Messaging & Communication Routes
**Base:** `/api/v1/messaging`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/conversations` | List conversations | Yes | All |
| POST | `/conversations` | Create conversation | Yes | All |
| GET | `/conversations/{conv_id}` | Get conversation | Yes | Participants, Admin |
| PUT | `/conversations/{conv_id}` | Update conversation | Yes | Participants, Admin |
| DELETE | `/conversations/{conv_id}` | Delete conversation | Yes | Participants, Admin |
| POST | `/conversations/{conv_id}/messages` | Send message | Yes | Participants |
| GET | `/conversations/{conv_id}/messages` | Get messages | Yes | Participants, Admin |
| PUT | `/messages/{message_id}` | Update message | Yes | Sender, Admin |
| DELETE | `/messages/{message_id}` | Delete message | Yes | Sender, Admin |
| POST | `/messages/{message_id}/read` | Mark as read | Yes | Recipient |
| GET | `/templates` | Email templates | Yes | Consultant, Admin |
| POST | `/templates` | Create template | Yes | Admin |
| PUT | `/templates/{template_id}` | Update template | Yes | Admin |
| DELETE | `/templates/{template_id}` | Delete template | Yes | Admin |
| POST | `/bulk-message` | Send bulk messages | Yes | Consultant, Admin |

---

### 10. Skills Management Routes
**Base:** `/api/v1/skills`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/` | List skills | No | Public |
| POST | `/` | Create skill | Yes | Admin |
| GET | `/{skill_id}` | Get skill details | No | Public |
| PUT | `/{skill_id}` | Update skill | Yes | Admin |
| DELETE | `/{skill_id}` | Delete skill | Yes | Admin |
| GET | `/categories` | Skill categories | No | Public |
| POST | `/categories` | Create skill category | Yes | Admin |
| PUT | `/categories/{category_id}` | Update skill category | Yes | Admin |
| DELETE | `/categories/{category_id}` | Delete skill category | Yes | Admin |
| GET | `/trending` | Trending skills | Yes | All |
| GET | `/demand-analysis` | Skills demand analysis | Yes | Admin |
| POST | `/bulk-import` | Bulk import skills | Yes | Admin |

---

### 11. Admin & System Routes
**Base:** `/api/v1/admin`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/users` | Manage all users | Yes | Admin, SuperAdmin |
| GET | `/system-stats` | System statistics | Yes | Admin, SuperAdmin |
| GET | `/audit-logs` | System audit logs | Yes | Admin, SuperAdmin |
| POST | `/backup` | System backup | Yes | SuperAdmin |
| GET | `/settings` | System settings | Yes | Admin, SuperAdmin |
| PUT | `/settings` | Update settings | Yes | Admin, SuperAdmin |
| GET | `/notifications` | Admin notifications | Yes | Admin, SuperAdmin |
| POST | `/notifications` | Create admin notification | Yes | Admin, SuperAdmin |
| PUT | `/notifications/{notification_id}` | Update notification | Yes | Admin, SuperAdmin |
| DELETE | `/notifications/{notification_id}` | Delete notification | Yes | Admin, SuperAdmin |
| POST | `/maintenance-mode` | Toggle maintenance | Yes | SuperAdmin |
| GET | `/performance` | System performance metrics | Yes | Admin, SuperAdmin |

**Base:** `/api/v1/superadmin`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | `/analytics` | Super admin analytics | Yes | SuperAdmin |
| POST | `/admin-users` | Create admin users | Yes | SuperAdmin |
| GET | `/system-health` | System health check | Yes | SuperAdmin |
| POST | `/data-migration` | Data migration tools | Yes | SuperAdmin |
| GET | `/database-stats` | Database statistics | Yes | SuperAdmin |
| POST | `/reset-system` | System reset (dev only) | Yes | SuperAdmin |

---

### 12. AI Tools & Automation Routes
**Base:** `/api/v1/ai-tools`

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | `/cv-analysis` | Analyze CV content | Yes | Employer, Consultant, Admin |
| POST | `/job-matching` | AI job matching | Yes | Consultant, Admin |
| POST | `/candidate-scoring` | Score candidates | Yes | Employer, Consultant, Admin |
| POST | `/interview-questions` | Generate interview questions | Yes | Employer, Consultant, Admin |
| POST | `/email-generation` | Generate emails | Yes | Consultant, Admin |
| GET | `/recommendations` | AI recommendations | Yes | All |
| POST | `/skill-extraction` | Extract skills from CV | Yes | Employer, Consultant, Admin |
| POST | `/job-description-optimization` | Optimize job descriptions | Yes | Employer, Admin |
| POST | `/salary-benchmarking` | AI salary benchmarking | Yes | Employer, Admin |

---

## 📊 Route Implementation Status

### Current Status
- ✅ Authentication routes (partial)
- ✅ Candidate routes (with fake data)
- ✅ Job routes (with fake data)
- ✅ Skills routes (basic)
- ✅ Messaging routes (basic)
- ✅ AI tools routes (basic)
- ❌ Application routes (missing)
- ❌ Company routes (incomplete)
- ❌ Consultant routes (missing)
- ❌ Analytics routes (missing)
- ❌ Admin routes (missing)

### Implementation Priority
1. **High Priority**: Applications, Analytics, Admin/User management
2. **Medium Priority**: Companies, Consultants, Enhanced messaging
3. **Low Priority**: Advanced AI tools, Reporting exports

---

## 🔨 Implementation Guidelines

### Code Structure
```
app/api/v1/
├── __init__.py
├── deps.py              # Dependencies (auth, db, permissions)
├── auth.py              # Authentication routes
├── users.py             # User management
├── candidates.py        # Candidate management
├── jobs.py              # Job management
├── applications.py      # Application management
├── companies.py         # Company management
├── consultants.py       # Consultant management
├── analytics.py         # Analytics & reporting
├── messaging.py         # Messaging system
├── skills.py            # Skills management
├── admin.py             # Admin functions
├── superadmin.py        # Super admin functions
└── ai_tools.py          # AI tools & automation
```

### Response Standards
- **Success**: HTTP 200/201 with data
- **Client Error**: HTTP 400-499 with error details
- **Server Error**: HTTP 500 with generic message
- **Pagination**: Include `page`, `page_size`, `total`, `pages`
- **Filtering**: Support query parameters for filtering
- **Sorting**: Support `sort_by` and `sort_order` parameters

### Security Standards
- JWT token validation on protected routes
- Role-based access control enforcement
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- Audit logging for admin actions
- HTTPS enforcement in production

---

## 🚀 Next Steps

1. **Implement missing core routes** (Applications, Analytics)
2. **Enhance authentication** with proper role checking
3. **Add comprehensive error handling**
4. **Implement rate limiting and security measures**
5. **Add API documentation** (OpenAPI/Swagger)
6. **Create integration tests** for all endpoints
7. **Add monitoring and logging**

This comprehensive routes structure provides a solid foundation for the RecrutementPlus CRM platform with proper separation of concerns and scalability in mind.