import json
import os
import threading
from typing import List, Dict, Any

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CAKES_PATH = os.path.join(DATA_DIR, "cakes.json")
ORDERS_PATH = os.path.join(DATA_DIR, "orders.json")
QUERIES_PATH = os.path.join(DATA_DIR, "queries.json")
REVIEWS_PATH = os.path.join(DATA_DIR, "reviews.json")

_lock = threading.Lock()


def _read(path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        return []
    with _lock:
        with open(path, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except Exception:
                return []


def _write(path: str, data: List[Dict[str, Any]]):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with _lock:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)


# -------------------------------------------------------
#                  CAKES
# -------------------------------------------------------
def list_cakes() -> List[Dict[str, Any]]:
    raw = _read(CAKES_PATH)
    out: List[Dict[str, Any]] = []

    for r in raw:
        cid = r.get("id")
        images = r.get("images") or []

        try:
            cid = int(cid) if cid is not None else None
        except:
            cid = None

        name = r.get("name") or r.get("title") or "Cake"
        category = r.get("category") or "Classic"

        ph = r.get("priceHalfKg")
        po = r.get("priceOneKg")
        price = r.get("price")
        price250g = r.get("price250g")

        def safe_int(v):
            try:
                return int(v) if v is not None else None
            except:
                return None

        out.append({
            "id": cid,
            "name": name,
            "title": name,
            "category": category,
            "priceHalfKg": safe_int(ph),
            "priceOneKg": safe_int(po),
            "price": safe_int(price),
            "price250g": safe_int(price250g),
            "images": images
        })

    return out


def create_cake(payload: Dict[str, Any]) -> Dict[str, Any]:
    cakes = list_cakes()
    new_id = max([c["id"] for c in cakes if c.get("id")], default=0) + 1
    cake = {"id": new_id, **payload}
    cakes.append(cake)
    _write(CAKES_PATH, cakes)
    return cake


def get_cake_by_id(cake_id: int) -> Dict[str, Any]:
    for c in list_cakes():
        if c.get("id") == cake_id:
            return c
    raise KeyError("not found")


def update_cake(cake_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
    cakes = list_cakes()
    for i, c in enumerate(cakes):
        if c.get("id") == cake_id:
            cakes[i] = {**c, **updates, "id": cake_id}
            _write(CAKES_PATH, cakes)
            return cakes[i]
    raise KeyError("not found")


def delete_cake(cake_id: int):
    cakes = list_cakes()
    new = [c for c in cakes if c.get("id") != cake_id]
    if len(new) == len(cakes):
        raise KeyError("not found")
    _write(CAKES_PATH, new)


# -------------------------------------------------------
#                       ORDERS
# -------------------------------------------------------
def list_orders() -> List[Dict[str, Any]]:
    raw = _read(ORDERS_PATH)
    out: List[Dict[str, Any]] = []
    
    for r in raw:
        oid = r.get("id")
        try:
            oid = int(oid) if oid is not None else None
        except:
            oid = None
        
        if oid is None:
            continue  # Skip orders without valid ID
        
        out.append({
            "id": oid,
            "name": r.get("name") or "",
            "phone": r.get("phone"),
            "address": r.get("address"),
            "cake": r.get("cake") or "",
            "weight": r.get("weight") or "1kg",  # Default to "1kg" if missing
            "quantity": int(r.get("quantity", 1)) if r.get("quantity") is not None else 1,
            "deliveryDate": r.get("deliveryDate"),
            "status": r.get("status") or "Pending"
        })
    
    return out


def create_order(payload: Dict[str, Any]) -> Dict[str, Any]:
    orders = list_orders()
    new_id = max([o.get("id") for o in orders if o.get("id")], default=1000) + 1
    order = {"id": new_id, **payload}
    orders.append(order)
    _write(ORDERS_PATH, orders)
    return order


def update_order_status(order_id: int, status: str) -> Dict[str, Any]:
    orders = list_orders()
    for i, o in enumerate(orders):
        if o.get("id") == order_id:
            orders[i]["status"] = status
            _write(ORDERS_PATH, orders)
            return orders[i]
    raise KeyError("not found")


def delete_order(order_id: int):
    orders = list_orders()
    new = [o for o in orders if o.get("id") != order_id]
    if len(new) == len(orders):
        raise KeyError("not found")
    _write(ORDERS_PATH, new)


# -------------------------------------------------------
#                      QUERIES
# -------------------------------------------------------
def list_queries() -> List[Dict[str, Any]]:
    return _read(QUERIES_PATH)


def create_query(payload: Dict[str, Any]) -> Dict[str, Any]:
    queries = list_queries()
    new_id = max([q.get("id") for q in queries if q.get("id")], default=2000) + 1
    q = {"id": new_id, **payload}
    queries.append(q)
    _write(QUERIES_PATH, queries)
    return q


# -------------------------------------------------------
#                   ANALYTICS (NEW)
# -------------------------------------------------------
def get_analytics() -> Dict[str, Any]:
    orders = list_orders()

    total_orders = len(orders)
    completed_orders = len([o for o in orders if o.get("status") == "Completed"])
    pending_orders = total_orders - completed_orders

    # Revenue calculation (safe)
    revenue = 0
    for o in orders:
        try:
            revenue += int(o.get("totalPrice", 0))
        except:
            pass

    return {
        "totalOrders": total_orders,
        "completedOrders": completed_orders,
        "pendingOrders": pending_orders,
        "revenue": revenue
    }


# -------------------------------------------------------
#                      REVIEWS
# -------------------------------------------------------
def list_reviews() -> List[Dict[str, Any]]:
    return _read(REVIEWS_PATH)


def create_review(payload: Dict[str, Any]) -> Dict[str, Any]:
    reviews = list_reviews()
    new_id = max([r.get("id") for r in reviews if r.get("id")], default=0) + 1

    from datetime import datetime
    current_date = datetime.now().strftime("%Y-%m-%d")

    review = {
        "id": new_id,
        **payload,
        "date": current_date,
        "pinned": False
    }
    reviews.append(review)
    _write(REVIEWS_PATH, reviews)
    return review


def update_review(review_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
    reviews = list_reviews()
    for i, r in enumerate(reviews):
        if r.get("id") == review_id:
            reviews[i] = {**r, **updates, "id": review_id}
            _write(REVIEWS_PATH, reviews)
            return reviews[i]
    raise KeyError("not found")


def delete_review(review_id: int):
    reviews = list_reviews()
    new = [r for r in reviews if r.get("id") != review_id]
    if len(new) == len(reviews):
        raise KeyError("not found")
    _write(REVIEWS_PATH, new)


def toggle_review_pin(review_id: int) -> Dict[str, Any]:
    reviews = list_reviews()
    for i, r in enumerate(reviews):
        if r.get("id") == review_id:
            reviews[i]["pinned"] = not r.get("pinned", False)
            _write(REVIEWS_PATH, reviews)
            return reviews[i]
    raise KeyError("not found")


def get_pinned_reviews() -> List[Dict[str, Any]]:
    reviews = list_reviews()
    return [r for r in reviews if r.get("pinned", False)]
