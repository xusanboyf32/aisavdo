from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import base64
from database import get_db
from models import Product, User
from schemas import ProductOut
from auth import get_current_user

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", response_model=List[ProductOut])
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Product).filter(Product.is_active == True).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    return product


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    brand: str = Form(...),
    price: float = Form(...),
    ram: Optional[str] = Form(None),
    storage: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    stock: int = Form(0),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    image_data = None
    if image and image.filename:
        contents = await image.read()
        ext = image.content_type
        b64 = base64.b64encode(contents).decode('utf-8')
        image_data = f"data:{ext};base64,{b64}"

    product = Product(
        name=name, brand=brand, price=price,
        ram=ram, storage=storage, color=color,
        description=description, stock=stock,
        image_data=image_data,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/{product_id}/image", response_model=ProductOut)
async def update_product_image(
    product_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    contents = await image.read()
    ext = image.content_type
    b64 = base64.b64encode(contents).decode('utf-8')
    product.image_data = f"data:{ext};base64,{b64}"

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    product.is_active = False
    db.commit()



from auth import get_current_user, get_admin_user

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    name: str = Form(...),
    brand: str = Form(...),
    price: float = Form(...),
    ram: Optional[str] = Form(None),
    storage: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    stock: int = Form(0),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    image_data = None
    if image and image.filename:
        contents = await image.read()
        ext = image.content_type
        b64 = base64.b64encode(contents).decode('utf-8')
        image_data = f"data:{ext};base64,{b64}"

    product = Product(
        name=name, brand=brand, price=price,
        ram=ram, storage=storage, color=color,
        description=description, stock=stock,
        image_data=image_data,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    name: str = Form(...),
    brand: str = Form(...),
    price: float = Form(...),
    ram: Optional[str] = Form(None),
    storage: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    stock: int = Form(0),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    product.name = name
    product.brand = brand
    product.price = price
    product.ram = ram
    product.storage = storage
    product.color = color
    product.description = description
    product.stock = stock

    if image and image.filename:
        contents = await image.read()
        ext = image.content_type
        b64 = base64.b64encode(contents).decode('utf-8')
        product.image_data = f"data:{ext};base64,{b64}"

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    product.is_active = False
    db.commit()
