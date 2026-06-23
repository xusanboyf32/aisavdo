from database import SessionLocal, engine, Base
from models import Product
import models

Base.metadata.create_all(bind=engine)

products = [
    {"name": "Galaxy A25", "brand": "Samsung", "price": 2_990_000, "ram": "6GB", "storage": "128GB", "color": "Qora",
     "description": "Qulay narxda sifatli Samsung telefon", "stock": 10},
    {"name": "Galaxy A55", "brand": "Samsung", "price": 4_990_000, "ram": "8GB", "storage": "256GB", "color": "Kulrang",
     "description": "Kuchli protsessor va yaxshi kamera", "stock": 8},
    {"name": "Galaxy S24", "brand": "Samsung", "price": 9_990_000, "ram": "8GB", "storage": "256GB", "color": "Qora",
     "description": "Flagman darajasidagi Samsung", "stock": 3},
    {"name": "iPhone 13", "brand": "Apple", "price": 7_990_000, "ram": "4GB", "storage": "128GB", "color": "Oq",
     "description": "Apple A15 Bionic chip, ishonchli iOS", "stock": 4},
    {"name": "iPhone 15", "brand": "Apple", "price": 13_990_000, "ram": "6GB", "storage": "128GB", "color": "Sariq",
     "description": "USB-C, Dynamic Island, 48MP kamera", "stock": 2},
    {"name": "Redmi 13C", "brand": "Xiaomi", "price": 1_890_000, "ram": "4GB", "storage": "128GB", "color": "Yashil",
     "description": "Arzon narxda katta batareya", "stock": 15},
    {"name": "Redmi Note 13", "brand": "Xiaomi", "price": 2_790_000, "ram": "6GB", "storage": "128GB", "color": "Qora",
     "description": "200MP kamera, slim dizayn", "stock": 12},
    {"name": "Xiaomi 14", "brand": "Xiaomi", "price": 11_990_000, "ram": "12GB", "storage": "256GB", "color": "Oq",
     "description": "Leica kamera, Snapdragon 8 Gen 3", "stock": 3},
    {"name": "Realme C67", "brand": "Realme", "price": 2_190_000, "ram": "6GB", "storage": "128GB", "color": "Qora",
     "description": "67W tez zaryadlash, chiroyli dizayn", "stock": 8},
    {"name": "Realme 12 Pro", "brand": "Realme", "price": 4_490_000, "ram": "8GB", "storage": "256GB", "color": "Ko'k",
     "description": "Periskop kamera, premium dizayn", "stock": 5},
]


def add():
    db = SessionLocal()
    try:
        # Mavjud rasmni olish
        existing = db.query(Product).first()
        if not existing or not existing.image_data:
            print("❌ Bazada rasm topilmadi!")
            return

        shared_image = existing.image_data
        print(f"✅ Rasm olindi: {len(shared_image)} bytes")

        added = 0
        for p in products:
            # Avval shu nom bor-yo'qligini tekshir
            exists = db.query(Product).filter(Product.name == p["name"]).first()
            if exists:
                print(f"⚠️  {p['brand']} {p['name']} — allaqachon bor, o'tkazildi")
                continue

            product = Product(
                name=p["name"],
                brand=p["brand"],
                price=p["price"],
                ram=p["ram"],
                storage=p["storage"],
                color=p["color"],
                description=p["description"],
                stock=p["stock"],
                image_data=shared_image,
                is_active=True,
            )
            db.add(product)
            added += 1
            print(f"✅ {p['brand']} {p['name']} qo'shildi")

        db.commit()
        print(f"\n🎉 Jami {added} ta mahsulot qo'shildi!")
    finally:
        db.close()


if __name__ == "__main__":
    add()
