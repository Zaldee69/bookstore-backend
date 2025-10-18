# Book E-Commerce Backend

REST API untuk platform e-commerce buku dengan autentikasi JWT, RBAC, dan payment integration.

## Tech Stack

- Node.js + Express.js
- PostgreSQL + Prisma ORM
- JWT Authentication
- Zod validation
- Swagger/OpenAPI docs

## Features

**Authentication**
- JWT-based auth dengan single active session
- Role-based access (Admin/Customer)
- Auto-invalidate session saat login dari device baru

**Customer**
- Browse & search buku
- Shopping cart management
- Checkout dengan stock validation
- Order & payment history

**Admin**
- Book CRUD operations
- Stock management
- Transaction reports
- Sales analytics dengan Excel export

**Security**
- Race condition protection via transactions
- Atomic stock operations
- Idempotent payments
- Rate limiting
- Error logging

## Setup

**Prerequisites**
- Node.js 18+
- PostgreSQL database

**Installation**

```bash
npm install
```

**Environment Config**

Create `.env`:

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="3600"
PAYMENT_CALLBACK_SECRET="your-payment-secret"
API_URL="http://localhost:3000"
PORT="3000"
```

**Database**

```bash
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

**Run**

```bash
npm run dev  # development
npm start    # production
```

Server: `http://localhost:3000`  
Docs: `http://localhost:3000/docs`

## Test Accounts

**Admin**
- admin@bookstore.com / admin123

**Customer**
- customer1@example.com / customer123

## API Endpoints

Full documentation: `/docs`

**Auth**
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
```

**Books**
```
GET    /books
GET    /books/:id
```

**Cart (Auth)**
```
GET    /cart
POST   /cart/items
PATCH  /cart/items/:id
DELETE /cart/items/:id
```

**Orders (Auth)**
```
POST   /orders/checkout
GET    /orders
GET    /orders/:id
```

**Payments (Auth)**
```
POST   /payments/simulate      # Generate callback data
GET    /payments/history       # Payment history
POST   /payments/callback      # Webhook (no auth)
```

**Admin**
```
GET    /books/admin/all
POST   /books/admin
PATCH  /books/admin/:id
PATCH  /books/admin/:id/stock
DELETE /books/admin/:id
GET    /admin/transactions
GET    /admin/reports/sales
GET    /admin/reports/sales/excel
```

## Testing Payment

**Generate Callback Data**

```bash
POST /payments/simulate
Authorization: Bearer <token>

{
  "orderId": "<order-id>",
  "status": "SUCCESS"
}
```

Response includes `callbackUrl` and `payload` with auto-generated signature.

**Process Payment**

```bash
POST /payments/callback

{
  "orderId": "...",
  "status": "SUCCESS",
  "providerRef": "...",
  "signature": "..."
}
```

Or use the helper script:

```bash
npx tsx scripts/generateSignature.ts <order-id> SUCCESS
```

## Security

**Single Active Session**  
One session per user. New login invalidates previous session.

**Race Condition Protection**  
Atomic stock operations via Prisma transactions.

**Rate Limiting**
- Global: 100 req/15min
- Sensitive: 5 req/5min

**Idempotency**  
Use `Idempotency-Key` header for checkout to prevent duplicate orders.

## Database Schema

**User** - Single session via `currentJti` & `tokenVersion`  
**Book** - Stock management, soft delete  
**Cart/CartItem** - Price snapshot  
**Order/OrderItem** - Status: CREATED, PAID, FAILED  
**Payment** - Idempotency key, status tracking  
**ErrorLog** - Auto error logging  

## Deployment

**Production ENV**

```env
DATABASE_URL=<postgres-url>
DIRECT_URL=<direct-postgres-url>  # for migrations
API_URL=<production-api-url>
JWT_SECRET=<strong-secret>
PAYMENT_CALLBACK_SECRET=<payment-secret>
NODE_ENV=production
```

**Build**

```bash
npm run build
npm start
```

## License

MIT
