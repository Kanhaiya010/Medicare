import { clerkMiddleware, requireAuth } from "@clerk/express";

const authUnavailable = (res) =>
  res.status(503).json({
    success: false,
    message:
      "Authentication is unavailable. Set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY in backend .env.",
  });

const hasClerkConfig = () =>
  Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);

export const maybeClerkMiddleware = (req, res, next) => {
  if (!hasClerkConfig()) return next();
  const run = clerkMiddleware();
  try {
    return run(req, res, (err) => {
      if (err) {
        console.warn("Clerk middleware skipped:", err?.message || err);
        return next();
      }
      return next();
    });
  } catch (err) {
    console.warn("Clerk middleware failed, continuing without auth:", err);
    return next();
  }
};

export const requireClerkAuth = (req, res, next) => {
  if (!hasClerkConfig()) return authUnavailable(res);
  return requireAuth()(req, res, next);
};
