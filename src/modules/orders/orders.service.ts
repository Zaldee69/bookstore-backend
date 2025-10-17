import prisma from "../../db/prisma.js";
import { AppError } from "../../middlewares/error.js";
import { logger } from "../../utils/logger.js";

export class OrdersService {
  async checkout(userId: string, idempotencyKey?: string) {
    // Check for existing payment with same idempotency key
    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { order: true },
      });

      if (existingPayment) {
        return {
          order: existingPayment.order,
          payment: existingPayment,
          message: "Order already processed (idempotent)",
        };
      }
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError(400, "CART_EMPTY", "Cart is empty");
    }

    // Use interactive transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      const orderItems: Array<{ bookId: string; qty: number; price: number }> =
        [];
      let total = 0;

      // Process each cart item with safe stock decrement
      for (const item of cart.items) {
        // Atomic stock check and decrement
        const updateResult = await tx.book.updateMany({
          where: {
            id: item.bookId,
            stock: { gte: item.qty },
            isActive: true,
          },
          data: {
            stock: { decrement: item.qty },
          },
        });

        if (updateResult.count === 0) {
          // Log the failure
          await logger.error("Insufficient stock during checkout", undefined, {
            userId,
            bookId: item.bookId,
            requestedQty: item.qty,
            bookTitle: item.book.title,
          });

          throw new AppError(
            409,
            "INSUFFICIENT_STOCK",
            `Insufficient stock for book: ${item.book.title}`
          );
        }

        orderItems.push({
          bookId: item.bookId,
          qty: item.qty,
          price: item.unitPrice,
        });

        total += item.qty * item.unitPrice;
      }

      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          status: "CREATED",
          total,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              book: true,
            },
          },
        },
      });

      // Create payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          status: "PENDING",
          amount: total,
          idempotencyKey,
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return { order, payment };
    });

    return {
      order: result.order,
      payment: result.payment,
      message: "Checkout successful",
    };
  }

  async getOrders(userId: string) {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            book: true,
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            book: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
    }

    return order;
  }
}
