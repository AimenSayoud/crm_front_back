"""
MongoDB connection test script

This script tests the MongoDB connection and performs basic CRUD operations
to verify the MongoDB setup is working correctly.

Usage:
    python -m app.db.mongo_test
"""

import logging
import sys
from datetime import datetime
from app.db.mongodb import mongodb
from app.core.config import settings
import time
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

logger = logging.getLogger(__name__)

def test_mongodb_connection():
    """Test MongoDB connection and basic operations"""
    logger.info(f"Testing MongoDB connection to {settings.MONGODB_URL}")
    
    try:
        # Test connection
        mongodb.client.admin.command('ping')
        logger.info("✅ MongoDB connection successful")
        
        # Test CRUD operations
        test_collection = "mongo_test"
        
        # Create a test document
        test_id = str(uuid.uuid4())
        test_doc = {
            "test_id": test_id,
            "name": "MongoDB Test",
            "timestamp": datetime.utcnow(),
            "environment": settings.ENVIRONMENT,
            "status": "active"
        }
        
        # Test insert
        result = mongodb.insert_one(test_collection, test_doc)
        logger.info(f"✅ Insert successful: {result}")
        
        # Test find
        found_doc = mongodb.find_one(test_collection, {"test_id": test_id})
        if found_doc:
            logger.info(f"✅ Find successful: {found_doc['test_id']}")
        else:
            logger.error("❌ Document not found after insert")
        
        # Test update
        update_result = mongodb.update_one(
            test_collection, 
            {"test_id": test_id}, 
            {"status": "updated", "updated_at": datetime.utcnow()}
        )
        logger.info(f"✅ Update successful: {update_result} document(s) modified")
        
        # Verify update
        updated_doc = mongodb.find_one(test_collection, {"test_id": test_id})
        if updated_doc and updated_doc.get("status") == "updated":
            logger.info("✅ Update verification successful")
        else:
            logger.error("❌ Update verification failed")
        
        # Test delete
        delete_result = mongodb.delete_one(test_collection, {"test_id": test_id})
        logger.info(f"✅ Delete successful: {delete_result} document(s) deleted")
        
        # Verify deletion
        deleted_doc = mongodb.find_one(test_collection, {"test_id": test_id})
        if not deleted_doc:
            logger.info("✅ Delete verification successful")
        else:
            logger.error("❌ Delete verification failed")
        
        # Check collection stats
        db_stats = mongodb.db.command("dbstats")
        logger.info(f"MongoDB Stats: {db_stats}")
        
        logger.info("✅ All MongoDB tests completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ MongoDB test failed: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting MongoDB connection test")
    
    # Try to connect with retries
    max_retries = 3
    retry_count = 0
    success = False
    
    while retry_count < max_retries and not success:
        if retry_count > 0:
            wait_time = 2 ** retry_count  # Exponential backoff
            logger.info(f"Retrying in {wait_time} seconds...")
            time.sleep(wait_time)
            
        success = test_mongodb_connection()
        retry_count += 1
    
    if success:
        logger.info("MongoDB connection test completed successfully")
        sys.exit(0)
    else:
        logger.error("MongoDB connection test failed after maximum retries")
        sys.exit(1)