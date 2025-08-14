// In‑memory tracking of failed login attempts per IP
const ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_FAILS = 5; // After 5 failed attempts, next failure triggers ban
const loginAttempts = {}; // ip -> { fails, firstFail, bannedUntil }

const login = (req, res) => {
  if (!process.env.LOGIN_PASSWORD) {
    console.warn('LOGIN_PASSWORD not set; all logins will fail.');
  }
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  let entry = loginAttempts[ip];

  // Reset window if expired
  if (entry && now - entry.firstFail > ATTEMPT_WINDOW_MS) {
    delete loginAttempts[ip];
    entry = undefined;
  }

  // Check ban
  if (entry?.bannedUntil && now < entry.bannedUntil) {
    console.log(`Login blocked (banned) for IP ${ip}`);
    return res.status(429).json({
      message: 'För många misslyckade försök. Försök igen om 24 timmar.'
    });
  }

  const { password } = req.body;
  if (password === process.env.LOGIN_PASSWORD) {
    // Successful login clears failures
    if (entry) delete loginAttempts[ip];
    console.log(`Login success for IP ${ip}`);
    return res.json({ success: true });
  }

  // Failed attempt handling
  if (!entry) {
    entry = { fails: 0, firstFail: now, bannedUntil: 0 };
    loginAttempts[ip] = entry;
  }

  entry.fails += 1;

  // If exceeds max fails, ban for 24h
  if (entry.fails > MAX_FAILS) {
    entry.bannedUntil = now + ATTEMPT_WINDOW_MS;
    console.log(`IP ${ip} banned (fail count ${entry.fails})`);
    return res.status(429).json({
      message: 'Du har överskridit max antal försök och är blockerad i 24 timmar.'
    });
  }

  const remaining = MAX_FAILS - entry.fails + 1; // +1 because ban applies after exceeding MAX_FAILS
  console.log(`Login fail ${entry.fails} for IP ${ip} (remaining before ban: ${remaining})`);
  return res.status(401).json({
    message: `Fel lösenord. Du har ${remaining} försök kvar innan du blockeras i 24 timmar.`
  });
};

module.exports = { login };
