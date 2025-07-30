from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from app.routes import resume, chat, auth
from app.model.database import engine, Base
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

UNPROTECTED_PATHS = {
    "/auth/token",
    "/auth/register",
    "/docs",
    "/openapi.json",
    "/redoc"
}

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
       
        if request.method == "OPTIONS":
            return await call_next(request)
            
        path = request.url.path
        if path in UNPROTECTED_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing authorization token"},
                headers={"Access-Control-Allow-Origin": "http://localhost:3000"}
            )

        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise JWTError("Invalid scheme")
                
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            request.state.user_id = payload.get("sub")
            if not request.state.user_id:
                raise JWTError("Missing sub in payload")

        except (JWTError, ValueError) as e:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": f"Invalid token: {str(e)}"},
                headers={"Access-Control-Allow-Origin": "http://localhost:3000"}
            )

        return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.add_middleware(AuthMiddleware)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(resume.router, prefix="/resume", tags=["resume"])
app.include_router(chat.router, prefix="/v1/chat", tags=["chat"])