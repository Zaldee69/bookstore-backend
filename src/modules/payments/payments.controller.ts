import { Request, Response, NextFunction } from "express";
import { PaymentsService } from "./payments.service.js";
import { z } from "zod";

const paymentsService = new PaymentsService();

const callbackSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED"]),
  providerRef: z.string().optional(),
  signature: z.string(),
});

const simulateSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["SUCCESS", "FAILED"]),
});

export class PaymentsController {
  async simulatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = simulateSchema.parse(req.body);
      const result = await paymentsService.generateCallbackData(
        validated.orderId,
        validated.status
      );

      res.status(200).json({
        message: "Payment callback data generated",
        data: result,
        instructions:
          "Use the callbackUrl and payload to simulate payment callback. Send a POST request with the payload to update payment status.",
      });
    } catch (error) {
      next(error);
    }
  }
  async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const payments = await paymentsService.getPaymentHistory(userId);

      res.status(200).json({
        message: "Payment history retrieved successfully",
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = callbackSchema.parse(req.body);
      const result = await paymentsService.handleCallback(validated);

      res.status(200).json({
        message: result.message,
        data: result.payment,
      });
    } catch (error) {
      next(error);
    }
  }
}
