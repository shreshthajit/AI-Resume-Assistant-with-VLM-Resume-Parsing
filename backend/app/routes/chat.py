from fastapi import APIRouter, Depends, HTTPException
from app.model import models
from app.model.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage, ResumeChatSummary,ChatHistoryResponse
from app.services.openai_chat import generate_chat_response
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.auth import get_current_active_user
from app.model.models import User
from typing import List
from datetime import datetime

router = APIRouter()

@router.post("/completions", response_model=ChatResponse)
def chat_with_resume(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == data.resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume or resume.status != "done":
        raise HTTPException(status_code=404, detail="Resume not ready or not found.")

    user_msg = models.ChatHistory(
        resume_id=data.resume_id,
        user_id=current_user.id,
        message_type="user",
        content=data.user_message,
        created_at=datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    history = (
        db.query(models.ChatHistory)
        .filter(
            models.ChatHistory.resume_id == data.resume_id,
            models.ChatHistory.user_id == current_user.id
        )
        .order_by(models.ChatHistory.created_at)
        .all()
    )

    history_list = [{"message_type": c.message_type, "content": c.content} for c in history]

    reply = generate_chat_response(resume.parsed_data, history_list, data.user_message)

    assistant_msg = models.ChatHistory(
        resume_id=data.resume_id,
        user_id=current_user.id,
        message_type="assistant",
        content=reply,
        created_at=datetime.utcnow()
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(
        messages=[
            ChatMessage(message_type="user", content=data.user_message),
            ChatMessage(message_type="assistant", content=reply),
        ],
        resume_id=str(resume.id),
        resume_name=resume.filename
    )

@router.get("/resume-chats", response_model=List[ResumeChatSummary])
def get_user_resume_chats(

    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    subquery = (
        db.query(
            models.ChatHistory.resume_id,
            models.ChatHistory.created_at
        )
        .filter(models.ChatHistory.user_id == current_user.id)
        .order_by(models.ChatHistory.resume_id, models.ChatHistory.created_at.desc())
        .distinct(models.ChatHistory.resume_id)
        .subquery()
    )

    resume_chats = (
        db.query(
            models.Resume.id,
            models.Resume.filename,
            models.ChatHistory.content.label("last_message"),
            models.ChatHistory.created_at.label("last_message_at")
        )
        .join(models.ChatHistory, models.Resume.id == models.ChatHistory.resume_id)
        .join(subquery, 
            (models.ChatHistory.resume_id == subquery.c.resume_id) &
            (models.ChatHistory.created_at == subquery.c.created_at))
        .filter(models.Resume.user_id == current_user.id)
        .all()
    )

    return [
        ResumeChatSummary(
            resume_id=str(r.id),
            resume_name=r.filename,
            last_message=r.last_message,
            last_message_at=r.last_message_at
        )
        for r in resume_chats
    ]


@router.get("/history/{resume_id}", response_model=ChatHistoryResponse)
def get_chat_history(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    messages = (
        db.query(models.ChatHistory)
        .filter(
            models.ChatHistory.resume_id == resume_id,
            models.ChatHistory.user_id == current_user.id
        )
        .order_by(models.ChatHistory.created_at)
        .all()
    )

    return ChatHistoryResponse(
        resume_id=resume.id,
        resume_name=resume.filename,
        parsed_data=resume.parsed_data,
        messages=[
            ChatMessage(
                message_type=m.message_type,
                content=m.content
            )
            for m in messages
        ]
    )