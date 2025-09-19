const { requireAuth, addUserToRequest } = require("../config/clerk");

const protect = [requireAuth, addUserToRequest];

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return requireAuth(req, res, (err) => {
      if (err) return next(err);
      addUserToRequest(req, res, next);
    });
  }
  next();
};

module.exports = {
  protect,
  optionalAuth
};