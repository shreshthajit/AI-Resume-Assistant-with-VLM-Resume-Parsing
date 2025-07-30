from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, Request, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.model import models
from app.model.database import get_db, SessionLocal
from app.services import vlm
from app.schemas import resume as schemas
from fastapi.responses import StreamingResponse
import json
import asyncio
from uuid import UUID
from app.core.auth import verify_token
import datetime 
from jose import JWTError


router = APIRouter()

@router.post("/upload", response_model=schemas.ResumeUploadResponse)
async def upload_resume(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not hasattr(request.state, 'user_id'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - Missing token"
        )
    
    try:
        user_id = UUID(request.state.user_id)
        
        db_resume = models.Resume(
            filename=file.filename,
            status="processing",
            user_id=user_id
        )
        db.add(db_resume)
        db.commit()
        db.refresh(db_resume)

        contents = await file.read()

        def parse_and_store(resume_id: UUID, contents: bytes, filename: str):
            try:
                task_id = vlm.upload_resume_to_vlm(contents, filename)
                parsed = vlm.poll_parsing_result(task_id)

                if parsed:
                    db_session = SessionLocal()
                    try:
                        resume = db_session.query(models.Resume).get(resume_id)
                        if resume:
                            resume.status = "done"
                            resume.parsed_data = parsed
                            db_session.commit()
                    finally:
                        db_session.close()
            except Exception as e:
                print(f"Error processing resume: {e}")

        background_tasks.add_task(parse_and_store, db_resume.id, contents, file.filename)

        return schemas.ResumeUploadResponse(
            resume_id=str(db_resume.id),
            status="processing"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing request: {str(e)}"
        )

@router.get("/status/{resume_id}", response_model=schemas.ResumeStatus)
def get_resume_status(
    request: Request,
    resume_id: UUID,
    db: Session = Depends(get_db)
):
    if not hasattr(request.state, 'user_id'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - Missing token"
        )
    
    try:
        user_id = UUID(request.state.user_id)
        resume = db.query(models.Resume).filter(
            models.Resume.id == resume_id,
            models.Resume.user_id == user_id
        ).first()
        
        if not resume:
            return schemas.ResumeStatus(status="not_found")

        return schemas.ResumeStatus(
            status=resume.status,
            parsed_data=resume.parsed_data if resume.status == "done" else None
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing request: {str(e)}"
        )





@router.get("/stream/{resume_id}")
async def stream_resume_status(
    request: Request,
    resume_id: UUID,
    token: str = Query(..., description="JWT token for authentication"),
    db: Session = Depends(get_db)
):
    try:
        payload = verify_token(token)
        user_id = UUID(payload["sub"])
        
        resume = db.query(models.Resume).filter(
            models.Resume.id == resume_id,
            models.Resume.user_id == user_id
        ).first()
        
        if not resume:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found or access denied"
            )

        async def event_generator():
            last_status = None
            try:
                while True:
                    db.refresh(resume)
                    
                    if resume.status != last_status:
                        event_data = {
                            "status": resume.status,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        
                        if resume.status == "done":
                            event_data["resume_id"] = str(resume.id)
                            yield f"data: {json.dumps(event_data)}\n\n"
                            break
                        elif resume.status == "error":
                            event_data["error"] = resume.error_message or "Processing error"
                            yield f"data: {json.dumps(event_data)}\n\n"
                            break
                        
                        yield f"data: {json.dumps(event_data)}\n\n"
                        last_status = resume.status
                    
                    await asyncio.sleep(1)
                    
            except GeneratorExit:
                pass
            except Exception as e:
                print(f"SSE generator error: {e}")

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no" 
            }
        )

    except HTTPException:
        raise
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )