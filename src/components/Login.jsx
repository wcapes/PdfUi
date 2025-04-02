import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';
// import getAppConfig from '../config.js'; // Adjust the path if needed
import fetchData from '../general.js';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companycode, setCompanyCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
    
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Replace with your actual API endpoint
      let url = `/login?username=${username}&password=${password}&companyCode=${companycode}`;
      const json = await fetchData(url, 'GET', "");
      if (json != null && json != "") 
      {
        console.log(`Token loaded: ${json.token}`);
        onLogin(json.token);
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>NegativeZero PDF Q&A</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-container">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <div 
                className="password-toggle-icon"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                title="Hold to show password"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </div>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Company Code</label>
            <input 
              type="text" 
              value={companycode} 
              onChange={(e) => setCompanyCode(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;