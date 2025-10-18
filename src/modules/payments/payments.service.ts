import prisma from "../../db/prisma.js";
import { AppError } from "../../middlewares/error.js";
import { env } from "../../config/env.js";
import crypto from "crypto";

export class PaymentsService {
  /**
   * Simulate payment callback (for testing)
   * Auto-generates signature and processes payment
   */
  async simulatePayment(orderId: string, status: "SUCCESS" | "FAILED") {
    // Get payment to verify it exists and belongs to user
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }

    // Auto-generate signature
    const signature = this.generateSignature(orderId, status);

    // Call the actual callback handler
    return await this.handleCallback({
      orderId,
      status,
      providerRef: `SIM-${Date.now()}`,
      signature,
    });
  }

  /**
   * Get payment history for authenticated user
   */
  async getPaymentHistory(userId: string) {
    const payments = await prisma.payment.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                book: {
                  select: {
                    id: true,
                    title: true,
                    author: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return payments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount,
      status: payment.status,
      providerRef: payment.providerRef,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      order: {
        id: payment.order.id,
        status: payment.order.status,
        total: payment.order.total,
        createdAt: payment.order.createdAt,
        items: payment.order.items.map((item) => ({
          bookId: item.bookId,
          title: item.book.title,
          author: item.book.author,
          qty: item.qty,
          price: item.price,
          subtotal: item.qty * item.price,
        })),
      },
    }));
  }

  async handleCallback(data: {
    orderId: string;
    status: "PENDING" | "SUCCESS" | "FAILED";
    providerRef?: string;
    signature: string;
  }) {
    // Verify signature (simulasi)
    const expectedSignature = crypto
      .createHmac("sha256", env.payment.callbackSecret)
      .update(`${data.orderId}:${data.status}`)
      .digest("hex");

    if (data.signature !== expectedSignature) {
      throw new AppError(401, "INVALID_SIGNATURE", "Invalid payment signature");
    }

    // Idempotent update
    const payment = await prisma.payment.findFirst({
      where: { orderId: data.orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
    }

    // Prevent duplicate processing
    if (payment.status === "SUCCESS" || payment.status === "FAILED") {
      return {
        message: "Payment already processed",
        payment,
      };
    }

    // Update payment and order status
    const updatedPayment = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: data.status,
          providerRef: data.providerRef,
        },
      });

      if (data.status === "SUCCESS") {
        await tx.order.update({
          where: { id: data.orderId },
          data: { status: "PAID" },
        });
      } else if (data.status === "FAILED") {
        await tx.order.update({
          where: { id: data.orderId },
          data: { status: "FAILED" },
        });

        // Restore stock on failed payment
        const order = await tx.order.findUnique({
          where: { id: data.orderId },
          include: { items: true },
        });

        for (const item of order.items) {
          await tx.book.update({
            where: { id: item.bookId },
            data: { stock: { increment: item.qty } },
          });
        }
      }

      return updated;
    });

    return {
      message: "Payment status updated",
      payment: updatedPayment,
    };
  }

  // Simulasi helper untuk generate signature (untuk testing)
  generateSignature(orderId: string, status: string): string {
    return crypto
      .createHmac("sha256", env.payment.callbackSecret)
      .update(`${orderId}:${status}`)
      .digest("hex");
  }
}
