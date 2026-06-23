from database import SessionLocal, engine, Base
from models import Product
import models

Base.metadata.create_all(bind=engine)

products = [
    {"name": "Galaxy A25", "brand": "Samsung", "price": 2_990_000, "ram": "6GB", "storage": "128GB", "color": "Qora", "image_url": None, "description": "Qulay narxda sifatli Samsung telefon", "stock": 10},
    {"name": "Galaxy A35", "brand": "Samsung", "price": 3_990_000, "ram": "8GB", "storage": "128GB", "color": "Ko'k", "image_url": None, "description": "O'rta segment eng yaxshi tanlov", "stock": 8},
    {"name": "Galaxy A55", "brand": "Samsung", "price": 4_990_000, "ram": "8GB", "storage": "256GB", "color": "Kulrang", "image_url": None, "description": "Kuchli protsessor va yaxshi kamera", "stock": 5},
    {"name": "Galaxy S24", "brand": "Samsung", "price": 9_990_000, "ram": "8GB", "storage": "256GB", "color": "Qora", "image_url": None, "description": "Flagman darajasidagi Samsung", "stock": 3},
    {"name": "Galaxy S24 Ultra", "brand": "Samsung", "price": 16_990_000, "ram": "12GB", "storage": "512GB", "color": "Titanium", "image_url": None, "description": "S Pen bilan eng kuchli Samsung", "stock": 2},
    {"name": "iPhone 13", "brand": "Apple", "price": 7_990_000, "ram": "4GB", "storage": "128GB", "color": "Oq", "image_url": None, "description": "Apple A15 Bionic chip, ishonchli iOS", "stock": 4},
    {"name": "iPhone 14", "brand": "Apple", "price": 10_990_000, "ram": "6GB", "storage": "128GB", "color": "Moviy", "image_url": None, "description": "Crash Detection va Emergency SOS", "stock": 3},
    {"name": "iPhone 15", "brand": "Apple", "price": 13_990_000, "ram": "6GB", "storage": "128GB", "color": "Sariq", "image_url": None, "description": "USB-C, Dynamic Island, 48MP kamera", "stock": 2},
    {"name": "iPhone 15 Pro", "brand": "Apple", "price": 17_990_000, "ram": "8GB", "storage": "256GB", "color": "Titanium", "image_url": None, "description": "A17 Pro chip, titanium korpus", "stock": 2},
    {"name": "Redmi 13C", "brand": "Xiaomi", "price": 1_890_000, "ram": "4GB", "storage": "128GB", "color": "Yashil", "image_url": None, "description": "Arzon narxda katta batareya", "stock": 15},
    {"name": "Redmi Note 13", "brand": "Xiaomi", "price": 2_790_000, "ram": "6GB", "storage": "128GB", "color": "Qora", "image_url": None, "description": "200MP kamera, slim dizayn", "stock": 12},
    {"name": "Xiaomi 14", "brand": "Xiaomi", "price": 11_990_000, "ram": "12GB", "storage": "256GB", "color": "Oq", "image_url": None, "description": "Leica kamera, Snapdragon 8 Gen 3", "stock": 3},
    {"name": "Realme C67", "brand": "Realme", "price": 2_190_000, "ram": "6GB", "storage": "128GB", "color": "Qora", "image_url": None, "description": "67W tez zaryadlash, chiroyli dizayn", "stock": 8},
    {"name": "Realme 12 Pro", "brand": "Realme", "price": 4_490_000, "ram": "8GB", "storage": "256GB", "color": "Ko'k", "image_url": None, "description": "Periskop kamera, premium dizayn", "stock": 5},
]


def seed():
    db = SessionLocal()
    try:
        existing = db.query(Product).count()
        if existing > 0:
            print(f"✅ Bazada allaqachon {existing} ta mahsulot bor.")
            return
        for p in products:
            db.add(Product(**p))
        db.commit()
        print(f"✅ {len(products)} ta mahsulot bazaga qo'shildi!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
