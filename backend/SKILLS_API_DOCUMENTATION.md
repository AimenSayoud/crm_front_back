# Skills API Documentation

This document provides comprehensive documentation for the Skills API endpoints, which offer skill management, analytics, and suggestions for the recruitment platform.

## Base URL
```
http://localhost:3000/api/v1/skills
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control
- **Admin/SuperAdmin**: Full access to all skills endpoints
- **Employer/Consultant**: Access to most analytics and suggestions
- **Candidate**: No direct access

---

## Skill Management

### GET /
Get skills with search, filters, and pagination.

**Access**: Admin, SuperAdmin, Employer, Consultant

**Query Parameters**:
- `query` (optional): Search term for skill name
- `category_id` (optional): Filter by category
- `is_active` (optional): Filter by active status
- `sort_by` (optional): Sort by field (default: name)
- `sort_order` (optional): asc or desc (default: asc)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Page size (default: 20)

**Response**:
```json
{
  "success": true,
  "message": "Skills retrieved successfully",
  "data": {
    "skills": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "JavaScript",
        "category_id": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Programming Languages"
        },
        "description": "A popular programming language"
      }
    ],
    "total": 1200
  }
}
```

### POST /
Create a new skill, optionally assigning it to a category.

**Access**: Admin, SuperAdmin

**Request Body**:
```json
{
  "skill": {
    "name": "TypeScript",
    "description": "A typed superset of JavaScript"
  },
  "category_name": "Programming Languages"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Skill created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "TypeScript",
    "category_id": "507f1f77bcf86cd799439012",
    "description": "A typed superset of JavaScript"
  }
}
```

### POST /category
Create a new skill category.

**Access**: Admin, SuperAdmin

**Request Body**:
```json
{
  "category": {
    "name": "Cloud Platforms",
    "description": "Cloud service providers"
  },
  "created_by": "507f1f77bcf86cd799439099"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Skill category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Cloud Platforms",
    "description": "Cloud service providers"
  }
}
```

### POST /merge
Merge duplicate skills into a primary skill.

**Access**: Admin, SuperAdmin

**Request Body**:
```json
{
  "primary_skill_id": "507f1f77bcf86cd799439011",
  "duplicate_skill_ids": ["507f1f77bcf86cd799439015", "507f1f77bcf86cd799439016"],
  "merged_by": "507f1f77bcf86cd799439099"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Skills merged successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "JavaScript"
  }
}
```

---

## Trending Skills

### GET /trending
Get trending skills based on recent job postings.

**Access**: Admin, SuperAdmin, Employer, Consultant

**Query Parameters**:
- `days` (optional): Number of days to look back (default: 30)
- `limit` (optional): Max number of skills (default: 20)

**Response**:
```json
[
  {
    "skill_id": "507f1f77bcf86cd799439011",
    "skill_name": "JavaScript",
    "category_id": "507f1f77bcf86cd799439012",
    "job_count": 45,
    "growth_percentage": 20.0,
    "trend": "rising"
  }
]
```

---

## Market Demand Analysis

### GET /market-demand/:skill_id
Get comprehensive market demand analysis for a skill.

**Access**: Admin, SuperAdmin, Employer, Consultant

**Response**:
```json
{
  "success": true,
  "message": "Skill market demand retrieved successfully",
  "data": {
    "skill": {
      "id": "507f1f77bcf86cd799439011",
      "name": "JavaScript",
      "category": "Programming Languages"
    },
    "demand": {
      "open_positions": 45,
      "available_candidates": 120,
      "supply_demand_ratio": 2.67,
      "market_status": "balanced"
    },
    "salary": {
      "average_min": 50000,
      "average_max": 80000,
      "average_range": 65000
    },
    "proficiency_distribution": {
      "Expert": 20,
      "Intermediate": 50
    },
    "related_skills": [
      {
        "skill_id": "507f1f77bcf86cd799439017",
        "skill_name": "TypeScript",
        "correlation_strength": 15
      }
    ],
    "growth_trend": [
      { "period": "2024-01", "demand": 12 },
      { "period": "2024-02", "demand": 15 }
    ]
  }
}
```

---

## Skill Gap Analysis

### GET /gap-analysis
Analyze skill gaps in the market or for a specific company/location.

**Access**: Admin, SuperAdmin, Employer, Consultant

**Query Parameters**:
- `company_id` (optional): Filter by company
- `location` (optional): Filter by location

**Response**:
```json
{
  "success": true,
  "message": "Skill gap analysis retrieved successfully",
  "data": {
    "total_skills_analyzed": 50,
    "skills_with_gaps": 10,
    "critical_gaps": [
      {
        "skill_id": "507f1f77bcf86cd799439011",
        "skill_name": "JavaScript",
        "demand": 45,
        "supply": 10,
        "gap": 35,
        "gap_percentage": 77.8,
        "severity": "critical"
      }
    ],
    "moderate_gaps": [],
    "low_gaps": [],
    "top_gaps": []
  }
}
```

---

## Skill Suggestions

### GET /suggest/:candidate_id
Suggest skills for a candidate based on their profile and market demand.

**Access**: Admin, SuperAdmin, Consultant

**Query Parameters**:
- `limit` (optional): Max number of suggestions (default: 10)

**Response**:
```json
{
  "success": true,
  "message": "Skill suggestions retrieved successfully",
  "data": [
    {
      "skill_id": "507f1f77bcf86cd799439017",
      "skill_name": "TypeScript",
      "reason": "Complements your current skills",
      "market_demand": 15,
      "relevance_score": 12.5,
      "learning_path": {
        "estimated_time": "2-3 months",
        "difficulty": "intermediate",
        "resources": [
          "Online courses available",
          "Practice projects recommended",
          "Certification options"
        ]
      }
    }
  ]
}
```

---

## Bulk Import

### POST /bulk-import
Bulk import skills with validation.

**Access**: Admin, SuperAdmin

**Request Body**:
```json
{
  "skills_data": [
    { "name": "Go", "description": "A compiled language" },
    { "name": "Kubernetes", "description": "Container orchestration" }
  ],
  "imported_by": "507f1f77bcf86cd799439099"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Bulk skill import completed",
  "data": {
    "imported": 2,
    "skipped": 0,
    "errors": [],
    "created_skills": ["Go", "Kubernetes"]
  }
}
```

---

## Category Management

### GET /categories
Get skill categories with search and pagination.

**Access**: Admin, SuperAdmin, Employer, Consultant

**Query Parameters**:
- `query` (optional): Search term
- `is_active` (optional): Filter by active status
- `skip` (optional): Offset
- `limit` (optional): Max number of categories (default: 50)

**Response**:
```json
{
  "success": true,
  "message": "Skill categories retrieved successfully",
  "data": {
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Programming Languages",
        "description": "Languages for programming"
      }
    ],
    "total": 10
  }
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common Error Codes
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

---

## Usage Guidelines

1. **Date Ranges**: Use ISO format (YYYY-MM-DDTHH:MM:SS) for date parameters
2. **Filtering**: Combine multiple filters for more specific analytics
3. **Bulk Import**: Large imports may take time to process
4. **Real-time Data**: Some metrics may have a 5-10 minute delay for real-time accuracy

---

## Support

For technical support or questions about the Skills API:
- Email: api-support@recruitmentplatform.com
- Documentation: https://docs.recruitmentplatform.com/skills
- Status Page: https://status.recruitmentplatform.com 