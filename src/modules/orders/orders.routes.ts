import { Router } from "express";
import { OrdersController } from "./orders.controller.js";
import { requireAuth } from "../../middlewares/auth.js";
import { sensitiveRateLimit } from "../../middlewares/rateLimit.js";

const router = Router();
const ordersController = new OrdersController();

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Checkout cart
 *     description: Process checkout - creates order, payment, and decrements stock atomically. Supports idempotency via X-Idempotency-Key header.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Idempotency-Key
 *         schema:
 *           type: string
 *         description: Idempotency key to prevent duplicate orders
 *         example: unique-key-12345
 *     responses:
 *       201:
 *         description: Checkout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Checkout successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       format: uuid
 *                     total:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [CREATED, PAID, FAILED]
 *                     paymentStatus:
 *                       type: string
 *                       enum: [PENDING, SUCCESS, FAILED]
 *       400:
 *         description: Cart is empty
 *       409:
 *         description: Insufficient stock (race condition prevented)
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  "/checkout",
  requireAuth,
  sensitiveRateLimit,
  ordersController.checkout
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user's orders
 *     description: Get all orders for current user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                       total:
 *                         type: number
 *                       items:
 *                         type: array
 *                       payment:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/", requireAuth, ordersController.getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     description: Get detailed order information
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get("/:id", requireAuth, ordersController.getOrderById);

export default router;
