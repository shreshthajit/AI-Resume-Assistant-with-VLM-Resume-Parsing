from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID

class ResumeUploadResponse(BaseModel):
    resume_id: UUID
    status: str

class ResumeStatus(BaseModel):
    status: str
    parsed_data: Optional[Any] = None

