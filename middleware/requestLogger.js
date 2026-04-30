const requestLogger = (scope = "api") => (req, res, next) => {
  const startedAt = Date.now();
  const hasBody = req.body && Object.keys(req.body).length > 0;

  console.log(
    `[${scope}] -> ${req.method} ${req.originalUrl} body=${hasBody ? JSON.stringify(req.body) : "{}"}`,
  );

  res.on("finish", () => {
    const elapsed = Date.now() - startedAt;
    console.log(
      `[${scope}] <- ${req.method} ${req.originalUrl} status=${res.statusCode} ${elapsed}ms`,
    );
  });

  next();
};

module.exports = requestLogger;
