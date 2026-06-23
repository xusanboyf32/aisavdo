from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Order, Product, User
from schemas import OrderCreate, OrderOut
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/orders", tags=["Orders"])

from routers.ai_router import send_telegram


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == payload.product_id,
        Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    if product.stock < 1:
        raise HTTPException(status_code=400, detail="Mahsulot omborda yo'q")

    order = Order(
        user_id=current_user.id,
        product_id=payload.product_id,
        client_first_name=payload.client_first_name,
        client_last_name=payload.client_last_name,
        client_phone=payload.client_phone,
        total_price=product.price,
        status="pending"
    )
    product.stock -= 1
    db.add(order)
    db.commit()
    db.refresh(order)

    tg_text = (
        f"🛒 <b>Yangi buyurtma #{order.id}</b>\n\n"
        f"👤 Mijoz: {current_user.first_name} {current_user.last_name}\n"
        f"📞 Telefon: {current_user.phone}\n"
        f"📱 Mahsulot: {product.brand} {product.name}\n"
        f"🎨 Rang: {product.color}\n"
        f"💾 RAM: {product.ram} | Xotira: {product.storage}\n"
        f"💰 Summa: {product.price:,.0f} so'm\n"
        f"📅 Sana: {order.created_at.strftime('%d.%m.%Y %H:%M')}"
    )
    print("TELEGRAM YUBORILMOQDA...")
    await send_telegram(tg_text, db)
    print("TELEGRAM YUBORILDI!")
    return order


@router.get("/", response_model=List[OrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    return orders


# ─── STATIC ROUTES (/{id} dan oldin) ───────────────
@router.get("/all")
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin huquqi yo'q")
    orders = db.query(Order).order_by(Order.id.desc()).all()
    result = []
    for o in orders:
        product = db.query(Product).filter(Product.id == o.product_id).first()
        result.append({
            "id": o.id,
            "client_first_name": o.client_first_name,
            "client_last_name": o.client_last_name,
            "client_phone": o.client_phone,
            "total_price": o.total_price,
            "status": o.status,
            "product_id": o.product_id,
            "product_name": f"{product.brand} {product.name}" if product else "—",
            "created_at": o.created_at,
            "updated_at": o.updated_at,
        })
    return result


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin huquqi yo'q")

    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    all_orders = db.query(Order).filter(Order.status != 'cancelled').all()
    daily_orders = [o for o in all_orders if o.created_at.date() == today]
    monthly_orders = [o for o in all_orders if o.created_at.date() >= month_start]

    return {
        "total_orders": len(all_orders),
        "daily_orders": len(daily_orders),
        "monthly_orders": len(monthly_orders),
        "daily_revenue": sum(o.total_price for o in daily_orders),
        "monthly_revenue": sum(o.total_price for o in monthly_orders),
        "total_revenue": sum(o.total_price for o in all_orders),
    }


# ─── DYNAMIC ROUTES (/{id} oxirida) ────────────────
@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    return order


@router.patch("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    if order.status != "pending":
        raise HTTPException(status_code=400, detail="Faqat 'pending' holatdagi buyurtmani bekor qilish mumkin")

    order.status = "cancelled"
    order.product.stock += 1
    db.commit()
    db.refresh(order)
    return order
