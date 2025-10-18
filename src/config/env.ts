import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10),
  },
  
  payment: {
    callbackSecret: process.env.PAYMENT_CALLBACK_SECRET || 'payment-secret',
  },
  
  rateLimit: {
    // More lenient for development, stricter for production
    windowMs: parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || 
      (process.env.NODE_ENV === 'production' ? '900000' : '900000'), 
      10
    ), // 15 minutes
    max: parseInt(
      process.env.RATE_LIMIT_MAX || 
      (process.env.NODE_ENV === 'production' ? '100' : '1000'), 
      10
    ), // 1000 for dev, 100 for prod
    sensitiveWindowMs: parseInt(
      process.env.RATE_LIMIT_SENSITIVE_WINDOW_MS || 
      (process.env.NODE_ENV === 'production' ? '300000' : '300000'), 
      10
    ), // 5 minutes
    sensitiveMax: parseInt(
      process.env.RATE_LIMIT_SENSITIVE_MAX || 
      (process.env.NODE_ENV === 'production' ? '5' : '50'), 
      10
    ), // 50 for dev, 5 for prod
  },
};
