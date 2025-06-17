# RecrutementPlus CRM FullStack

A comprehensive recruitment CRM system with AI-powered features for managing candidates, companies, jobs, and the recruitment process.

## Project Structure

The project is divided into three main components:

- **Backend (`rec_back/`)**: FastAPI-based API server with PostgreSQL database
- **Frontend (`rec_front/`)**: Next.js web application
- **Database (`postgres/`)**: PostgreSQL database with initialization scripts

## Features

- User authentication and role-based access control
- Candidate and company management
- Job posting and application tracking
- AI-powered CV analysis and job matching
- Email generation and messaging system
- Analytics and reporting
- Interview question generation
- Comprehensive search functionality

## Stack Overview

- **Frontend**: Next.js with React, TypeScript, Tailwind CSS, and Zustand for state management
- **Backend**: FastAPI with SQLAlchemy, Pydantic, and JWT authentication
- **Database**: PostgreSQL 14
- **AI Integration**: OpenAI API for candidate matching and resume analysis

## Local Development with Docker

### Prerequisites

- Docker and Docker Compose
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd RecrutementPlus_CRM_FullStack
   ```

2. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_key_here
   ```

3. Start the development environment:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

5. Development workflow:
   ```bash
   # View logs
   docker-compose logs -f

   # Rebuild a specific service
   docker-compose up -d --build backend

   # Stop all services
   docker-compose down
   ```

## Manual Development Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd rec_back
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (create a `.env` file or export them):
   ```
   DATABASE_URL=postgresql://postgres:123@localhost:5432/recruitment_plus
   SECRET_KEY=your_secret_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd rec_front
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

### Docker Deployment

See the Docker Compose file for local deployment. For production, consider:
- Using a reverse proxy like Nginx or Traefik
- Setting up proper SSL certificates
- Configuring database backups
- Setting up monitoring

### Kubernetes Deployment

For Kubernetes deployment:

1. Build and push the Docker images:
   ```bash
   # Build images
   docker build -t your-registry/recrutementplus-backend:latest -f backend/Dockerfile .
   docker build -t your-registry/recrutementplus-frontend:latest -f frontend/Dockerfile .
   docker build -t your-registry/recrutementplus-postgres:latest -f postgres/Dockerfile .
   
   # Push to registry
   docker push your-registry/recrutementplus-backend:latest
   docker push your-registry/recrutementplus-frontend:latest
   docker push your-registry/recrutementplus-postgres:latest
   ```

2. Update image references in the Kubernetes manifests

3. Apply the Kubernetes configurations:
   ```bash
   kubectl apply -k kubernetes/
   ```

See [deployment-plan.md](./deployment-plan.md) for detailed production deployment instructions.

## Architecture Overview

### Backend Architecture

The FastAPI backend follows a modular architecture:

- **API Layer (`app/api/`)**: Request handling and routing
- **Models (`app/models/`)**: Database ORM models
- **Schemas (`app/schemas/`)**: Pydantic schemas for validation
- **Services (`app/services/`)**: Business logic
- **CRUD (`app/crud/`)**: Database operations
- **Core (`app/core/`)**: Core configuration and utilities

### Frontend Architecture

The Next.js frontend is organized by:

- **Pages (`src/app/`)**: Next.js App Router pages
- **Components (`src/components/`)**: Reusable React components
- **Services (`src/services/`)**: API integration services
- **Store (`src/store/`)**: State management with Zustand
- **Types (`src/types/`)**: TypeScript type definitions
- **Hooks (`src/hooks/`)**: Custom React hooks
- **Utilities (`src/lib/`)**: Utility functions

## AI Features

The CRM integrates OpenAI for various AI-powered features:

- **CV Analysis**: Extract structured information from resumes
- **Job Matching**: Match candidates to suitable jobs
- **Email Generation**: Create personalized emails
- **Interview Questions**: Generate targeted interview questions
- **Job Descriptions**: Create comprehensive job descriptions
- **Candidate Feedback**: Generate constructive feedback for candidates

## Configuration

### Environment Variables

Key environment variables to configure:

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Security key for JWT token generation
- `OPENAI_API_KEY`: For AI features integration
- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL for frontend to connect

## Security Notes

- Production deployments should use proper secrets management
- Update default credentials in environment variables
- Implement TLS for secure communication
- Review the ingress configuration for production use