from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


# ─── AUTH ───────────────────────────────────────────
class UserRegister(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    phone: str

    @field_validator("username")
    @classmethod
    def username_min_length(cls, v):
        if len(v) < 4:
            raise ValueError("Username kamida 4 ta belgi bo'lishi kerak")
        if len(v) > 30:
            raise ValueError("Username 10 ta belgidan oshmasligi kerak")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 4:
            raise ValueError("Parol kamida 4 ta belgi bo'lishi kerak")
        if len(v) > 30:
            raise ValueError("Parol 10 ta belgidan oshmasligi kerak")
        return v

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v):
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.startswith("+"):
            raise ValueError("Telefon raqam + bilan boshlanishi kerak, masalan: +998901234567")
        if len(cleaned) < 10:
            raise ValueError("Telefon raqam noto'g'ri")
        return cleaned


class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    phone: str
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# ─── PRODUCT ────────────────────────────────────────
class ProductOut(BaseModel):
    id: int
    name: str
    brand: str
    price: float
    ram: Optional[str]
    storage: Optional[str]
    color: Optional[str]
    image_url: Optional[str]
    image_data: Optional[str]
    description: Optional[str]
    stock: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



# ─── ORDER ──────────────────────────────────────────
class OrderCreate(BaseModel):
    product_id: int
    client_first_name: str
    client_last_name: str
    client_phone: str



class OrderOut(BaseModel):
    id: int
    client_first_name: str
    client_last_name: str
    client_phone: str
    total_price: float
    status: str
    product_id: int
    product_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



# ─── AI CHAT ────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class SettingsOut(BaseModel):
    id: int
    telegram_chat_id: Optional[str]

    class Config:
        from_attributes = True

class SettingsUpdate(BaseModel):
    telegram_chat_id: Optional[str] = None
    