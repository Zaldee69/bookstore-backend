import { Request, Response, NextFunction } from "express";
import { CartService } from "./cart.service.js";
import { AuthRequest } from "../../middlewares/auth.js";
import { z } from "zod";

const cartService = new CartService();

const addItemSchema = z.object({
  bookId: z.string().uuid(),
  qty: z.number().int().positive(),
});

const updateItemSchema = z.object({
  qty: z.number().int().positive(),
});

export class CartController {
  async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      const cart = await cartService.getCart(req.user.id);
      console.log(cart);
      res.status(200).json({ data: cart });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      const validated = addItemSchema.parse(req.body);
      const cart = await cartService.addItem(
        req.user.id,
        validated.bookId,
        validated.qty
      );

      res.status(200).json({
        message: "Item added to cart",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      const validated = updateItemSchema.parse(req.body);
      const cart = await cartService.updateItem(
        req.user.id,
        req.params.id,
        validated.qty
      );

      res.status(200).json({
        message: "Cart item updated",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        });
      }

      const cart = await cartService.removeItem(req.user.id, req.params.id);

      res.status(200).json({
        message: "Item removed from cart",
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }
}
