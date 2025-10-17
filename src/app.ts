import express from "express";
import helmet from "helmet";
import cors from "cors";
import { globalRateLimit } from "./middlewares/rateLimit.js";
import { errorHandler } from "./middlewares/error.js";
import { setupSwagger } from "./docs/swagger.js";

// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import booksRoutes from "./modules/books/books.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // ✅ CORS Configuration (CRITICAL: Must be before routes)
  app.use(
    cors({
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173", // Vite default
        "http://localhost:5174", // Vite alternative
      ],
      credentials: true, // Allow cookies and auth headers
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key",
        "X-Idempotency-Key",
        "Accept",
        "Origin",
      ],
      exposedHeaders: ["X-Total-Count", "X-Page", "X-Per-Page"], // For pagination
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400, // Cache preflight for 24 hours
    })
  );

  // Body parser
  app.use(express.json({ limit: "200kb" }));
  app.use(express.urlencoded({ extended: true, limit: "200kb" }));

  // Request logging (development only)
  if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
      console.log(
        `${req.method} ${req.url} | Origin: ${req.headers.origin || "none"}`
      );
      next();
    });
  }

  // Rate limiting
  app.use(globalRateLimit);

  // API Documentation
  setupSwagger(app);

  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Routes
  app.use("/auth", authRoutes);
  app.use("/books", booksRoutes);
  app.use("/cart", cartRoutes);
  app.use("/orders", ordersRoutes);
  app.use("/payments", paymentsRoutes);
  app.use("/admin", adminRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};
