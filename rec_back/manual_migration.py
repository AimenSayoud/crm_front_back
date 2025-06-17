#!/usr/bin/env python3
"""
Manual migration script to add missing columns to jobs table
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def run_manual_migration():
    """Add missing columns to jobs table"""
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # SQL statements to add missing columns
    sql_statements = [
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN NOT NULL DEFAULT false;",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits JSONB;",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_culture TEXT;",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requires_cover_letter BOOLEAN NOT NULL DEFAULT false;",
        "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS internal_notes TEXT;"
    ]
    
    try:
        with engine.connect() as conn:
            for sql in sql_statements:
                print(f"Executing: {sql}")
                conn.execute(text(sql))
                conn.commit()
            print("Migration completed successfully!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        engine.dispose()

if __name__ == "__main__":
    run_manual_migration()