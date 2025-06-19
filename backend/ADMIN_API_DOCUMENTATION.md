# Admin API Documentation

This document describes the comprehensive admin functionality that has been imported from the Python `admin.py` service into the JavaScript backend.

## Overview

The admin system provides comprehensive administrative capabilities including:
- Admin user management
- System monitoring and statistics
- Audit logging
- Security breach handling
- Compliance reporting
- System configuration management
- Notification system

## Authentication

All admin endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Admin Management

### List All Admins
```
GET /api/v1/admin/admins
```

Returns all users with admin or superadmin roles.

### Create Admin
```
POST /api/v1/admin/admins
```

**Request Body:**
```json
{
  "user_id": "user_id_here",
  "admin_role": "user_admin",
  "department": "IT",
  "permissions": ["read_users", "write_users"],
  "admin_level": 2
}
```

### Get Admin by ID
```
GET /api/v1/admin/admins/:adminId
```

### Update Admin
```
PUT /api/v1/admin/admins/:adminId
```

### Delete Admin
```
DELETE /api/v1/admin/admins/:adminId
```

### Update Admin Permissions
```
PUT /api/v1/admin/admins/:adminId/permissions
```

**Request Body:**
```json
{
  "permissions": ["read_users", "write_users", "delete_users"],
  "restricted_actions": ["system_config_change"]
}
```

## System Monitoring

### Get System Statistics
```
GET /api/v1/admin/stats?start_date=2024-01-01&end_date=2024-01-31&admin_id=admin_id
```

Returns comprehensive system statistics including:
- Total actions
- Successful/failed actions
- Actions by type and admin
- Peak activity hours
- Critical actions
- Suspicious patterns

### Get Performance Metrics
```
GET /api/v1/admin/performance?time_range=30d
```

Returns system performance metrics:
- Response times
- Throughput
- Error rates
- System resources

### Get System Status
```
GET /api/v1/admin/status
```

Returns current system status:
- Operational status
- Active users count
- Active admins count
- Critical alerts

## Audit Logs

### Get Audit Logs
```
GET /api/v1/admin/audit-logs?start_date=2024-01-01&end_date=2024-01-31&admin_id=admin_id&action_type=user_created&status=success&limit=100
```

### Create Audit Log
```
POST /api/v1/admin/audit-logs
```

**Request Body:**
```json
{
  "action_type": "user_created",
  "resource_type": "user",
  "resource_id": "user_id",
  "status": "success",
  "metadata": {
    "additional_info": "User created via admin panel"
  }
}
```

## System Settings

### Get System Settings
```
GET /api/v1/admin/settings?category=security&is_public=false
```

### Update System Setting
```
PUT /api/v1/admin/settings/:config_key
```

**Request Body:**
```json
{
  "config_value": "new_value",
  "reason": "Security update"
}
```

### Get Setting by ID
```
GET /api/v1/admin/settings/:configId
```

## Notifications

### Get Admin Notifications
```
GET /api/v1/admin/notifications?is_read=false&notification_type=warning&priority=high&limit=50
```

### Create Notification
```
POST /api/v1/admin/notifications
```

**Request Body:**
```json
{
  "title": "System Alert",
  "message": "High CPU usage detected",
  "notification_type": "warning",
  "priority": "high"
}
```

### Mark Notification as Read
```
PUT /api/v1/admin/notifications/:notificationId/read
```

### Delete Notification
```
DELETE /api/v1/admin/notifications/:notificationId
```

## System Operations

### Create System Backup
```
POST /api/v1/admin/backup
```

**Request Body:**
```json
{
  "backup_type": "full",
  "include_logs": true,
  "compression": true
}
```

### Toggle Maintenance Mode
```
POST /api/v1/admin/maintenance
```

**Request Body:**
```json
{
  "enabled": true,
  "reason": "Scheduled maintenance"
}
```

## Security

### Handle Security Breach
```
POST /api/v1/admin/security-breach
```

**Request Body:**
```json
{
  "breach_type": "unauthorized_access",
  "affected_admin_id": "admin_id",
  "details": {
    "ip_address": "192.168.1.100",
    "description": "Multiple failed login attempts"
  }
}
```

**Breach Types:**
- `unauthorized_access` - Unauthorized access attempts
- `data_breach` - Data security breach
- `brute_force` - Brute force attack

## Compliance and Reporting

### Generate Compliance Report
```
POST /api/v1/admin/compliance-report
```

**Request Body:**
```json
{
  "report_type": "access_control",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

**Report Types:**
- `access_control` - Access control compliance
- `data_protection` - Data protection compliance
- `admin_activity` - Admin activity report

## Admin Dashboard

### Get Admin Dashboard
```
GET /api/v1/admin/dashboard
```

Returns comprehensive dashboard data:
- Admin profile information
- Permissions
- Statistics
- Recent activity
- System status
- Notifications
- Team members (for system admins)

### Get Team Members
```
GET /api/v1/admin/team-members
```

### Get Admin Statistics
```
GET /api/v1/admin/statistics
```

### Get Recent Activity
```
GET /api/v1/admin/recent-activity?limit=10
```

## Admin Actions

### Perform Admin Action
```
POST /api/v1/admin/actions
```

**Request Body:**
```json
{
  "action": "delete_user",
  "resource_type": "user",
  "resource_id": "user_id",
  "data": {
    "reason": "Account termination"
  }
}
```

**Available Actions:**
- `delete_user` - Delete user account
- `update_system_config` - Update system configuration
- `manage_admin` - Manage admin permissions
- `export_data` - Export system data

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "status": 200,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "status": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Permission System

The admin system uses a hierarchical permission system:

### Admin Levels
1. **Level 1**: Basic read access (users, jobs, applications)
2. **Level 2**: Write access (create/update users, jobs)
3. **Level 3**: Delete access and company management
4. **Level 4**: Admin management and audit logs
5. **Level 5**: System configuration and full access

### Permission Types
- `read_users` - Read user data
- `write_users` - Create/update users
- `delete_users` - Delete users
- `read_jobs` - Read job data
- `write_jobs` - Create/update jobs
- `delete_jobs` - Delete jobs
- `manage_applications` - Manage job applications
- `manage_companies` - Manage company data
- `view_analytics` - View system analytics
- `export_data` - Export system data
- `manage_admins` - Manage admin users
- `view_audit_logs` - View audit logs
- `system_config` - Modify system configuration
- `security_management` - Security operations
- `full_access` - Complete system access

## Security Features

### Audit Logging
All admin actions are logged with:
- Action type and resource
- Admin ID and timestamp
- IP address and user agent
- Success/failure status
- Error messages for failures

### Suspicious Pattern Detection
The system automatically detects:
- High failure rates
- Unusual hours activity
- Rapid actions (possible automation)
- Critical action patterns

### Security Breach Handling
Automatic responses to security incidents:
- Account suspension
- IP blocking
- Superadmin notifications
- Incident tracking

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Admin endpoints may be subject to rate limiting to prevent abuse. Check response headers for rate limit information.

## Environment Variables

Required environment variables:
- `ACCESS_TOKEN_SECRET` - JWT secret for token verification
- `LOG_LEVEL` - Logging level (ERROR, WARN, INFO, DEBUG)

## Database Models

The admin system uses the following MongoDB models:
- `User` - User accounts with roles
- `AdminProfile` - Admin-specific profile data
- `SuperAdminProfile` - Superadmin-specific data

## Future Enhancements

Planned features:
- Two-factor authentication for admins
- Advanced permission granularity
- Real-time system monitoring
- Automated compliance reporting
- Integration with external security tools 