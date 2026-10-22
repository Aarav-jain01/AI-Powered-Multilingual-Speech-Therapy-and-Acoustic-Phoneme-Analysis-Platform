import datetime as dt
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base

engine = create_engine("sqlite:///./vocalis.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()

class PracticeSession(Base):
    __tablename__ = "practice_sessions"
    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, index=True)
    language = Column(String, index=True)
    target_text = Column(String)
    recognized_text = Column(String)
    duration_seconds = Column(Float)
    wer = Column(Float, nullable=True)
    cer = Column(Float, nullable=True)
    result_json = Column(Text)  # full analysis payload (no raw audio stored)

class UserPreference(Base):
    __tablename__ = "user_preferences"
    id = Column(String, primary_key=True, default="local")
    language = Column(String, default="en")
    retain_audio = Column(Boolean, default=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
