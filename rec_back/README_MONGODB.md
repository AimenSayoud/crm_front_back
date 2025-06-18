# MongoDB Integration for RecrutementPlus CRM

This guide explains how to work with the MongoDB integration in the RecrutementPlus CRM system. The application now supports both PostgreSQL (for relational data) and MongoDB (for document-oriented data).

## Table of Contents

1. [Setup](#setup)
2. [Configuration](#configuration)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Testing](#testing)
6. [Migration](#migration)
7. [Best Practices](#best-practices)

## Setup

### Prerequisites

- MongoDB 5.0 or later
- Python 3.8 or later
- All required packages (see requirements.txt)

### Installation

1. Install MongoDB:
   - [MongoDB Installation Guide](https://docs.mongodb.com/manual/installation/)

2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure MongoDB connection (see [Configuration](#configuration))

## Configuration

MongoDB connection settings are defined in `app/core/config.py`. You can override these settings by defining the following environment variables:

```
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_USER=username
MONGODB_PASSWORD=password
MONGODB_DATABASE=recruitment_plus
MONGODB_AUTH_SOURCE=admin
```

For local development without authentication, you only need to set:
```
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=recruitment_plus
```

## Data Models

MongoDB models are defined in `app/models/mongodb_models.py` using the Beanie ODM (Object Document Mapper). Each model inherits from `BaseDocument` which provides common fields like `id`, `created_at`, `updated_at`, etc.

Example:
```python
from beanie import Document
from pydantic import Field

class SkillDocument(BaseDocument):
    """Skill document for MongoDB."""
    name: str
    category: Optional[str] = None
    description: Optional[str] = None

    class Settings:
        name = "skills"
        indexes = [
            "name",
            "category"
        ]
```

## API Endpoints

MongoDB-specific API endpoints are available under the `/api/v1/mongodb` prefix. These endpoints demonstrate the use of MongoDB for various operations.

Available endpoints:
- `GET /api/v1/mongodb/info`: Get MongoDB connection info
- `GET /api/v1/mongodb/skills`: Get skills from MongoDB
- `POST /api/v1/mongodb/skills`: Create a skill in MongoDB
- `GET /api/v1/mongodb/skills/{skill_id}`: Get a skill by ID
- `PUT /api/v1/mongodb/skills/{skill_id}`: Update a skill
- `DELETE /api/v1/mongodb/skills/{skill_id}`: Delete a skill (soft delete)

## Testing

To test the MongoDB integration:

1. Start the application:
   ```bash
   uvicorn app.main:app --reload
   ```

2. Check MongoDB connection status:
   ```bash
   curl http://localhost:8000/api/v1/mongodb/info
   ```

3. Test CRUD operations:
   ```bash
   # Create a skill
   curl -X POST http://localhost:8000/api/v1/mongodb/skills \
     -H "Content-Type: application/json" \
     -d '{"name": "MongoDB", "category": "Database", "description": "NoSQL document database"}'
   
   # Get all skills
   curl http://localhost:8000/api/v1/mongodb/skills
   
   # Get a specific skill
   curl http://localhost:8000/api/v1/mongodb/skills/{skill_id}
   ```

## Migration

### Migrating from PostgreSQL to MongoDB

The system supports both databases simultaneously. To migrate existing data from PostgreSQL to MongoDB:

1. **Export data from PostgreSQL**:
   ```python
   # Example script for exporting users
   from app.db.session import SessionLocal
   from app.models.user import User
   import json
   
   db = SessionLocal()
   users = db.query(User).all()
   
   user_list = []
   for user in users:
       user_dict = {
           "id": str(user.id),
           "email": user.email,
           "password_hash": user.password_hash,
           "first_name": user.first_name,
           "last_name": user.last_name,
           "role": user.role.value,
           "is_verified": user.is_verified,
           "phone": user.phone,
           "created_at": user.created_at.isoformat() if user.created_at else None,
           "updated_at": user.updated_at.isoformat() if user.updated_at else None,
       }
       user_list.append(user_dict)
   
   with open("exported_users.json", "w") as f:
       json.dump(user_list, f, indent=2)
   ```

2. **Import data into MongoDB**:
   ```python
   # Example script for importing users
   import json
   from app.models.mongodb_models import UserDocument
   from datetime import datetime
   from uuid import UUID
   import asyncio
   
   async def import_users():
       with open("exported_users.json", "r") as f:
           users_data = json.load(f)
       
       users = []
       for user in users_data:
           user_doc = UserDocument(
               id=UUID(user["id"]),
               email=user["email"],
               password_hash=user["password_hash"],
               first_name=user["first_name"],
               last_name=user["last_name"],
               role=user["role"],
               is_verified=user["is_verified"],
               phone=user["phone"],
               created_at=datetime.fromisoformat(user["created_at"]) if user["created_at"] else datetime.now(),
               updated_at=datetime.fromisoformat(user["updated_at"]) if user["updated_at"] else datetime.now(),
           )
           users.append(user_doc)
       
       await UserDocument.insert_many(users)
       print(f"Imported {len(users)} users")
   
   # Run the import
   asyncio.run(import_users())
   ```

3. **Test the MongoDB API endpoints** to ensure data was imported correctly

4. **Update your application code** to use MongoDB models instead of SQLAlchemy models

## Best Practices

1. **Data Modeling**:
   - Use embedded documents for closely related data that is always accessed together
   - Use references (using UUID fields) for separate collections that need to be queried independently
   - Denormalize data when it makes sense for your query patterns

2. **Indexes**:
   - Define appropriate indexes in the `Settings` class of each document
   - Analyze query patterns and create compound indexes where necessary

3. **Validation**:
   - Use Pydantic models to validate data before insertion
   - Define appropriate field types and constraints

4. **Error Handling**:
   - Always handle MongoDB connection errors
   - Use try/except blocks to catch and log database errors

5. **Transactions**:
   - MongoDB supports multi-document transactions since version 4.0
   - Use transactions when you need atomicity across multiple operations

6. **Connections**:
   - Reuse the MongoDB connection instance from the `mongodb` singleton
   - Avoid creating new connections for each request

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Check MongoDB is running: `systemctl status mongod` or `brew services list`
   - Verify connection settings in environment variables
   - Check network connectivity and firewall settings

2. **Authentication Failures**:
   - Verify username and password are correct
   - Check the authentication database (auth_source) is correct

3. **Performance Issues**:
   - Check for missing indexes on frequently queried fields
   - Monitor MongoDB performance using the MongoDB Compass tool
   - Review query patterns and adjust indexes accordingly

4. **Data Inconsistency**:
   - Ensure all writes use the same validation rules
   - Use transactions for multi-document operations
   - Add appropriate constraints and validation in Pydantic models

### Getting Help

- **Logs**: Check the application logs for detailed error messages
- **MongoDB Documentation**: [MongoDB Documentation](https://docs.mongodb.com/)
- **Beanie Documentation**: [Beanie ODM Documentation](https://roman-right.github.io/beanie/)
- **Motor Documentation**: [Motor Documentation](https://motor.readthedocs.io/)