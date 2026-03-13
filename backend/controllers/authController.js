const path = require('path');
const fs = require('fs');

// Load guest list
const guestListPath = path.join(__dirname, '..', 'data', 'guestList.json');
let guestList = [];
try {
  guestList = JSON.parse(fs.readFileSync(guestListPath, 'utf-8'));
} catch (err) {
  console.error('Failed to load guest list:', err.message);
}

// Build a lookup map: lowercased name → original casing
const guestLookup = new Map();
for (const name of guestList) {
  guestLookup.set(name.normalize('NFC').toLowerCase(), name);
}

// In‑memory tracking of failed login attempts per IP
const ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_FAILS = 5;
const loginAttempts = {}; // ip -> { fails, firstFail, bannedUntil }

const login = (req, res) => {
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

  // Sanitize input: extract lastName, trim, limit length, strip tags
  let { lastName } = req.body;
  if (typeof lastName !== 'string') {
    return res.status(400).json({ message: 'Efternamn krävs.' });
  }
  lastName = lastName.trim().normalize('NFC').slice(0, 100).replace(/<[^>]*>/g, '');

  if (!lastName) {
    return res.status(400).json({ message: 'Efternamn krävs.' });
  }

  // Case-insensitive, unicode-normalized lookup
  const matchedName = guestLookup.get(lastName.normalize('NFC').toLowerCase());

  if (matchedName) {
    // Successful login clears failures
    if (entry) delete loginAttempts[ip];
    console.log(`Login success for IP ${ip}, guest: ${matchedName}`);
    return res.json({ success: true, guestName: matchedName });
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

  const remaining = MAX_FAILS - entry.fails + 1;
  console.log(`Login fail ${entry.fails} for IP ${ip} (remaining before ban: ${remaining})`);
  return res.status(401).json({
    message: `Efternamnet finns inte på gästlistan.\n${remaining} försök kvar.`
  });
};

module.exports = { login };
