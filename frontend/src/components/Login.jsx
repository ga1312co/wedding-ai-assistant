import React, { useState } from 'react';
import { login } from '../services/api';
import './Login.css';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(password);
      onLogin();
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to connect to the server.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Välkommen till bröllopssidan!</h2>
        <p>Var god ange det lösenord ni blivit tilldelade i er inbjudan.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ange lösenord"
          required
        />
        <button type="submit">Logga in</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default Login;