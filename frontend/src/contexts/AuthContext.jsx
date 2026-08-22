import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(localStorage.getItem('renew_token'));
  const [loading, setLoading] = useState(true);
  // Track if we just did a fresh login/register — skip the /me re-fetch in that case
  const skipMeFetch = useRef(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('renew_token', token);

      // If we just logged in/registered, we already set user — don't re-fetch
      if (skipMeFetch.current) {
        skipMeFetch.current = false;
        setLoading(false);
        return;
      }

      // Verify stored token by fetching profile
      axios.get('/api/auth/me')
        .then(res => {
          const userData = res.data?.user || res.data;
          setUser(userData);
        })
        .catch(() => {
          // Stored token invalid — clean up
          localStorage.removeItem('renew_token');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('renew_token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const setToken = (newToken) => {
    setTokenState(newToken);
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    // Set auth header immediately
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    localStorage.setItem('renew_token', newToken);
    // Set user first so ProtectedRoute sees it before navigate()
    setUser(userData);
    // Mark that useEffect should skip /me re-fetch
    skipMeFetch.current = true;
    setTokenState(newToken);
  };

  const register = async (name, email, password) => {
    const res = await axios.post('/api/auth/register', { name, email, password });
    const { token: newToken, user: userData } = res.data;
    // Set auth header immediately
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    localStorage.setItem('renew_token', newToken);
    // Set user first so ProtectedRoute sees it before navigate()
    setUser(userData);
    // Mark that useEffect should skip /me re-fetch
    skipMeFetch.current = true;
    setTokenState(newToken);
  };

  const logout = () => {
    setTokenState(null);
    setUser(null);
    localStorage.removeItem('renew_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
