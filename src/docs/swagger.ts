import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Book E-Commerce API",
      version: "1.0.0",
      description: `
# Book E-Commerce Backend API

Complete REST API untuk sistem e-commerce penjualan buku dengan fitur authentication, role-based access control, shopping cart, checkout, dan payment callback.

## Features
- JWT Authentication dengan single active session
- Role-based access control (Customer & Admin)
- Book catalog management
- Shopping cart system
- Checkout & payment processing
- Sales reporting untuk admin
- Race condition prevention di transactional operations
- Rate limiting untuk security
- Error logging ke database

## Authentication
Most endpoints require authentication menggunakan Bearer token di header:
\`\`\`
Authorization: Bearer <JWT_TOKEN>
\`\`\`

Get token melalui endpoint \`POST /auth/login\`.

## Test Accounts
**Customer:**
- Email: customer1@example.com
- Password: customer123

**Admin:**
- Email: admin@example.com  
- Password: admin123

## Payment Callback
Karena belum ada integrasi payment gateway, gunakan script untuk simulate payment callback:
\`\`\`bash
npx tsx scripts/generateSignature.ts <ORDER_ID> SUCCESS
\`\`\`
      `,
      contact: {
        name: "API Support",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "https://api.zaldee.app",
        description: "Production server",
      },
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "http://localhost:3001",
        description: "Alternative development server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints - register, login, logout",
      },
      {
        name: "Books - Customer",
        description: "Public book endpoints - view books in stock",
      },
      {
        name: "Books - Admin",
        description: "Admin book management - CRUD operations",
      },
      {
        name: "Cart",
        description: "Shopping cart management",
      },
      {
        name: "Orders",
        description: "Order processing & checkout",
      },
      {
        name: "Payments",
        description: "Payment callback webhook",
      },
      {
        name: "Admin",
        description: "Admin reports & transactions",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token from login endpoint",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "ERROR_CODE",
                },
                message: {
                  type: "string",
                  example: "Error message description",
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication required or token invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ForbiddenError: {
          description: "Insufficient permissions",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        RateLimitError: {
          description: "Too many requests",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.routes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
};
