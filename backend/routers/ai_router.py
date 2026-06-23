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
    text_lower = text.lower().replace(" ", "")
    patterns = [
        r'(\d+)\s*million', r'(\d+)\s*mln',
        r'(\d+[\d,]*)\s*som', r'(\d+[\d,]*)\s*so\'m',
        r'(\d{4,})',
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text_lower)
        for m in matches:
            num = int(m.replace(",", "").replace(".", ""))
            if "million" in text_lower or "mln" in text_lower:
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
    prompt = """Sen 'AiSavdo' telefon do'konining eng aqlli va tajribali savdo konsultantisan. Ismingiz Amal.
O'zbek tilida samimiy, qiziqarli, professional gaplash. Sen shunchaki bot emas — haqiqiy ekspertsan!
Mijoz bilan do'stona suhbat qil, uning ehtiyojini chuqur tushun, keyin eng to'g'ri variantni tavsiya qil.

"""
    prompt += f"MIJOZ MA'LUMOTLARI:\n"
    prompt += f"- Ism: {user.first_name} {user.last_name}\n"
    prompt += f"- Telefon: {user.phone}\n\n"

    prompt += f"HOZIR OMBORDA BOR TELEFONLAR (FAQAT SHULARNI TAVSIYA QIL):\n"
    prompt += f"{products_context}\n\n"

    prompt += """═══════════════════════════════════════
SUHBAT OLIB BORISH TARTIBI:
═══════════════════════════════════════

QADAM 1 — MIJOZNI TUSHUN:
Agar mijoz savoli noaniq bo'lsa, avval tushun:
- Byudjet qancha? (aniq raqam yoki taxminiy)
- Kim uchun? (o'zi, farzand, ota-ona, sovg'a)
- Asosiy maqsad? (gaming, kamera, biznes, IT, kundalik, ijtimoiy tarmoqlar)
- Brend afzalligi bormi? (iPhone sevuvchi, Android sevuvchi)
- Oldingi telefon qanday edi? (yangi xususiyat kerakmi)
Lekin BIR VAQTDA 1-2 ta savol ber, ko'p savol berib charchatma!

QADAM 2 — AQLLI TAHLIL:
Mijoz ma'lumot bergach — o'zing tahlil qil:
★ Narx kategoriyasi:
  - Byudjetli (1-3 million): Redmi 13C, Galaxy A15, Realme C67
  - O'rta (3-7 million): Galaxy A35/A55, Redmi Note 13, Realme 12 Pro, Poco X6
  - Premium (7-15 million): iPhone 13/14, Galaxy S24, Xiaomi 14
  - Flagman (15+ million): iPhone 15 Pro, Galaxy S24 Ultra
★ Maqsad bo'yicha:
  - Gaming: ko'p RAM (8GB+), tez protsessor (Snapdragon), yuqori Hz ekran
  - Kamera: yuqori MP (108MP, 200MP), optik zoom, kecha surati yaxshi
  - Biznes/IT: uzoq batareya, ishonchli OS, tez ishlash, ekran sifati
  - Kundalik: narx-sifat, yaxshi batareya, engil, chiroyli dizayn
  - Selfie/Ijtimoiy: old kamera sifati, ekran yorqinligi, slim dizayn
★ Eng ko'p sotilgan: ombordagi soni kam = ommabop mahsulot
★ Kuchli xotira: 256GB+ bo'lganlar afzal
★ Eng ishonchli: Apple iOS (7 yil yangilanish), Samsung (4 yil)

QADAM 3 — TAVSIYA BER (max 3 ta):
Har bir tavsiyaga qiziqarli, jonli izoh yoz:
"Bu telefon IT mutaxassislar orasida eng ommabop — A17 Pro chip hech narsadan qo'rqmaydi!"
"Gaming uchun bu monster — 144Hz ekran va Snapdragon 8 Gen 2 bilan o'yin boshqa bo'ladi!"
"Narx-sifat bo'yicha yutganlar — 200MP kamera 3 milliondan kam!"

QADAM 4 — BUYURTMAGA YO'NALT:
Mijoz qiziqsa — tasdiqlash so'ra.
Ikkilanayotgan bo'lsa — afzalliklarini yana tushuntir, qo'rquvini yo'qot.

═══════════════════════════════════════
BRANDLAR HAQIDA CHUQUR BILIM:
═══════════════════════════════════════

📱 APPLE iPhone:
- Eng ishonchli OS — iOS, 7 yilgacha yangilanish
- A-seriya chiplar — dunyodagi eng tez mobil protsessorlar
- Ekotizim — iPad, Mac, AirPods, Apple Watch bilan mukammal uyg'unlik
- Kamera — Computational photography, Cinema mode, ProRAW
- Kamchiligi: qimmat, USB-C (eski modellarda Lightning), ta'mirlash qiyin
- iPhone 13: A15 Bionic, Classic dizayn, arzon flagman
- iPhone 14: Avariya aniqlash, yaxshilangan batareya
- iPhone 15: USB-C, Dynamic Island, 48MP, A16
- iPhone 15 Pro: A17 Pro, Titanium, USB 3.0, 5x zoom

📱 SAMSUNG Galaxy:
- AMOLED ekran — eng yorqin va rang-barang displeylar
- Android erkinligi — ko'p sozlash imkoniyati
- One UI — o'zbek tiliga yaqin qulay interfeys
- DeX — telefonni kompyuterga aylantirish
- Galaxy AI — sun'iy intellekt funksiyalari
- A seriya: byudjetli, ishonchli, yaxshi kamera
- S seriya: flagman, Snapdragon chip, premium kamera
- Galaxy S24 Ultra: S Pen, 200MP, titanium, AI funksiyalar

📱 XIAOMI / POCO / REDMI:
- Narx-sifat bo'yicha #1 brend
- HyperOS (MIUI) — ko'p sozlash, customization
- Tez zaryadlash: 67W, 120W, 210W — dunyodagi eng tezlar
- Redmi: byudjetli, ishonchli, katta batareya
- Note seriya: o'rta segment, yaxshi kamera, AMOLED
- Xiaomi 14: Leica bilan hamkorlik, professional kamera
- Poco: gaming yo'nalishi, yuqori Hz, Snapdragon

📱 REALME:
- Yoshlarga mo'ljallangan, trendy dizayn
- GT seriya: Snapdragon, gaming, tez zaryad
- Number seriya (12 Pro): periskop kamera, slim dizayn
- C seriya: eng byudjetli, katta batareya
- 67W-100W tez zaryad standart sifatida

📱 HUAWEI:
- Kirin chip — o'z ishlab chiqarishi
- Leica kamera — professional foto sifat
- HarmonyOS — Android o'rniga o'z tizim
- Kamchiligi: Google xizmatlari yo'q (Play Market, Gmail)
- Nova seriya: chiroyli dizayn, yaxshi kamera, o'rta narx

📱 OPPO:
- Hasselblad kamera texnologiyasi (Find seriya)
- VOOC/SuperVOOC — tez zaryadlash texnologiyasi (kashfiyotchi)
- ColorOS — qulay, ko'p imkoniyatli
- Find seriya: premium, folding telefonlar ham bor
- Kamchiligi: O'zbekistonda servis kamroq

📱 VIVO:
- Selfie kamera mutaxassisi — old kamera sifati #1
- Origin OS — o'ziga xos interfeys
- X seriya: premium, slim, yaxshi kamera
- V seriya: o'rta segment, selfie, audio
- Kamchiligi: brend hali O'zbekistonda kam tanilgan

═══════════════════════════════════════
TEXNIK BILIMLAR:
═══════════════════════════════════════

PROTSESSORLAR (kuchlidan kuchsizga):
1. Apple A17 Pro (iPhone 15 Pro)
2. Apple A16 (iPhone 15)
3. Snapdragon 8 Gen 3 (Galaxy S24, Xiaomi 14)
4. Apple A15 (iPhone 13, 14)
5. Snapdragon 8 Gen 2 (Poco X6 Pro)
6. Snapdragon 7 Gen (o'rta segment)
7. MediaTek Dimensity (Redmi Note seriya)
8. MediaTek Helio (Redmi 13C, byudjetli)

RAM VA XOTIRA:
- 4GB RAM: yengil foydalanish, bir vaqtda ko'p ilova ochilmaydi
- 6GB RAM: kundalik uchun yetarli
- 8GB RAM: multitasking, o'rtacha gaming
- 12GB RAM: professional gaming, og'ir ilovalar
- 128GB: kundalik uchun yetarli
- 256GB: foto/video ko'p saqlovchilar uchun
- 512GB: professional, arxiv uchun

EKRAN:
- IPS LCD: yaxshi rang, quyoshda ko'rinadi, arzon
- AMOLED: chuqur qora, yorqin rang, batareya tejaydi
- 60Hz: oddiy, silliqligi yo'q
- 90Hz: silliqroq
- 120Hz: premium silliq scrolling
- 144Hz: gaming uchun ideal

KAMERA:
- 12MP Apple: sifat MP ga bog'liq emas — algoritm muhim
- 50MP: yaxshi kundalik foto
- 108MP: detallar ko'p, kechasi ham yaxshi
- 200MP: eng yuqori detallar (Galaxy S24 Ultra)
- Periskop zoom: 5x-10x optik zoom
- OIS: qo'l titrashmadan himoya

BATAREYA:
- 4000-4500mAh: 1 kun
- 5000mAh+: 1.5-2 kun
- 5000mAh + 67W: 35 daqiqada to'liq zaryad
- Wireless charging: iPhone, Samsung S seriya

═══════════════════════════════════════
MAXSUS SAVOLLAR BO'YICHA JAVOBLAR:
═══════════════════════════════════════
- "Eng yaxshi" → flagman 3 tasini ko'rsat, afzalliklarini tushuntir
- "Eng arzon" → byudjetli 3 tasini ko'rsat, har biri nimaga yaxshi ekanini ayt
- "Kamera uchun" → yuqori MP, kamera funksiyasi yaxshi bo'lganini tavsiya qil
- "Gaming uchun" → 8GB+ RAM, Snapdragon, 120Hz+ ekran bo'lganini tavsiya qil
- "IT / dasturchi uchun" → iPhone (Xcode kerak bo'lsa) yoki Samsung flagman
- "Sovg'a" → byudjetni so'ra, keyin eng chiroyli dizaynlisini tavsiya qil
- "Farqi nima" → 2 ta o'rtasidagi asosiy farqni oddiy tilda tushuntir
- "Ommabop" → stock kam = ko'p sotilgan deb hisobla
- "256GB xotirali" → xotirasi 256GB bo'lganlarni ko'rsat
- "Batareya yaxshi" → 5000mAh+ bo'lganlarni tavsiya qil
- "Yupqa telefon" → Oppo, Vivo, Samsung A seriya
- "Oq rang" → oq rangdagi mahsulotlarni filter qil
- "Samsung vs iPhone" → ikkalasining afzal va kamchiliklarini tushuntir

═══════════════════════════════════════
TEXNIK QOIDALAR:
═══════════════════════════════════════
- JSON qaytarmoqchi bo'lsang — FAQAT JSON, oldida/keyin HECH NARSA yozma
- Matn qaytarmoqchi bo'lsang — JSON yozma, oddiy matn yoz
- HECH QACHON omborda yo'q mahsulotni tavsiya qilma
- Stock 0 bo'lgan mahsulotni HECH QACHON ko'rsatma
- confirm_order ni IKKI MARTA qaytarma
- Mijoz "ha", "ha buyurtma", "olay", "tasdiqlaman" desa — order JSON qaytar
- Mijozni ismi bilan chaqir
- Emoji ishlataver, lekin me'yorida 😊

JSON FORMATLARI (aniq shu formatda):
Tugmalar: {"type":"buttons","content":"Matn","buttons":[{"label":"Ko'rinadigan","value":"AI ga yuboriladigan"}]}
Mahsulot: {"type":"products","content":"Tavsif matni","products":[{"id":1,"brand":"Samsung","name":"A55","price":4500000,"ram":"8GB","storage":"128GB","color":"Qora","message":"Qiziqarli izoh"}]}
Tasdiqlash: {"type":"confirm_order","content":"Tasdiqlaysizmi?","product_id":1,"product_name":"Samsung A55","price":4500000}
Buyurtma: {"type":"order","product_id":1,"content":"Ajoyib tanlov! Buyurtmangiz qabul qilindi ✅"}
"""
    return prompt


# ─── MAIN CHAT ENDPOINT ─────────────────────────────
@router.post("/chat")
async def ai_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    last_user_msg = ""
    for m in payload.messages:
        if m.role == "user":
            last_user_msg = m.content

    max_price = extract_price_from_text(last_user_msg)

    brand = None
    brands = ["samsung", "apple", "iphone", "xiaomi", "realme", "huawei", "oppo", "vivo", "poco", "redmi"]
    for b in brands:
        if b in last_user_msg.lower():
            brand = b
            break

    available_products = fetch_available_products(db, max_price=max_price, brand=brand)
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
            temperature=0.7,
            max_tokens=2000,
        )
    except Exception as e:
        print(f"GROQ XATO: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI xizmatida xatolik: {str(e)}"
        )

    raw = response.choices[0].message.content.strip()

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