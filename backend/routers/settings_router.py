from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Settings, User
from schemas import SettingsOut, SettingsUpdate
from auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])


def get_or_create_settings(db: Session) -> Settings:
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/", response_model=SettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin huquqi yo'q")
    return get_or_create_settings(db)


@router.put("/", response_model=SettingsOut)
def update_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin huquqi yo'q")
    settings = get_or_create_settings(db)
    if payload.telegram_chat_id is not None:
        settings.telegram_chat_id = payload.telegram_chat_id
    db.commit()
    db.refresh(settings)
    return settings
