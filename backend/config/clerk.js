const { requireAuth: clerkRequireAuth, withAuth } = require("@clerk/express");

const requireAuth = clerkRequireAuth();

const addUserToRequest = (req, res, next) => {
  if (req.auth && req.auth.userId) {
    req.user = {
      id: req.auth.userId,
      email: req.auth.sessionId || "anonymous"
    };
  }
  next();
};

module.exports = {
  requireAuth,
  addUserToRequest,
  withAuth
};