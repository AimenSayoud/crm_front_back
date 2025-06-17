-- Initialize the recruitment_plus database
-- This script will run when the container starts for the first time

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to our database
\c recruitment_plus;

-- Add any additional initialization here if needed
-- This is just a placeholder. The actual database migrations are handled by Alembic.