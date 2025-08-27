//src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar estado desde localStorage al inicio
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    setIsAuthenticated(!!token);
  }, []);

  const login = (token) => {
    localStorage.setItem('session_token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('session_token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);
