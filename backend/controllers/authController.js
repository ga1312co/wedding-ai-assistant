const login = (req, res) => {
  const { password } = req.body;
  console.log('Backend LOGIN_PASSWORD:', process.env.LOGIN_PASSWORD); 
  console.log('Received password:', password);
  if (password === process.env.LOGIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ message: 'Invalid password' });
  }
};

module.exports = { login };
