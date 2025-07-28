const login = (req, res) => {
  const { password } = req.body;
  console.log('Backend LOGIN_PASSWORD:', process.env.LOGIN_PASSWORD); // Added for debugging
  console.log('Received password:', password); // Added for debugging
  if (password === process.env.LOGIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ message: 'Invalid password' });
  }
};

module.exports = { login };
