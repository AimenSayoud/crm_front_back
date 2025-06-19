# Analytics API Documentation

This document provides comprehensive documentation for the Analytics API endpoints, which offer detailed insights and reporting capabilities for the recruitment platform.

## Base URL
```
http://localhost:3000/api/v1/analytics
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control
- **Admin/SuperAdmin**: Full access to all analytics
- **Employer**: Access to their company's data only
- **Consultant**: Access to their own data and assigned candidates
- **Candidate**: No analytics access

---

## Dashboard Overview

### GET /dashboard
Get comprehensive dashboard overview with key metrics.

**Access**: Admin, SuperAdmin

**Query Parameters**:
- `start_date` (optional): Start date in ISO format (YYYY-MM-DDTHH:MM:SS)
- `end_date` (optional): End date in ISO format (YYYY-MM-DDTHH:MM:SS)

**Response**:
```json
{
  "success": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "overview": {
      "total_users": 1250,
      "total_candidates": 850,
      "total_companies": 120,
      "total_jobs": 450,
      "total_applications": 2100
    },
    "active_metrics": {
      "active_jobs": 89,
      "new_applications": 156,
      "hired_count": 23,
      "application_growth_percent": 12.5
    },
    "conversion_rates": {
      "application_to_review": 85.2,
      "review_to_interview": 45.8,
      "interview_to_offer": 32.1,
      "offer_to_hire": 78.9
    },
    "period": {
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-31T23:59:59.999Z"
    }
  }
}
```

---

## Application Analytics

### GET /applications
Get detailed application analytics with filtering.

**Access**: Admin, SuperAdmin, Employer (own company), Consultant (own data)

**Query Parameters**:
- `company_id` (optional): Filter by company ID
- `job_id` (optional): Filter by job ID
- `consultant_id` (optional): Filter by consultant ID
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response**:
```json
{
  "success": true,
  "message": "Application analytics retrieved successfully",
  "data": {
    "total_applications": 156,
    "status_distribution": {
      "submitted": 45,
      "under_review": 32,
      "interviewed": 28,
      "offered": 15,
      "hired": 12,
      "rejected": 24
    },
    "conversion_rates": {
      "application_to_interview": 48.3,
      "interview_to_offer": 53.6,
      "offer_to_hire": 80.0
    },
    "time_metrics": {
      "average_time_to_hire_days": 18.5,
      "applications_this_month": 45
    },
    "monthly_trends": {
      "2024-01": 45,
      "2024-02": 52,
      "2024-03": 59
    },
    "source_analysis": {
      "website": 65,
      "job_board": 45,
      "referral": 23,
      "social_media": 23
    }
  }
}
```

---

## Job Analytics

### GET /jobs
Get job posting and performance analytics.

**Access**: Admin, SuperAdmin, Employer (own company), Consultant

**Query Parameters**:
- `company_id` (optional): Filter by company ID
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response**:
```json
{
  "success": true,
  "message": "Job analytics retrieved successfully",
  "data": {
    "total_jobs": 89,
    "status_distribution": {
      "open": 45,
      "closed": 23,
      "filled": 15,
      "draft": 6
    },
    "performance_metrics": {
      "average_applications_per_job": 12.3,
      "average_time_to_fill_days": 25.8,
      "fill_rate": 16.9
    },
    "top_performing_jobs": [
      {
        "job_id": "507f1f77bcf86cd799439011",
        "job_title": "Senior Software Engineer",
        "application_count": 45,
        "created_at": "2024-01-15T10:30:00.000Z",
        "status": "open"
      }
    ],
    "skills_in_demand": [
      {
        "skill": "JavaScript",
        "demand_count": 15
      },
      {
        "skill": "Python",
        "demand_count": 12
      }
    ],
    "monthly_job_postings": {
      "2024-01": 25,
      "2024-02": 32,
      "2024-03": 28
    }
  }
}
```

---

## Candidate Analytics

### GET /candidates
Get candidate pool and performance analytics.

**Access**: Admin, SuperAdmin, Consultant (own candidates)

**Query Parameters**:
- `consultant_id` (optional): Filter by consultant ID
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response**:
```json
{
  "success": true,
  "message": "Candidate analytics retrieved successfully",
  "data": {
    "total_candidates": 850,
    "profile_completion_rate": 78.5,
    "experience_distribution": {
      "0-2 years": 125,
      "3-5 years": 234,
      "6-10 years": 298,
      "10+ years": 193
    },
    "location_distribution": {
      "London": 234,
      "Manchester": 156,
      "Birmingham": 98,
      "Leeds": 87
    },
    "top_skills": [
      {
        "skill": "JavaScript",
        "candidate_count": 25
      },
      {
        "skill": "Python",
        "candidate_count": 20
      }
    ],
    "success_metrics": {
      "average_applications_per_candidate": 2.8,
      "average_success_rate": 15.6
    },
    "monthly_registrations": {
      "2024-01": 45,
      "2024-02": 52,
      "2024-03": 48
    }
  }
}
```

---

## Consultant Analytics

### GET /consultants
Get consultant performance analytics.

**Access**: Admin, SuperAdmin, Consultant (own data)

**Query Parameters**:
- `consultant_id` (optional): Filter by specific consultant
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response**:
```json
{
  "success": true,
  "message": "Consultant analytics retrieved successfully",
  "data": {
    "total_consultants": 15,
    "consultant_performance": [
      {
        "consultant_id": "507f1f77bcf86cd799439011",
        "consultant_name": "John Smith",
        "total_applications": 45,
        "hired_count": 12,
        "hire_rate": 26.7,
        "interview_rate": 53.3
      }
    ],
    "overall_metrics": {
      "total_applications": 234,
      "total_hired": 45,
      "average_hire_rate": 19.2
    }
  }
}
```

---

## Company Analytics

### GET /companies
Get company hiring and performance analytics.

**Access**: Admin, SuperAdmin, Employer (own company)

**Query Parameters**:
- `company_id` (optional): Filter by specific company
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response**:
```json
{
  "success": true,
  "message": "Company analytics retrieved successfully",
  "data": {
    "total_companies": 120,
    "company_performance": [
      {
        "company_id": "507f1f77bcf86cd799439011",
        "company_name": "TechCorp Ltd",
        "total_jobs": 15,
        "total_applications": 234,
        "hired_count": 23,
        "hire_rate": 9.8,
        "avg_applications_per_job": 15.6
      }
    ],
    "top_hiring_companies": [
      {
        "company_id": "507f1f77bcf86cd799439011",
        "company_name": "TechCorp Ltd",
        "total_jobs": 15,
        "total_applications": 234,
        "hired_count": 23,
        "hire_rate": 9.8,
        "avg_applications_per_job": 15.6
      }
    ]
  }
}
```

---

## Trend Analysis

### GET /trends
Get trend analysis for specified metrics.

**Access**: Admin, SuperAdmin

**Query Parameters**:
- `metric` (required): Metric to analyze (applications, jobs, hires, etc.)
- `period` (optional): Period for trend analysis (daily, weekly, monthly) - default: monthly
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response**:
```json
{
  "success": true,
  "message": "Trend analysis retrieved successfully",
  "data": {
    "metric_name": "applications",
    "period": "monthly",
    "trend_direction": "increasing",
    "growth_rate": 12.5,
    "data_points": [
      {
        "date": "2024-01",
        "value": 156,
        "metric_name": "applications"
      },
      {
        "date": "2024-02",
        "value": 175,
        "metric_name": "applications"
      }
    ]
  }
}
```

---

## Key Performance Indicators

### GET /kpis
Get key performance indicators for the platform.

**Access**: Admin, SuperAdmin

**Query Parameters**:
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response**:
```json
{
  "success": true,
  "message": "KPIs retrieved successfully",
  "data": {
    "kpis": {
      "time_to_hire": 18.5,
      "application_conversion_rate": 48.3,
      "job_fill_rate": 16.9,
      "candidate_satisfaction": 85.0,
      "employer_satisfaction": 87.5,
      "platform_growth_rate": 12.5,
      "revenue_per_hire": 2500.0,
      "consultant_efficiency": 75.0
    },
    "period": {
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-31T23:59:59.999Z"
    },
    "generated_at": "2024-01-31T12:00:00.000Z"
  }
}
```

---

## Custom Reports

### POST /custom-report
Generate a custom report based on specified parameters.

**Access**: Admin, SuperAdmin

**Request Body**:
```json
{
  "report_type": "application_performance",
  "filters": {
    "date_range": {
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-31T23:59:59.999Z"
    },
    "company_id": "507f1f77bcf86cd799439011"
  },
  "metrics": ["conversion_rates", "time_to_hire", "source_analysis"],
  "format": "json"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Custom report generation started",
  "data": {
    "report_id": "507f1f77bcf86cd799439011",
    "status": "generating",
    "estimated_completion": "2024-01-31T12:05:00.000Z",
    "download_url": "/api/v1/analytics/reports/507f1f77bcf86cd799439011"
  }
}
```

### GET /reports/:report_id
Get a previously generated report.

**Access**: Admin, SuperAdmin

**Response**:
```json
{
  "success": true,
  "message": "Generated report retrieved successfully",
  "data": {
    "report_id": "507f1f77bcf86cd799439011",
    "status": "completed",
    "generated_at": "2024-01-31T12:05:00.000Z",
    "data": {
      "summary": "Report data would be here",
      "charts": [],
      "tables": []
    }
  }
}
```

---

## Export Functionality

### POST /export
Export analytics data in specified format.

**Access**: Admin, SuperAdmin

**Request Body**:
```json
{
  "analytics_type": "application_analytics",
  "filters": {
    "date_range": {
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-31T23:59:59.999Z"
    }
  },
  "format": "csv",
  "include_charts": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Analytics export started",
  "data": {
    "export_id": "507f1f77bcf86cd799439011",
    "download_url": "/api/v1/analytics/exports/507f1f77bcf86cd799439011/download",
    "expires_at": "2024-02-01T12:00:00.000Z",
    "file_size_mb": 1.5
  }
}
```

### GET /exports/:export_id/download
Download exported analytics data.

**Access**: Admin, SuperAdmin

**Response**:
```json
{
  "success": true,
  "message": "Export download initiated",
  "data": {
    "message": "Download would start for export 507f1f77bcf86cd799439011",
    "export_id": "507f1f77bcf86cd799439011"
  }
}
```

---

## Industry Benchmarks

### GET /benchmarks
Get industry benchmark comparisons.

**Access**: Admin, SuperAdmin

**Query Parameters**:
- `industry` (optional): Industry to compare against
- `company_size` (optional): Company size category

**Response**:
```json
{
  "success": true,
  "message": "Industry benchmarks retrieved successfully",
  "data": {
    "industry": "technology",
    "company_size": "medium",
    "benchmarks": {
      "time_to_hire": {
        "your_value": 25.5,
        "industry_average": 23.2,
        "percentile_rank": 60
      },
      "cost_per_hire": {
        "your_value": 3200.0,
        "industry_average": 2850.0,
        "percentile_rank": 40
      },
      "application_conversion_rate": {
        "your_value": 12.5,
        "industry_average": 15.2,
        "percentile_rank": 35
      }
    },
    "generated_at": "2024-01-31T12:00:00.000Z"
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

## Rate Limiting

Analytics endpoints are subject to rate limiting:
- 100 requests per minute for authenticated users
- 1000 requests per hour for admin users

---

## Data Privacy

- All analytics data is anonymized where possible
- Personal information is only included when necessary for role-based access
- Data retention follows platform privacy policy
- Export functionality includes data anonymization options

---

## Usage Guidelines

1. **Date Ranges**: Use ISO format (YYYY-MM-DDTHH:MM:SS) for date parameters
2. **Filtering**: Combine multiple filters for more specific analytics
3. **Caching**: Analytics data is cached for 5 minutes to improve performance
4. **Export Limits**: Large exports may take time to generate
5. **Real-time Data**: Some metrics may have a 5-10 minute delay for real-time accuracy

---

## Support

For technical support or questions about the Analytics API:
- Email: api-support@recruitmentplatform.com
- Documentation: https://docs.recruitmentplatform.com/analytics
- Status Page: https://status.recruitmentplatform.com 