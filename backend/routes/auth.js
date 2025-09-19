const express = require("express");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

router.get("/check", protect, (req, res) => {
  res.json({ authenticated: true, userId: req.user.id });
});

module.exports = router;