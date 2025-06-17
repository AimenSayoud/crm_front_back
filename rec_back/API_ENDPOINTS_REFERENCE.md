# RecrutementPlus CRM API Endpoints Reference

This document provides a comprehensive reference of all available API endpoints in the RecrutementPlus CRM backend, organized by domain.

## Authentication

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/auth/login` | POST | Authenticate user and get token | `{"email": "string", "password": "string"}` | `{"access_token": "string", "refresh_token": "string", "token_type": "string"}` |
| `/api/v1/auth/refresh` | POST | Refresh access token | `{"refresh_token": "string"}` | `{"access_token": "string", "refresh_token": "string", "token_type": "string"}` |
| `/api/v1/auth/me` | GET | Get current user profile | None | User object |

## Users

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/users/` | GET | Get all users (paginated) | None | `{"items": [User], "total": int, "page": int, "size": int}` |
| `/api/v1/users/{user_id}` | GET | Get user by ID | None | User object |
| `/api/v1/users/` | POST | Create new user | User create schema | User object |
| `/api/v1/users/{user_id}` | PUT | Update user | User update schema | User object |
| `/api/v1/users/{user_id}` | DELETE | Delete user | None | `{"success": true}` |
| `/api/v1/users/me` | GET | Get current user | None | User object |
| `/api/v1/users/me` | PUT | Update current user | User update schema | User object |

## Candidates

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/candidates/` | GET | Get all candidates (paginated) | None | `{"items": [Candidate], "total": int, "page": int, "size": int}` |
| `/api/v1/candidates/{candidate_id}` | GET | Get candidate by ID | None | Candidate object |
| `/api/v1/candidates/` | POST | Create new candidate | Candidate create schema | Candidate object |
| `/api/v1/candidates/{candidate_id}` | PUT | Update candidate | Candidate update schema | Candidate object |
| `/api/v1/candidates/{candidate_id}` | DELETE | Delete candidate | None | `{"success": true}` |
| `/api/v1/candidates/{candidate_id}/upload-cv` | POST | Upload CV document | FormData with file | `{"success": true, "file_path": "string"}` |
| `/api/v1/candidates/{candidate_id}/profile` | GET | Get candidate profile | None | CandidateProfile object |
| `/api/v1/candidates/{candidate_id}/profile` | PUT | Update candidate profile | CandidateProfile update schema | CandidateProfile object |
| `/api/v1/candidates/search` | POST | Search candidates | `{"query": "string", "filters": {}}` | `{"items": [Candidate], "total": int}` |

## Companies

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/companies/` | GET | Get all companies (paginated) | None | `{"items": [Company], "total": int, "page": int, "size": int}` |
| `/api/v1/companies/{company_id}` | GET | Get company by ID | None | Company object |
| `/api/v1/companies/` | POST | Create new company | Company create schema | Company object |
| `/api/v1/companies/{company_id}` | PUT | Update company | Company update schema | Company object |
| `/api/v1/companies/{company_id}` | DELETE | Delete company | None | `{"success": true}` |
| `/api/v1/companies/{company_id}/profile` | GET | Get company profile | None | CompanyProfile object |
| `/api/v1/companies/{company_id}/profile` | PUT | Update company profile | CompanyProfile update schema | CompanyProfile object |
| `/api/v1/companies/search` | POST | Search companies | `{"query": "string", "filters": {}}` | `{"items": [Company], "total": int}` |

## Jobs

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/jobs/` | GET | Get all jobs (paginated) | None | `{"items": [Job], "total": int, "page": int, "size": int}` |
| `/api/v1/jobs/{job_id}` | GET | Get job by ID | None | Job object |
| `/api/v1/jobs/` | POST | Create new job | Job create schema | Job object |
| `/api/v1/jobs/{job_id}` | PUT | Update job | Job update schema | Job object |
| `/api/v1/jobs/{job_id}` | DELETE | Delete job | None | `{"success": true}` |
| `/api/v1/jobs/company/{company_id}` | GET | Get jobs by company ID | None | `{"items": [Job], "total": int}` |
| `/api/v1/jobs/search` | POST | Search jobs | `{"query": "string", "filters": {}}` | `{"items": [Job], "total": int}` |
| `/api/v1/jobs/{job_id}/skills` | GET | Get skills required for job | None | `[Skill]` |
| `/api/v1/jobs/{job_id}/skills` | POST | Update skills required for job | `[{"skill_id": "string", "level": int}]` | `[Skill]` |

## Applications

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/applications/` | GET | Get all applications (paginated) | None | `{"items": [Application], "total": int, "page": int, "size": int}` |
| `/api/v1/applications/{application_id}` | GET | Get application by ID | None | Application object |
| `/api/v1/applications/` | POST | Create new application | Application create schema | Application object |
| `/api/v1/applications/{application_id}` | PUT | Update application | Application update schema | Application object |
| `/api/v1/applications/{application_id}/status` | PUT | Update application status | `{"status": "string", "notes": "string"}` | Application object |
| `/api/v1/applications/candidate/{candidate_id}` | GET | Get applications by candidate | None | `[Application]` |
| `/api/v1/applications/job/{job_id}` | GET | Get applications by job | None | `[Application]` |

