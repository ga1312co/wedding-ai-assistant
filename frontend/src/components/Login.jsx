import React, { useState } from 'react';
import { login } from '../services/api';
import './Login.css';
import bjerredsImage from '../assets/Bjerreds.png';
import envelopeBase from '../assets/envelope_textured.png';

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
      {/* Envelope wrapper with hidden image revealed on hover */}
      <div className="wrapper" aria-label="Invitation envelope">
        {/* Animated top lid */}
        <div className="lid one"></div>
        <div className="lid two"></div>

        {/* Background behind contents (clipped to envelope interior) */}
        <div className="envelope-bg" aria-hidden="true"></div>

        {/* Static envelope base image (minus the lid) */}
        <img className="envelope-img" src={envelopeBase} alt="Envelope" />

        {/* Letter/image inside the envelope */}
        <div className="letter">
          <div className="letter-inner">
            <img src={bjerredsImage} alt="Bjerreds" />
          </div>
        </div>
      </div>

      <div className="login-form-container">
        <form onSubmit={handleSubmit} className="login-form">
          {error && <p className="error-message">{error}</p>}
          <label htmlFor="password">Lösenord:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </form>
      </div>
    </div>
  );
}

export default Login;
