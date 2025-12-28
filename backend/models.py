from pydantic import BaseModel, Field
from typing import Optional, List


# -----------------------------
# CAKE MODELS
# -----------------------------
class CakeCreate(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    priceHalfKg: Optional[int] = None
    priceOneKg: Optional[int] = None
    price: Optional[int] = None
    price250g: Optional[int] = None
    images: Optional[List[str]] = None


class Cake(CakeCreate):
    id: int


# -----------------------------
# QUERY (CONTACT FORM)
# -----------------------------
class QueryCreate(BaseModel):
    name: str
    message: str


class Query(QueryCreate):
    id: int


# -----------------------------
# ORDERS
# -----------------------------
class OrderCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    cake: str
    weight: str = Field(pattern=r"^(250g|0\.5kg|1kg)$")
    quantity: int = Field(ge=1)
    deliveryDate: Optional[str] = None


class Order(OrderCreate):
    id: int
    status: str = "Pending"


# -----------------------------
# REVIEWS
# -----------------------------
class ReviewCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=500)


class Review(ReviewCreate):
    id: int
    date: str
    pinned: bool = False