## Skills

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/skills/` | GET | Get all skills | None | `[Skill]` |
| `/api/v1/skills/{skill_id}` | GET | Get skill by ID | None | Skill object |
| `/api/v1/skills/` | POST | Create new skill | Skill create schema | Skill object |
| `/api/v1/skills/{skill_id}` | PUT | Update skill | Skill update schema | Skill object |
| `/api/v1/skills/{skill_id}` | DELETE | Delete skill | None | `{"success": true}` |
| `/api/v1/skills/search` | GET | Search skills | `q` query parameter | `[Skill]` |
| `/api/v1/skills/category/{category}` | GET | Get skills by category | None | `[Skill]` |

## Messaging

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/messaging/conversations` | GET | Get user's conversations | None | `[Conversation]` |
| `/api/v1/messaging/conversations/{conversation_id}` | GET | Get conversation by ID | None | Conversation with messages |
| `/api/v1/messaging/conversations` | POST | Create new conversation | Conversation create schema | Conversation object |
| `/api/v1/messaging/conversations/{conversation_id}/messages` | GET | Get messages in conversation | None | `[Message]` |
| `/api/v1/messaging/conversations/{conversation_id}/messages` | POST | Send message to conversation | Message create schema | Message object |
| `/api/v1/messaging/messages/{message_id}/read` | PUT | Mark message as read | None | `{"success": true}` |
| `/api/v1/messaging/conversations/search` | POST | Search conversations | `{"query": "string"}` | `[Conversation]` |

## AI Tools

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/ai/analyze-cv` | POST | Analyze CV text | `{"cv_text": "string", "job_id": "string?"}` | CV Analysis object |
| `/api/v1/ai/match-jobs` | POST | Match candidate to jobs | `{"candidate_id": "string", "limit": int?}` | `[JobMatch]` |
| `/api/v1/ai/generate-questions` | POST | Generate interview questions | `{"job_id": "string", "candidate_id": "string?"}` | `{"questions": [string]}` |
| `/api/v1/ai/generate-email` | POST | Generate email from template | `{"template_id": "string", "context": {}}` | `{"subject": "string", "body": "string"}` |
| `/api/v1/ai/chat-completion` | POST | General AI assistant | `{"messages": [{"role": "string", "content": "string"}], "context": {}}` | `{"response": "string"}` |

## Analytics

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/analytics/dashboard` | GET | Get dashboard analytics | None | Dashboard analytics object |
| `/api/v1/analytics/recruitment-funnel` | GET | Get recruitment funnel data | None | Recruitment funnel object |
| `/api/v1/analytics/candidate-sources` | GET | Get candidate source data | None | Candidate sources object |
| `/api/v1/analytics/job-performance` | GET | Get job performance data | None | Job performance object |
| `/api/v1/analytics/team-performance` | GET | Get team performance data | None | Team performance object |
| `/api/v1/analytics/custom-report` | POST | Generate custom report | Report configuration | Report data object |

## Admin

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/admin/users` | GET | Get all users (admin only) | None | `[User]` |
| `/api/v1/admin/users/{user_id}/role` | PUT | Update user role | `{"role": "string"}` | User object |
| `/api/v1/admin/system-settings` | GET | Get system settings | None | Settings object |
| `/api/v1/admin/system-settings` | PUT | Update system settings | Settings update schema | Settings object |
| `/api/v1/admin/email-templates` | GET | Get email templates | None | `[EmailTemplate]` |
| `/api/v1/admin/email-templates/{template_id}` | GET | Get email template | None | EmailTemplate object |
| `/api/v1/admin/email-templates` | POST | Create email template | EmailTemplate create schema | EmailTemplate object |
| `/api/v1/admin/email-templates/{template_id}` | PUT | Update email template | EmailTemplate update schema | EmailTemplate object |

## Consultants

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/consultants/` | GET | Get all consultants | None | `[Consultant]` |
| `/api/v1/consultants/{consultant_id}` | GET | Get consultant by ID | None | Consultant object |
| `/api/v1/consultants/` | POST | Create new consultant | Consultant create schema | Consultant object |
| `/api/v1/consultants/{consultant_id}` | PUT | Update consultant | Consultant update schema | Consultant object |
| `/api/v1/consultants/{consultant_id}/assignments` | GET | Get consultant assignments | None | `[Assignment]` |
| `/api/v1/consultants/{consultant_id}/performance` | GET | Get consultant performance | None | Performance metrics object |

## Search

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/v1/search/global` | POST | Global search across entities | `{"query": "string", "types": ["candidate", "job", "company"]}` | `{"candidates": [], "jobs": [], "companies": []}` |
| `/api/v1/search/candidates` | POST | Advanced candidate search | Complex filter object | `{"items": [Candidate], "total": int}` |
| `/api/v1/search/jobs` | POST | Advanced job search | Complex filter object | `{"items": [Job], "total": int}` |
| `/api/v1/search/companies` | POST | Advanced company search | Complex filter object | `{"items": [Company], "total": int}` |

## Request/Response Formats

### Common Response Format

Most endpoints return data in the following format:

```json
{
  "success": true,
  "data": { ... },
  "errors": null,
  "meta": { 
    "pagination": {
      "page": 1,
      "size": 10,
      "total": 100
    }
  }
}
```

### Error Response Format

Error responses follow this format:

```json
{
  "success": false,
  "data": null,
  "errors": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "meta": null
}
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Pagination

Paginated endpoints accept the following query parameters:

- `page`: Page number (default: 1)
- `size`: Items per page (default: 10, max: 100)

## Filtering and Sorting

Many list endpoints support filtering and sorting via query parameters:

- `sort`: Field to sort by (prefix with `-` for descending order)
- `filter_field`: Filter by field value

Example: `/api/v1/candidates?sort=-created_at&status=active`