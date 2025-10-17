import { Response, NextFunction } from "express";
import { OrdersService } from "./orders.service.js";
import { AuthRequest } from "../../middlewares/auth.js";

const ordersService = new OrdersService();

export class OrdersController {
  async checkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      const idempotencyKey = req.headers["idempotency-key"] as
        | string
        | undefined;

      const result = await ordersService.checkout(req.user.id, idempotencyKey);

      res.status(201).json({
        message: result.message,
        data: {
          orderId: result.order.id,
          total: result.order.total,
          status: result.order.status,
          paymentStatus: result.payment.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      const orders = await ordersService.getOrders(req.user.id);
      res.status(200).json({ data: orders });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      const order = await ordersService.getOrderById(
        req.user.id,
        req.params.id
      );
      res.status(200).json({ data: order });
    } catch (error) {
      next(error);
    }
  }
}
