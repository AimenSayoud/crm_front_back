#!/usr/bin/env python3
"""
Database setup script for RecrutementPlus
"""
import logging
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def setup_database():
    """Setup and initialize the database"""
    try:
        # Import after adding to path
        from app.db.session import SessionLocal
        from app.db.init_db import init_db
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        logger = logging.getLogger(__name__)
        
        logger.info("Starting database setup...")
        
        # Create a database session
        db = SessionLocal()
        try:
            # Call init_db with the session
            init_db(db)
            logger.info("Database initialized successfully!")
            
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            logger.error("Full traceback:", exc_info=True)
            db.rollback()
            raise
            
        finally:
            # Always close the session
            db.close()
            
    except ImportError as e:
        print(f"Import error: {e}")
        print("Make sure you're in the correct directory and your virtual environment is activated")
        sys.exit(1)
    except Exception as e:
        print(f"Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_database()