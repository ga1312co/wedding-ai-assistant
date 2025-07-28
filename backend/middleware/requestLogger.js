const requestLogger = (req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
};

module.exports = requestLogger;
