import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const errorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Log error to database
  await logger.error(message, err.stack, {
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    body: req.body,
  });

  res.status(statusCode).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message,
    },
  });
};

export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
    this.name = "AppError";
  }
}
