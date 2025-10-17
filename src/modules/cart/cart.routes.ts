import { Router } from "express";
import { CartController } from "./cart.controller.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();
const cartController = new CartController();

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get shopping cart
 *     description: Get current user's shopping cart with all items
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shopping cart data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           bookId:
 *                             type: string
 *                           title:
 *                             type: string
 *                           author:
 *                             type: string
 *                           qty:
 *                             type: integer
 *                           unitPrice:
 *                             type: number
 *                           subtotal:
 *                             type: number
 *                           stock:
 *                             type: integer
 *                     total:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, cartController.getCart);

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Add item to cart
 *     description: Add a book to shopping cart (checks stock availability)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *               - qty
 *             properties:
 *               bookId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               qty:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added to cart
 *       400:
 *         description: Invalid quantity
 *       404:
 *         description: Book not found
 *       409:
 *         description: Insufficient stock
 */
router.post("/items", requireAuth, cartController.addItem);

/**
 * @swagger
 * /cart/items/{id}:
 *   patch:
 *     summary: Update cart item quantity
 *     description: Update quantity of an item in cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qty
 *             properties:
 *               qty:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Item updated
 *       404:
 *         description: Item not found
 *       409:
 *         description: Insufficient stock
 */
router.patch("/items/:id", requireAuth, cartController.updateItem);

/**
 * @swagger
 * /cart/items/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Delete an item from shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       404:
 *         description: Item not found
 */
router.delete("/items/:id", requireAuth, cartController.removeItem);

export default router;
