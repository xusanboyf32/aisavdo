from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from utils import TimestampMixin



class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    orders = relationship("Order", back_populates="user")



class Product(Base, TimestampMixin):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    brand = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    ram = Column(String(20), nullable=True)
    storage = Column(String(20), nullable=True)
    color = Column(String(30), nullable=True)
    image_url = Column(String(255), nullable=True)
    image_data = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    orders = relationship("Order", back_populates="product")


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    client_first_name = Column(String(50), nullable=False)
    client_last_name = Column(String(50), nullable=False)
    client_phone = Column(String(20), nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(20), default="pending")

    user = relationship("User", back_populates="orders")
    product = relationship("Product", back_populates="orders")


class Settings(Base, TimestampMixin):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, default=1)
    telegram_chat_id = Column(String(255), nullable=True)
