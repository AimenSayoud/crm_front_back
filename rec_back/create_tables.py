#!/usr/bin/env python3
"""
Create all database tables using SQLAlchemy
"""
import sys
import os
import logging

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_all_tables():
    """Create all database tables"""
    try:
        # Set up logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        logger.info("Importing models and database configuration...")
        
        # Import the base model and engine
        from app.models.base import Base
        from app.db.session import engine
        
        # Import all models to ensure they are registered with SQLAlchemy
        # This is crucial for table creation
        from app.models import (
            user, candidate, company, job, application, 
            skill, consultant, admin, messaging
        )
        
        logger.info("Creating all tables...")
        
        # Create all tables
        Base.metadata.create_all(engine)
        
        logger.info("Tables created successfully!")
        
        # Verify the tables that were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        logger.info(f"Created {len(tables)} tables:")
        for table_name in sorted(tables):
            logger.info(f"  ✓ {table_name}")
            
        return True
        
    except ImportError as e:
        print(f"Import error: {e}")
        print("Make sure you're in the correct directory and dependencies are installed")
        return False
    except Exception as e:
        print(f"Error creating tables: {e}")
        logging.error("Full traceback:", exc_info=True)
        return False

if __name__ == "__main__":
    success = create_all_tables()
    if not success:
        sys.exit(1)