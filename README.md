# Book E-Commerce Backend API

Backend API untuk e-commerce buku dengan fitur authentication, role-based access control (RBAC), manajemen transaksi aman, rate limiting, error logging, dan full CI/CD deployment.

## 🌐 Live API

**Production:** `https://api.zaldee.app`

**Documentation:** `https://api.zaldee.app/docs`

## Tech Stack

- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: JWT (1 jam expiry) + Single Active Session
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: Swagger UI
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: VPS (Auto-deploy on push to main)
- **Reports**: Excel generation (ExcelJS)

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
- ✅ View payment history dengan detail lengkap
- ✅ Simulate payment untuk testing

### Admin Features

- ✅ CRUD buku (create, read, update, delete)
- ✅ Manage stok buku (increment/decrement)
- ✅ View semua transaksi
- ✅ Sales report (total terjual, revenue, sisa stok)
- ✅ Download sales report sebagai Excel (.xlsx)

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

Create `.env` file:

```env
# Database (Supabase)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"  # Connection Pooling
DIRECT_URL="postgresql://user:pass@host:5432/db"  # For Prisma migrations

# API Configuration
API_URL="http://localhost:3000"  # For production: https://api.zaldee.app
PORT="3000"
NODE_ENV="development"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="3600"

# Payment
PAYMENT_CALLBACK_SECRET="your-payment-callback-secret"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"  # 15 minutes
RATE_LIMIT_MAX="100"
RATE_LIMIT_SENSITIVE_WINDOW_MS="300000"  # 5 minutes
RATE_LIMIT_SENSITIVE_MAX="5"
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

### Payments (Customer)

- `POST /payments/simulate` - Generate payment callback data (testing)
- `GET /payments/history` - View payment history dengan detail order

### Payments (Webhook)

- `POST /payments/callback` - Payment gateway callback webhook

### Admin - Books

- `GET /books/admin/all` - List semua buku
- `POST /books/admin` - Create buku
- `PATCH /books/admin/:id` - Update buku
- `PATCH /books/admin/:id/stock` - Update stok (delta)
- `DELETE /books/admin/:id` - Delete buku

### Admin - Reports

- `GET /admin/transactions` - List semua transaksi
- `GET /admin/reports/sales` - Sales report (JSON)
- `GET /admin/reports/sales/excel` - Download sales report (Excel)

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

### Method 1: Using Simulate Endpoint (Recommended)

**Step 1: Generate callback data**
```bash
curl -X POST http://localhost:3000/payments/simulate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "your-order-id",
    "status": "SUCCESS"
  }'
```

Response akan berisi callback URL dan payload dengan signature yang sudah auto-generated.

**Step 2: Send callback**
Copy payload dari response Step 1, lalu:
```bash
curl -X POST http://localhost:3000/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "your-order-id",
    "status": "SUCCESS",
    "providerRef": "SIM-1234567890",
    "signature": "auto-generated-from-step-1"
  }'
```

### Method 2: Manual dengan Script

Generate signature secara manual:

```bash
npx tsx scripts/generateSignature.ts ORDER_ID SUCCESS
```

Kemudian hit callback endpoint dengan signature yang di-generate.

### Method 3: Postman Collection

Import `postman_collection.json` dan gunakan:
1. **Generate Callback - SUCCESS** request
2. Copy payload dari response
3. **Payment Callback - SUCCESS** request dengan payload yang sudah dicopy

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

## 🚀 Deployment

### Docker Deployment

**Build and run with Docker Compose:**

```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Or use Makefile shortcuts:**

```bash
make build        # Build Docker image
make up           # Start container
make logs         # View logs
make restart      # Restart container
make migrate      # Run migrations
make db-studio    # Open Prisma Studio
```

### CI/CD Pipeline

**Automatic deployment on push to `main`:**

1. ✅ Lint & Test (TypeScript compilation)
2. ✅ Build Docker image
3. ✅ Push to Docker Hub
4. ✅ Auto-deploy to VPS
5. ✅ Run migrations
6. ✅ Health check
7. ✅ Success! 🎉

**GitHub Actions Workflow:**
- Triggered on push to `main`
- Runs tests and builds
- Deploys to production automatically
- See `.github/workflows/ci-cd.yml`

### Production Environment

**Required GitHub Secrets:**

**Docker Hub (2 secrets):**
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub access token

**Database (2 secrets):**
- `DATABASE_URL` - Supabase connection pooling URL (port 6543)
- `DIRECT_URL` - Supabase direct connection URL (port 5432)

**Security (2 secrets):**
- `JWT_SECRET` - Strong JWT secret key
- `PAYMENT_CALLBACK_SECRET` - Payment callback secret

**VPS (4 secrets):**
- `VPS_HOST` - VPS IP address or domain
- `VPS_USER` - SSH username (e.g., root)
- `VPS_PORT` - SSH port (default: 22)
- `VPS_SSH_KEY` - SSH private key for deployment

**Generate secrets:**
```bash
# JWT and Payment secrets
openssl rand -hex 32

# SSH key for VPS
ssh-keygen -t ed25519 -f ~/.ssh/github-actions-vps
```

### Domain Setup

**Production API:** `https://api.zaldee.app`

**DNS Configuration:**
1. Add A record: `api` → VPS IP
2. Wait for DNS propagation

**Nginx + SSL:**
```bash
# On VPS
sudo apt install nginx certbot python3-certbot-nginx

# Setup SSL
sudo certbot --nginx -d api.zaldee.app
```

See full guide in repository documentation.

## License

MIT

## Author

Created for backend test assignment.
