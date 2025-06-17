# This file has been deprecated and replaced by the database-driven implementation in ai_tools_db.py
# The endpoints from ai_tools_db.py are now registered under the same route prefix (/api/v1/ai-tools)

from fastapi import APIRouter

# Create an empty router - all real endpoints are now in ai_tools_db.py
router = APIRouter()

# IMPORTANT: All the original endpoints have been removed from this file
# to avoid route conflicts with the database-driven implementation
# See ai_tools_db.py for the current implementation of all AI endpoints