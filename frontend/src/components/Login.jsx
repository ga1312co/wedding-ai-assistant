import React, { useState } from 'react';
import { login } from '../services/api';
import TypewriterText from './TypewriterText';
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
      <div className="login-form-container">
        <TypewriterText text="Beata och Gabriels bröllop" />
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="password">Lösenord:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;
