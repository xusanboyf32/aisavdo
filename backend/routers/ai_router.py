from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from groq import Groq
import httpx
import json
import os
import re
from dotenv import load_dotenv
from database import get_db
from models import Product, Order, User, Settings
from schemas import ChatRequest
from auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["AI"])
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ─── TELEGRAM ───────────────────────────────────────
async def send_telegram(message: str, db: Session):
    settings = db.query(Settings).first()
    chat_id = settings.telegram_chat_id if settings and settings.telegram_chat_id else os.getenv("TELEGRAM_CHAT_ID")
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    print(f"TELEGRAM TOKEN: {token}")
    print(f"TELEGRAM CHAT_ID: {chat_id}")
    if not token or not chat_id:
        print("TOKEN YOKI CHAT_ID YO'Q!")
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json={"chat_id": chat_id, "text": message, "parse_mode": "HTML"})
            print(f"TELEGRAM RESPONSE: {resp.status_code} — {resp.text}")
        except Exception as e:
            print(f"TELEGRAM XATO: {e}")
    print("TELEGRAM YUBORILDI!")


# ─── RAG: Aqlli filtr ───────────────────────────────
def extract_price_from_text(text: str):
    text = text.lower().replace(" ", "")
    patterns = [
        r'(\d+)\s*million', r'(\d+)\s*mln',
        r'(\d+[\d,]*)\s*som', r'(\d+[\d,]*)\s*so\'m',
        r'(\d{4,})',
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            num = int(m.replace(",", "").replace(".", ""))
            if "million" in text or "mln" in text:
                if num < 100:
                    num = num * 1_000_000
            if num >= 500_000:
                return num
    return None


def fetch_available_products(db: Session, max_price=None, brand=None) -> list:
    query = db.query(Product).filter(
        Product.is_active == True,
        Product.stock > 0
    )
    if max_price:
        # Narx atrofida ±20% ham ko'rsat
        query = query.filter(Product.price <= max_price * 1.2)
    if brand:
        query = query.filter(Product.brand.ilike(f"%{brand}%"))
    return query.order_by(Product.price).all()


def build_products_context(products: list) -> str:
    if not products:
        return "Hozirda omborda hech qanday mahsulot mavjud emas."
    lines = []
    for p in products:
        lines.append(
            f"[ID:{p.id}] {p.brand} {p.name} | "
            f"Narx: {p.price:,.0f} so'm | "
            f"RAM: {p.ram} | Xotira: {p.storage} | "
            f"Rang: {p.color} | Omborda: {p.stock} ta"
        )
    return "\n".join(lines)


# ─── KUCHLI SYSTEM PROMPT ───────────────────────────
def build_system_prompt(products_context: str, user: User) -> str:
    prompt = "Sen 'AiSavdo' do'konining aqlli va jonli savdo konsultantisan. Ismingiz Amal.\n"
    prompt += "O'zbek tilida samimiy, qiziqarli va do'stona gaplash. Quruq ma'lumot emas — jonli suhbat qil!\n\n"

    prompt += f"MIJOZ:\n"
    prompt += f"- Ism: {user.first_name} {user.last_name}\n"
    prompt += f"- Telefon: {user.phone}\n\n"

    prompt += f"HOZIR OMBORDA BOR TELEFONLAR (FAQAT SHULARNI TAVSIYA QIL, BOSHQASINI EMAS):\n"
    prompt += f"{products_context}\n\n"

    prompt += "═══════════════════════════════\n"
    prompt += "QANDAY ISHLAYSAN:\n"
    prompt += "═══════════════════════════════\n\n"

    prompt += "1. ODDIY SUHBAT — faqat matn:\n"
    prompt += "   Jonli, qiziqarli gapir. Masalan:\n"
    prompt += "   'Voy, zo'r tanlov! Bu telefon bugungi yoshlar orasida juda ommabop'\n"
    prompt += "   'iPhone 15 — bu shunchaki telefon emas, bu turmush tarzi 😄'\n\n"

    prompt += "2. TUGMALAR — tanlov kerak bo'lganda:\n"
    prompt += '   FAQAT JSON: {"type":"buttons","content":"Matn","buttons":[{"label":"Ko\'rinadigan","value":"AI ga yuboriladigan"}]}\n\n'

    prompt += "3. MAHSULOT TAVSIYASI — eng ko'pi 3 ta tavsiya qil:\n"
    prompt += "   - Agar bazada 1 ta mos bo'lsa — 1 ta\n"
    prompt += "   - Agar 2 ta bo'lsa — 2 ta\n"
    prompt += "   - Agar 3 va undan ko'p bo'lsa — eng yaxshi 3 tasini\n"
    prompt += "   - Stock 0 bo'lgan mahsulotni HECH QACHON ko'rsatma\n"
    prompt += '   FAQAT JSON: {"type":"products","content":"Qiziqarli tavsif matni","products":[{"id":1,"brand":"Samsung","name":"A55","price":4500000,"ram":"8GB","storage":"128GB","color":"Qora","message":"Bu telefon haqida qiziqarli gap"}]}\n\n'

    prompt += "4. BUYURTMA TASDIQLASH:\n"
    prompt += '   FAQAT JSON: {"type":"confirm_order","content":"Tasdiqlaysizmi?","product_id":1,"product_name":"Samsung A55","price":4500000}\n\n'

    prompt += "5. BUYURTMA QABUL — faqat mijoz HA deganda:\n"
    prompt += '   FAQAT JSON: {"type":"order","product_id":1,"content":"Ajoyib tanlov! Buyurtmangiz qabul qilindi ✅"}\n\n'

    prompt += "═══════════════════════════════\n"
    prompt += "AQLLI TAVSIYA QOIDALARI:\n"
    prompt += "═══════════════════════════════\n"
    prompt += "- Mijoz narx aytsa — o'sha narx ATROFIDAGI (±20%) telefonlarni tavsiya qil\n"
    prompt += "- Mijoz 'arzonroq' desa — ro'yxatdagi eng arzon variantni ko'rsat\n"
    prompt += "- Mijoz 'boshqa variant' desa — oldin ko'rsatmaganning ichidan tanlat\n"
    prompt += "- Mijoz rang aytsa — o'sha rangdagi yoki o'xshash rangdagi telefon top\n"
    prompt += "- iPhone tavsiya qilsang — 'bugungi ommabop', 'ekotizim' haqida ayt\n"
    prompt += "- Samsung tavsiya qilsang — 'Android erkinligi', 'kamera sifati' haqida ayt\n"
    prompt += "- Xiaomi tavsiya qilsang — 'narx-sifat nisbati', 'tez zaryadlash' haqida ayt\n"
    prompt += "- Har bir tavsiyaga QISQA va QIZIQARLI 'message' yoz — quruq emas!\n"
    prompt += "- Mijoz bilan do'stona bo'l, gohida emoji ishlataver 😊\n"
    prompt += "- Agar mos mahsulot topilmasa — halol ayt va yaqin variantni taklif qil\n\n"

    prompt += "═══════════════════════════════\n"
    prompt += "TEXNIK QOIDALAR:\n"
    prompt += "═══════════════════════════════\n"
    prompt += "- JSON qaytarmoqchi bo'lsang — FAQAT JSON, oldida/keyin hech narsa yozma\n"
    prompt += "- Matn qaytarmoqchi bo'lsang — JSON yozma\n"
    prompt += "- confirm_order ni HECH QACHON ikki marta qaytarma\n"
    prompt += "- Mijoz 'ha' desa va oldingi xabar confirm_order bo'lsa — order JSON qaytar\n"
    prompt += "- Mijozni ismi bilan chaqir\n"

    return prompt


# ─── MAIN CHAT ENDPOINT ─────────────────────────────
@router.post("/chat")
async def ai_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Oxirgi user xabardan narx va brend chiqarish
    last_user_msg = ""
    for m in payload.messages:
        if m.role == "user":
            last_user_msg = m.content

    max_price = extract_price_from_text(last_user_msg)

    # Brend aniqlash
    brand = None
    brands = ["samsung", "apple", "iphone", "xiaomi", "realme", "huawei", "oppo"]
    for b in brands:
        if b in last_user_msg.lower():
            brand = b
            break

    # RAG — aqlli filtr
    available_products = fetch_available_products(db, max_price=max_price, brand=brand)

    # Agar filtr bilan hech narsa topilmasa — barchasini ko'rsat
    if not available_products:
        available_products = fetch_available_products(db)

    products_context = build_products_context(available_products)
    system_prompt = build_system_prompt(products_context, current_user)

    messages = [{"role": m.role, "content": m.content} for m in payload.messages]

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages
            ],
            temperature=0.6,
            max_tokens=1500,
        )
    except Exception as e:
        print(f"GROQ XATO: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI xizmatida xatolik: {str(e)}"
        )

    raw = response.choices[0].message.content.strip()

    # JSON tozalash
    json_start = raw.find("{")
    json_end = raw.rfind("}") + 1
    if json_start != -1 and json_end > json_start:
        json_str = raw[json_start:json_end]
        try:
            data = json.loads(json_str)
            response_type = data.get("type")

            if response_type == "order":
                product_id = data.get("product_id")
                product = db.query(Product).filter(
                    Product.id == product_id,
                    Product.is_active == True,
                    Product.stock > 0
                ).first()

                if not product:
                    return {
                        "type": "text",
                        "content": "Kechirasiz, bu mahsulot endi tugab qoldi 😔 Boshqa variant ko'raylikmi?"
                    }

                order = Order(
                    user_id=current_user.id,
                    product_id=product.id,
                    client_first_name=current_user.first_name,
                    client_last_name=current_user.last_name,
                    client_phone=current_user.phone,
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
                await send_telegram(tg_text, db)

                return {
                    "type": "order_success",
                    "content": data.get("content", "Buyurtmangiz qabul qilindi! ✅"),
                    "order": {
                        "id": order.id,
                        "product_name": f"{product.brand} {product.name}",
                        "price": product.price,
                        "status": "pending"
                    }
                }

            return data

        except json.JSONDecodeError:
            pass

    return {
        "type": "text",
        "content": raw
    }


