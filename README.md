# Book E-Commerce Backend API

Backend API untuk e-commerce buku dengan fitur authentication, role-based access control (RBAC), manajemen transaksi aman, rate limiting, dan error logging.

## Tech Stack

- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL (Prisma Postgres)
- **ORM**: Prisma
- **Authentication**: JWT (1 jam expiry) + Single Active Session
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: Swagger UI

## Features

### Authentication & Authorization

- ✅ Register & Login dengan JWT
- ✅ Single active session per user (enforce dengan jti & tokenVersion)
- ✅ Role-based access control (ADMIN & CUSTOMER)
- ✅ Auto logout on new login dari device lain

### Customer Features

- ✅ Browse buku yang in-stock
- ✅ View detail buku
- ✅ Kelola shopping cart (add, update, remove)
- ✅ Checkout dengan validasi stok real-time
- ✅ View order history

### Admin Features

- ✅ CRUD buku (create, read, update, delete)
- ✅ Manage stok buku (increment/decrement)
- ✅ View semua transaksi
- ✅ Sales report (total terjual, revenue, sisa stok)

### Security & Performance

- ✅ Race condition protection dengan Prisma transactions
- ✅ Atomic stock decrement untuk prevent overselling
- ✅ Idempotent payment callback
- ✅ Rate limiting (global + sensitive endpoints)
- ✅ Error logging ke database
- ✅ Request validation dengan Zod

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Edit `.env` file:

```env
DATABASE_URL="your-postgres-connection-string"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="3600"
PAYMENT_CALLBACK_SECRET="your-payment-callback-secret"
PORT="3000"
NODE_ENV="development"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed sample data
npx tsx prisma/seed.ts
```

### 4. Run Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

Server akan berjalan di `http://localhost:3000`

## API Documentation

Dokumentasi lengkap tersedia di Swagger UI:

```
http://localhost:3000/docs
```

## Test Credentials

Setelah seeding, gunakan kredensial berikut:

**Admin Account:**

- Email: `admin@bookstore.com`
- Password: `admin123`

**Customer Accounts:**

- Email: `customer1@example.com` / Password: `customer123`
- Email: `customer2@example.com` / Password: `customer123`

## API Endpoints

### Authentication

- `POST /auth/register` - Register user baru
- `POST /auth/login` - Login (return JWT token)
- `POST /auth/logout` - Logout (invalidate session)

### Books (Public)

- `GET /books` - List buku in-stock
- `GET /books/:id` - Detail buku

### Cart (Customer)

- `GET /cart` - View cart
- `POST /cart/items` - Add item to cart
- `PATCH /cart/items/:id` - Update item quantity
- `DELETE /cart/items/:id` - Remove item

### Orders (Customer)

- `POST /orders/checkout` - Checkout cart (dengan idempotency-key header)
- `GET /orders` - View order history
- `GET /orders/:id` - View order detail

### Payments

- `POST /payments/callback` - Payment callback webhook

### Admin - Books

- `GET /books/admin/all` - List semua buku
- `POST /books/admin` - Create buku
- `PATCH /books/admin/:id` - Update buku
- `PATCH /books/admin/:id/stock` - Update stok (delta)
- `DELETE /books/admin/:id` - Delete buku

### Admin - Reports

- `GET /admin/transactions` - List semua transaksi
- `GET /admin/reports/sales` - Sales report

## Security Features

### Single Active Session

Setiap user hanya bisa punya 1 active session. Login baru akan invalidate session lama.

### Race Condition Protection

Checkout menggunakan Prisma interactive transaction dengan atomic stock check:

```typescript
await tx.book.updateMany({
  where: { id: bookId, stock: { gte: qty } },
  data: { stock: { decrement: qty } },
});
```

### Rate Limiting

- Global: 100 requests per 15 menit
- Sensitive endpoints (auth, checkout): 10 requests per 5 menit

### Idempotent Checkout

Gunakan header `Idempotency-Key` untuk prevent duplicate orders:

```bash
curl -X POST http://localhost:3000/orders/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Idempotency-Key: unique-key-123"
```

## Testing Payment Callback

Generate signature untuk testing:

```typescript
import crypto from "crypto";

const orderId = "your-order-id";
const status = "SUCCESS"; // atau 'FAILED'
const secret = process.env.PAYMENT_CALLBACK_SECRET;

const signature = crypto
  .createHmac("sha256", secret)
  .update(`${orderId}:${status}`)
  .digest("hex");
```

Kemudian kirim callback:

```bash
curl -X POST http://localhost:3000/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "your-order-id",
    "status": "SUCCESS",
    "providerRef": "PAY123456",
    "signature": "generated-signature"
  }'
```

## Database Schema

### User

- Single session enforcement via `currentJti` & `tokenVersion`
- Roles: ADMIN, CUSTOMER

### Book

- Stock management dengan atomic operations
- Soft delete via `isActive` flag

### Cart & CartItem

- Snapshot harga di `unitPrice` saat add to cart

### Order & OrderItem

- Immutable setelah payment
- Status: CREATED, PAID, FAILED

### Payment

- Idempotency via `idempotencyKey`
- Status: PENDING, SUCCESS, FAILED

### ErrorLog

- Automatic logging untuk errors & warnings

## Deployment

### Environment Variables

Pastikan set semua ENV di production:

- `DATABASE_URL` - Production PostgreSQL URL
- `JWT_SECRET` - Strong secret key
- `PAYMENT_CALLBACK_SECRET` - Shared secret dengan payment provider
- `NODE_ENV=production`

### Build & Run

```bash
npm run build
npm start
```

## License

MIT

## Author

Created for backend test assignment.
