import rateLimit from "express-rate-limit";

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message:
    "Too many password reset attempts, please try again after 15 minutes",
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const createPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 35,
  message:
    "Too many posts created from this IP, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
});

export const createJournalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 35,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many journals created. Please try again in an hour.",
});

export const getJournalsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many bulk journal requests. Please try again later.",
});
