#!/usr/bin/env python3
import logging
import sys
import os

# Add the current directory to Python path so 'app' module can be found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

try:
    print("Starting database initialization...")
    
    from app.db.session import SessionLocal
    from app.db.init_db import init_db
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Initialize database with default data
        init_db(db)
        print("✅ Database initialization completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
        
    finally:
        db.close()
        
except Exception as e:
    print(f"❌ Setup failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
