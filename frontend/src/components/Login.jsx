import React, { useState, useEffect } from 'react';
import { login } from '../services/api';
import TypewriterText from './TypewriterText'; // Import the new component
import './Login.css';

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [inputAnimated, setInputAnimated] = useState(false);

  useEffect(() => {
    // Trigger input animation on component mount
    setInputAnimated(true);
  }, []);

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
        <h2>
          <TypewriterText text="Bea och Gabriels bröllop!" delay={75} />
        </h2>
        <p>Var god ange det lösenord ni blivit tilldelade i er inbjudan.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ange lösenord"
          required
          className={inputAnimated ? 'input-slide-in' : ''}
        />
        <button type="submit">Logga in</button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default Login;
