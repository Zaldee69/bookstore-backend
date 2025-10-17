import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service.js';
import { z } from 'zod';

const paymentsService = new PaymentsService();

const callbackSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  providerRef: z.string().optional(),
  signature: z.string(),
});

export class PaymentsController {
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
