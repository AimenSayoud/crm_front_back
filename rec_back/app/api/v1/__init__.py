# Import all routers to be included in the API
# This file ensures the routers are available via the app.api.v1 namespace

# Placeholder for ai_tools (created dynamically in main.py if needed)
try:
    from . import ai_tools
except ImportError:
    pass

from . import candidates
from . import jobs
from . import users
from . import skills