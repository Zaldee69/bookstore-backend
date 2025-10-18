import { Router } from "express";
import { PaymentsController } from "./payments.controller.js";
import { sensitiveRateLimit } from "../../middlewares/rateLimit.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();
const paymentsController = new PaymentsController();

/**
 * @swagger
 * /payments/simulate:
 *   post:
 *     summary: Generate payment callback data (Testing)
 *     description: |
 *       Generate payment callback URL and payload with auto-generated signature for testing purposes.
 *       Returns the callback URL and payload that you need to POST separately to actually process the payment.
 *       
 *       **Workflow:**
 *       1. Call this endpoint to generate callback data
 *       2. Copy the returned callbackUrl and payload
 *       3. Make a separate POST request to the callbackUrl with the payload
 *       4. Payment status will be updated
 *       
 *       **Note:** In production, payment gateway will call the callback endpoint directly.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - status
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: Order ID from checkout
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *                 description: Desired payment status
 *                 example: SUCCESS
 *     responses:
 *       200:
 *         description: Callback data generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment callback data generated
 *                 instructions:
 *                   type: string
 *                   example: Use the callbackUrl and payload to simulate payment callback. Send a POST request with the payload to update payment status.
 *                 data:
 *                   type: object
 *                   properties:
 *                     callbackUrl:
 *                       type: string
 *                       example: http://localhost:3000/payments/callback
 *                     method:
 *                       type: string
 *                       example: POST
 *                     headers:
 *                       type: object
 *                       properties:
 *                         Content-Type:
 *                           type: string
 *                           example: application/json
 *                     payload:
 *                       type: object
 *                       properties:
 *                         orderId:
 *                           type: string
 *                         status:
 *                           type: string
 *                         providerRef:
 *                           type: string
 *                         signature:
 *                           type: string
 *       400:
 *         description: Invalid request body
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Payment not found
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  "/simulate",
  requireAuth,
  sensitiveRateLimit,
  paymentsController.simulatePayment
);

/**
 * @swagger
 * /payments/history:
 *   get:
 *     summary: Get payment history
 *     description: Retrieve authenticated user's payment history with order details and items
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment history retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 550e8400-e29b-41d4-a716-446655440000
 *                       orderId:
 *                         type: string
 *                         example: 550e8400-e29b-41d4-a716-446655440001
 *                       amount:
 *                         type: number
 *                         example: 85000
 *                       status:
 *                         type: string
 *                         enum: [PENDING, SUCCESS, FAILED]
 *                         example: SUCCESS
 *                       providerRef:
 *                         type: string
 *                         example: PAY-12345
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       order:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [CREATED, PAID, FAILED]
 *                           total:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 bookId:
 *                                   type: string
 *                                 title:
 *                                   type: string
 *                                 author:
 *                                   type: string
 *                                 qty:
 *                                   type: number
 *                                 price:
 *                                   type: number
 *                                 subtotal:
 *                                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/history", requireAuth, paymentsController.getPaymentHistory);

/**
 * @swagger
 * /payments/callback:
 *   post:
 *     summary: Payment gateway callback
 *     description: Webhook endpoint for payment status updates (SUCCESS/FAILED/PENDING). Validates signature and updates order/payment status atomically. Restores stock if payment fails.
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - status
 *               - signature
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               status:
 *                 type: string
 *                 enum: [PENDING, SUCCESS, FAILED]
 *                 example: SUCCESS
 *               providerRef:
 *                 type: string
 *                 description: Payment provider reference
 *                 example: PAY-12345
 *               signature:
 *                 type: string
 *                 description: HMAC SHA256 signature (orderId:status)
 *                 example: a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4...
 *     responses:
 *       200:
 *         description: Payment status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment status updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     orderId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     providerRef:
 *                       type: string
 *       401:
 *         description: Invalid signature
 *       404:
 *         description: Payment not found
 *       429:
 *         description: Rate limit exceeded
 */
router.post("/callback", sensitiveRateLimit, paymentsController.handleCallback);

export default router;
