import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";

const router = Router();
const adminController = new AdminController();

// All admin routes require ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

/**
 * @swagger
 * /admin/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: View all checkout transactions with user info, items, and payment status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all transactions
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
 *                       userId:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [CREATED, PAID, FAILED]
 *                       total:
 *                         type: number
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             bookId:
 *                               type: string
 *                             qty:
 *                               type: integer
 *                             price:
 *                               type: number
 *                             book:
 *                               type: object
 *                       payment:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             enum: [PENDING, SUCCESS, FAILED]
 *                           amount:
 *                             type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get("/transactions", adminController.getTransactions);

/**
 * @swagger
 * /admin/reports/sales:
 *   get:
 *     summary: Get sales report
 *     description: Generate comprehensive sales report with revenue, units sold, and per-book statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                           example: 5400000
 *                         totalBooksSold:
 *                           type: integer
 *                           example: 15
 *                         totalOrders:
 *                           type: integer
 *                           example: 5
 *                     bookSales:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookId:
 *                             type: string
 *                           title:
 *                             type: string
 *                           author:
 *                             type: string
 *                           totalSold:
 *                             type: integer
 *                             description: Total units sold
 *                           currentStock:
 *                             type: integer
 *                             description: Remaining stock
 *                           revenue:
 *                             type: number
 *                             description: Total revenue from this book
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get("/reports/sales", adminController.getSalesReport);

/**
 * @swagger
 * /admin/reports/sales/excel:
 *   get:
 *     summary: Download sales report as Excel
 *     description: Download comprehensive sales report in Excel format (.xlsx) with formatted sheets, charts, and summaries (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: 'attachment; filename="Sales_Report_YYYY-MM-DD.xlsx"'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get("/reports/sales/excel", adminController.downloadSalesExcel);

export default router;
