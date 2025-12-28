# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import storage
from pydantic import BaseModel, Field
import uvicorn
from models import ReviewCreate, Review

app = FastAPI()

# allow vite dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# CAKES MODELS
# -----------------------------
class CakeBase(BaseModel):
    name: str
    category: str | None = None
    priceHalfKg: int | None = None
    priceOneKg: int | None = None
    price: int | None = None
    price250g: int | None = None
    images: list[str] | None = None


class CakeCreate(CakeBase):
    pass


class Cake(CakeBase):
    id: int


# -----------------------------
# ROOT
# -----------------------------
@app.get("/")
def root():
    return {"message": "Server is running!"}


# -----------------------------
# CAKES API
# -----------------------------
@app.get("/api/cakes", response_model=List[Cake])
def get_cakes():
    cakes = storage.list_cakes()
    for c in cakes:
        if c.get("id") is None:
            c["id"] = 0
    return cakes


@app.get("/api/cakes/{cake_id}", response_model=Cake)
def get_cake(cake_id: int):
    try:
        return storage.get_cake_by_id(cake_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Cake not found")


@app.post("/api/cakes", response_model=Cake)
def post_cake(payload: CakeCreate):
    return storage.create_cake(payload.model_dump())


@app.put("/api/cakes/{cake_id}", response_model=Cake)
def put_cake(cake_id: int, payload: CakeCreate):
    try:
        return storage.update_cake(cake_id, payload.model_dump())
    except KeyError:
        raise HTTPException(status_code=404, detail="Cake not found")


@app.delete("/api/cakes/{cake_id}")
def delete_cake(cake_id: int):
    try:
        storage.delete_cake(cake_id)
        return {"ok": True}
    except KeyError:
        raise HTTPException(status_code=404, detail="Cake not found")


# -----------------------------
# ORDERS MODELS
# -----------------------------
class OrderCreate(BaseModel):
    name: str
    phone: str | None = None
    address: str | None = None
    cake: str
    weight: str = Field(pattern=r"^(250g|0\.5kg|1kg)$")
    quantity: int = Field(ge=1)
    deliveryDate: str | None = None


class Order(OrderCreate):
    id: int
    status: str | None = None


# -----------------------------
# ORDERS API
# -----------------------------
@app.get("/api/orders", response_model=List[Order])
def get_orders():
    return storage.list_orders()


@app.post("/api/orders", response_model=Order)
def post_order(payload: OrderCreate):
    order_data = payload.model_dump()
    order_data["status"] = "Pending"
    return storage.create_order(order_data)


@app.put("/api/orders/{order_id}/status", response_model=Order)
def put_order_status(order_id: int, status: str):
    try:
        return storage.update_order_status(order_id, status)
    except KeyError:
        raise HTTPException(status_code=404, detail="Order not found")


@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int):
    try:
        storage.delete_order(order_id)
        return {"ok": True}
    except KeyError:
        raise HTTPException(status_code=404, detail="Order not found")


# -----------------------------
# QUERY (CONTACT FORM)
# -----------------------------
class QueryCreate(BaseModel):
    name: str
    message: str


class Query(QueryCreate):
    id: int


@app.post("/api/query", response_model=Query)
def post_query(payload: QueryCreate):
    return storage.create_query(payload.model_dump())


# -----------------------------
# REVIEWS API
# -----------------------------
@app.get("/api/reviews", response_model=List[Review])
def get_reviews():
    return storage.list_reviews()


@app.post("/api/reviews", response_model=Review)
def post_review(payload: ReviewCreate):
    return storage.create_review(payload.model_dump())


@app.put("/api/reviews/{review_id}", response_model=Review)
def put_review(review_id: int, payload: ReviewCreate):
    try:
        return storage.update_review(review_id, payload.model_dump())
    except KeyError:
        raise HTTPException(status_code=404, detail="Review not found")


@app.delete("/api/reviews/{review_id}")
def delete_review(review_id: int):
    try:
        storage.delete_review(review_id)
        return {"ok": True}
    except KeyError:
        raise HTTPException(status_code=404, detail="Review not found")


@app.patch("/api/reviews/{review_id}/pin")
def toggle_review_pin(review_id: int):
    try:
        return storage.toggle_review_pin(review_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Review not found")


# -----------------------------
# ANALYTICS API  ✅ NEW
# -----------------------------
@app.get("/api/analytics")
def get_analytics():
    orders = storage.list_orders()
    cakes = storage.list_cakes()

    cake_map = {c["name"]: c for c in cakes}

    total_orders = len(orders)
    completed_orders = 0
    pending_orders = 0
    revenue = 0

    for o in orders:
        if o.get("status") == "Completed":
            completed_orders += 1
        else:
            pending_orders += 1

        cake = cake_map.get(o.get("cake"))
        if not cake:
            continue

        price = 0
        weight = o.get("weight")

        if cake.get("category") == "Cupcakes":
            price = cake.get("price") or 0
        elif weight == "250g":
            price = cake.get("price250g") or 0
        elif weight == "0.5kg":
            price = cake.get("priceHalfKg") or 0
        elif weight == "1kg":
            price = cake.get("priceOneKg") or 0

        revenue += price * int(o.get("quantity", 1))

    return {
        "totalOrders": total_orders,
        "completedOrders": completed_orders,
        "pendingOrders": pending_orders,
        "revenue": revenue
    }


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", port=4000, reload=True)
