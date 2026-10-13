# Fieldwell — good growing starts here

A full-stack agricultural commerce starter for crop protection, animal health, plant nutrition and farm supplies. The storefront is a responsive React app; its REST API is built with Django REST Framework and is designed to use PostgreSQL in production. Local development falls back to SQLite so the app can be explored without a database server.

## What’s inside

- Responsive product discovery, category filters, live search, sorting and quick-view product details.
- A persistent cart with quantity controls, shipping calculations and a checkout flow.
- Django REST endpoints for catalog browsing, anonymous carts, order placement and inventory changes.
- Transactional checkout that locks products, rechecks availability and decrements stock as one operation.
- Django admin views for catalog, carts and order management.
- A small fictional demo catalog and API tests.

> **Demo / compliance note:** the catalog is sample content, and checkout does not process payments. Before selling regulated agricultural products, replace the demo catalog and add jurisdiction-specific licensing, registration, age/eligibility checks, shipping controls, label and safety documentation, payment processing, and appropriate customer support. Product use must follow the official label and local rules.

## Run locally

### 1. Start the Django API

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
```

For a local quick start, the API uses `backend/db.sqlite3` by default:

```bash
python manage.py migrate
python manage.py seed_catalog
python manage.py runserver 0.0.0.0:8000
```

For PostgreSQL, copy `backend/.env.example` to `backend/.env`, set `DATABASE_URL` and `DJANGO_SECRET_KEY`, then load the file before running Django:

```bash
set -a && . ./.env && set +a
python manage.py migrate
python manage.py seed_catalog
python manage.py runserver 0.0.0.0:8000
```

`DATABASE_URL` accepts `postgresql://user:password@host:5432/database`. If it is not set, SQLite is used. Never use the example secret key in production.

### 2. Start the React storefront

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite serves the storefront on port `5173` and proxies `/api` to `http://127.0.0.1:8000`. Set `API_PROXY_TARGET` if the API runs elsewhere. If the API is offline, the storefront uses its local demo catalog and the cart continues to work in the browser.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health/` | Health check |
| `GET` | `/api/categories/` | Product categories and active product counts |
| `GET` | `/api/products/` | Catalog; supports `search`, `category`, `featured`, `min_price`, `max_price`, and `ordering` |
| `GET` | `/api/products/<slug>/` | Product detail |
| `POST` | `/api/carts/` | Create an anonymous cart; returns a UUID |
| `GET` | `/api/carts/<cart_id>/` | Read a cart |
| `POST` | `/api/carts/<cart_id>/items/` | Add `{ "product_id": 1, "quantity": 1 }` |
| `PATCH` | `/api/carts/<cart_id>/items/<item_id>/` | Set `{ "quantity": 2 }` |
| `DELETE` | `/api/carts/<cart_id>/items/<item_id>/` | Remove a cart line |
| `POST` | `/api/orders/checkout/` | Place an order and atomically update inventory |

Checkout accepts `cart_id`, `full_name`, `email` and `shipping_address`. Inventory conflicts return HTTP `409`; validation errors return standard DRF `400` responses.

## Tests

```bash
cd backend
python manage.py test catalog orders
```
