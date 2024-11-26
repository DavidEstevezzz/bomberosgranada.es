import React, { createContext, useContext, useState, useEffect } from 'react';
import UsuariosApiService from '../services/UsuariosApiService';

const StateContext = createContext({
  user: null,
  token: null,
  setUser: () => {},
  setToken: () => {},
});

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Datos del usuario autenticado
  const [token, _setToken] = useState(localStorage.getItem('token')); // Token del usuario

  const setToken = (token) => {
    _setToken(token);
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  };

  const [isLoading, setIsLoading] = useState(true);

const fetchUser = async () => {
  if (token) {
    try {
      setIsLoading(true); // Inicia la carga
      const response = await UsuariosApiService.getUserByToken();
      setUser(response.data);
    } catch (error) {
      console.error('Error al obtener el usuario:', error.response?.data || error.message);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false); // Finaliza la carga
    }
  } else {
    setUser(null);
    setIsLoading(false); // Finaliza la carga si no hay token
  }
};

  useEffect(() => {
    fetchUser();
  }, [token]);

  return (
  <StateContext.Provider value={{ user, token, setUser, setToken, isLoading }}>
    {children}
  </StateContext.Provider>
);
};

export const useStateContext = () => useContext(StateContext);
