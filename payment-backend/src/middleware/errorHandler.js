export const errorHandler = (err, req, res, next) => {
  console.error("❌ FULL ERROR:", err);
  console.error("❌ STACK TRACE:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
    stack: err.stack, // <-- temporary, remove in production
  });
};
