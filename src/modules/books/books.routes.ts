import { Router } from "express";
import { BooksController } from "./books.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";

const router = Router();
const booksController = new BooksController();

// Customer routes

/**
 * @swagger
 * /books:
 *   get:
 *     summary: List books in stock
 *     description: Get all books that are currently in stock and active (Customer view)
 *     tags: [Books - Customer]
 *     security: []
 *     responses:
 *       200:
 *         description: List of books in stock
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
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       author:
 *                         type: string
 *                       price:
 *                         type: number
 *                       stock:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get("/", booksController.listBooksInStock);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get book by ID
 *     description: Get detailed information of a specific book
 *     tags: [Books - Customer]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book details
 *       404:
 *         description: Book not found
 */
router.get("/:id", booksController.getBookById);

// Admin routes

/**
 * @swagger
 * /books/admin/all:
 *   get:
 *     summary: List all books (Admin)
 *     description: Get all books including out of stock (Admin only)
 *     tags: [Books - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all books
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  "/admin/all",
  requireAuth,
  requireRole("ADMIN"),
  booksController.listAllBooks
);

/**
 * @swagger
 * /books/admin:
 *   post:
 *     summary: Create new book
 *     description: Add a new book to catalog (Admin only)
 *     tags: [Books - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - price
 *               - stock
 *             properties:
 *               title:
 *                 type: string
 *                 example: Clean Code
 *               author:
 *                 type: string
 *                 example: Robert C. Martin
 *               price:
 *                 type: number
 *                 example: 450000
 *               stock:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       201:
 *         description: Book created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  booksController.createBook
);

/**
 * @swagger
 * /books/admin/{id}:
 *   patch:
 *     summary: Update book details
 *     description: Update book title, author, price, or active status (Admin only)
 *     tags: [Books - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               price:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       404:
 *         description: Book not found
 */
router.patch(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN"),
  booksController.updateBook
);

/**
 * @swagger
 * /books/admin/{id}/stock:
 *   patch:
 *     summary: Update book stock
 *     description: Increase or decrease book stock (Admin only)
 *     tags: [Books - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delta
 *             properties:
 *               delta:
 *                 type: integer
 *                 description: Stock change (positive to add, negative to reduce)
 *                 example: 10
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Invalid stock value
 *       404:
 *         description: Book not found
 */
router.patch(
  "/admin/:id/stock",
  requireAuth,
  requireRole("ADMIN"),
  booksController.updateStock
);

/**
 * @swagger
 * /books/admin/{id}:
 *   delete:
 *     summary: Delete book
 *     description: Remove book from catalog (Admin only)
 *     tags: [Books - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 */
router.delete(
  "/admin/:id",
  requireAuth,
  requireRole("ADMIN"),
  booksController.deleteBook
);

export default router;
