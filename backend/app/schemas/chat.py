from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ChatRequest(BaseModel):
    resume_id: UUID
    user_message: str

class ChatMessage(BaseModel):
    message_type: str  
    content: str

class ChatResponse(BaseModel):
    messages: List[ChatMessage]
    resume_id: str
    resume_name: str

class ResumeChatSummary(BaseModel):
    resume_id: UUID
    resume_name: str
    last_message: str
    last_message_at: datetime

class ChatHistoryResponse(BaseModel):
    resume_id: UUID
    resume_name: str
    parsed_data: dict
    messages: List[ChatMessage]