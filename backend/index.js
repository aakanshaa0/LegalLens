require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const translationRoutes = require("./routes/translation");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);
app.use("/translation", translationRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Legal Lens AI is running" });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
});
