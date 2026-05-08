import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('araquiu_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('araquiu_token'));

  const login = (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    localStorage.setItem('araquiu_user', JSON.stringify(userData));
    localStorage.setItem('araquiu_token', tokenValue);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('araquiu_user');
    localStorage.removeItem('araquiu_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.rol === 'admin', isMesero: user?.rol === 'mesero' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
