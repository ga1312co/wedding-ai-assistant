const login = (req, res) => {
  const { password } = req.body;
  if (password === process.env.LOGIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ message: 'Invalid password' });
  }
};

module.exports = { login };
