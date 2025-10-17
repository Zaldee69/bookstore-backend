import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const globalRateLimit = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const sensitiveRateLimit = rateLimit({
  windowMs: env.rateLimit.sensitiveWindowMs,
  max: env.rateLimit.sensitiveMax,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message:
        "Too many requests to sensitive endpoint, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
