const login = (req, res) => {
  if (!process.env.LOGIN_PASSWORD) {
    console.warn('LOGIN_PASSWORD not set; all logins will fail.');
  }
  const { password } = req.body;
  if (password === process.env.LOGIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ message: 'Invalid password' });
  }
};

module.exports = { login };
