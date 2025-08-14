const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_QUESTIONS = 50;
const WARN_AT = 40;

const store = {}; // { ip: { count, first } }

module.exports = function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  let entry = store[ip];
  if (!entry || now - entry.first > WINDOW_MS) {
    entry = { count: 0, first: now };
    store[ip] = entry;
  }

  if (entry.count >= MAX_QUESTIONS) {
    return res.status(429).json({
      error: 'rate_limit',
      message: 'Jag behöver vila nu och kan inte svara på fler frågor idag. Försök igen om 24 timmar.'
    });
  }

  entry.count += 1;
  req.rateLimit = {
    count: entry.count,
    remaining: Math.max(0, MAX_QUESTIONS - entry.count),
    shouldWarn: entry.count === WARN_AT
  };
  next();
};
