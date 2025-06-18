import logging
import os
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from beanie import init_beanie

from app.core.config import settings
from app.models.mongodb_models import *  # We'll create these models later

logger = logging.getLogger(__name__)

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect_to_database(cls):
        """Connect to MongoDB database."""
        try:
            # Set client with connection string from settings
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                maxPoolSize=settings.MONGODB_MAX_CONNECTIONS,
                minPoolSize=settings.MONGODB_MIN_CONNECTIONS,
                serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT,
                connectTimeoutMS=settings.MONGODB_CONNECT_TIMEOUT,
                socketTimeoutMS=settings.MONGODB_SOCKET_TIMEOUT,
                retryWrites=True,
                w='majority'
            )
            
            # Get database instance
            cls.db = cls.client[settings.MONGODB_DATABASE]
            
            # Verify the connection is working
            await cls.client.admin.command('ping')
            
            # Initialize ODM models
            await init_beanie(
                database=cls.db,
                document_models=[
                    UserDocument, 
                    CandidateDocument, 
                    JobDocument, 
                    ApplicationDocument, 
                    CompanyDocument,
                    SkillDocument,
                    MessageDocument,
                    ConversationDocument
                ]
            )
            
            logger.info(f"Connected to MongoDB at {settings.MONGODB_HOST}:{settings.MONGODB_PORT}")
            return cls.client, cls.db
            
        except ConnectionFailure as e:
            logger.error(f"Could not connect to MongoDB: {e}")
            raise
        except ServerSelectionTimeoutError as e:
            logger.error(f"MongoDB server selection timeout: {e}")
            raise
        except Exception as e:
            logger.error(f"MongoDB connection error: {e}")
            raise

    @classmethod
    async def close_database_connection(cls):
        """Close the MongoDB connection."""
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("Closed connection to MongoDB")

    @classmethod
    async def get_db(cls):
        """Get database instance."""
        if cls.db is None:
            await cls.connect_to_database()
        return cls.db

    @classmethod
    def get_collection(cls, collection_name: str):
        """Get a specific collection."""
        if cls.db is None:
            raise ConnectionError("Database not connected. Call connect_to_database first.")
        return cls.db[collection_name]

    @classmethod
    async def check_connection(cls):
        """Check if the database connection is alive."""
        try:
            if cls.client:
                await cls.client.admin.command('ping')
                return True
            return False
        except Exception:
            return False


mongodb = MongoDB()