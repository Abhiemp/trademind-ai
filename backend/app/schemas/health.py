from datetime import datetime
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    target_market: str
    timestamp: datetime
    database: str
    groq_configured: bool

