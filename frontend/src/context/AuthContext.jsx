import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { getErrorMessage } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('sdp_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sdp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('sdp_user', JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem('sdp_token');
        localStorage.removeItem('sdp_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: u, token } = res.data.data;
      localStorage.setItem('sdp_token', token);
      localStorage.setItem('sdp_user', JSON.stringify(u));
      setUser(u);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    }
  }, []);

  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('sdp_token');
    localStorage.removeItem('sdp_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
