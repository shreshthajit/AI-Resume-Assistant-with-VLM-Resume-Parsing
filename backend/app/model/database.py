from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv


load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
print("Connecting to:", DATABASE_URL)

try:
    engine = create_engine(DATABASE_URL, echo=True)
    conn = engine.connect()
    print("✅ Connection successful.")
except Exception as e:
    print("❌ Connection failed:", e)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
