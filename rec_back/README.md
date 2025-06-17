u# RecrutementPlus CRM API

## Table of Contents
- [RecrutementPlus CRM API](#recrutementplus-crm-api)
  - [Table of Contents](#table-of-contents)
  - [Installation Guide](#installation-guide)
    - [Prerequisites](#prerequisites)
    - [Setup Steps](#setup-steps)
  - [Core Architecture](#core-architecture)
    - [Design Philosophy](#design-philosophy)
    - [Project Structure](#project-structure)
  - [API Reference](#api-reference)
    - [AI Tools API](#ai-tools-api)

## Installation Guide

This guide will help you set up and run the RecrutementPlus CRM API on your local machine.

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- PostgreSQL database

### Setup Steps

1. **Navigate to project directory**
   ```bash
   cd recruitment_plus_backend
   ```

2. **Set Up a Virtual Environment**

   **Windows:**
   ```bash
   # Create a virtual environment
   python -m venv venv

   # Activate the virtual environment
   .\venv\Scripts\activate
   ```

   **Mac/Linux:**
   ```bash
   # Create a virtual environment
   python -m venv venv

   # Activate the virtual environment
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables (NOT FOR NOW)**
   ```
   # PostgreSQL Database
   POSTGRES_SERVER=localhost
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=recruitment_plus

   # JWT Secret
   SECRET_KEY=your_secret_key_here

   # OpenAI API Key (for AI features)
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Initialize the Database (NOT FOR NOW)**
   ```bash
   alembic upgrade head
   ```

6. **Launch the Server**
   ```bash
   # Development mode with auto-reload
   uvicorn app.main:app --reload

   # Production mode
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## Core Architecture

> **Note**: This architecture is designed for test AI features only.

### Design Philosophy

- **Modular Structure**: Clear separation of concerns between API endpoints, business logic, and data storage
- **Hybrid Approach**: JSON files for rapid development, with database-ready models
- **AI-First**: Integration of OpenAI for intelligent processing of recruitment data
- **Scalable Design**: Ability to grow from development to production environment

### Project Structure

```
recruitment_plus_backend/
├── app/
│   ├── api/v1/               # API endpoints
│   │   └── ai_tools.py       # AI functionality endpoints
│   ├── services/             # Business logic
│   │   └── ai_service.py     # AI processing service
│   ├── main.py               # FastAPI app initialization
├── fake_data/                # JSON data storage
│   ├── users.json            # User accounts
│   ├── candidate_profiles.json # Candidate information
│   ├── employer_profiles.json # Employer information
│   ├── jobs.json             # Job listings
│   ├── applications.json     # Job applications
│   ├── skills.json           # Skills catalog
│   ├── cv_samples.json       # Sample CVs for testing
│   └── email_templates.json  # Email templates
```

## API Reference

### AI Tools API

| Endpoint                                        | Method | Description                                                       |
| ----------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `/api/v1/ai-tools/analyze-cv`                   | POST   | Analyzes CV content and returns structured information            |
| `/api/v1/ai-tools/match-jobs`                   | POST   | Matches CV against available jobs                                 |
| `/api/v1/ai-tools/generate-email/{template_id}` | POST   | Generates personalized emails based on templates                  |
| `/api/v1/ai-tools/process-cv`                   | POST   | Combines analysis, matching, and email generation in one endpoint |
| `/api/v1/ai-tools/cv-samples`                   | GET    | Retrieves sample CVs for testing                                  |
| `/api/v1/ai-tools/cv-samples/{user_id}`         | GET    | Retrieves a specific CV sample by user ID                         |