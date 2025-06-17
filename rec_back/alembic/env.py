# At the top after imports
import os
import sys
from pathlib import Path

# Add the project root to Python path
parent_dir = Path(__file__).resolve().parents[1]
sys.path.append(str(parent_dir))

# Import the correct Base class that your models inherit from
from app.models.base import Base  # This should be the actual base your models use

# Import all model modules to ensure they're registered
from app.models import user, candidate, company, job, application, skill, consultant, admin, messaging

# Debug print to see what tables are detected
print(f"Detected tables: {list(Base.metadata.tables.keys())}")

# Set metadata target for Alembic
target_metadata = Base.metadata