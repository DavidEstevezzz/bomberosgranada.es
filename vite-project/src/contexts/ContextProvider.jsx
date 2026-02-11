import React, { createContext, useContext, useState, useEffect } from 'react';
import UsuariosApiService from '../services/UsuariosApiService';

const StateContext = createContext({
    user: null,
    token: null,
    setUser: () => {},
    setToken: () => {},
});

export const ContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, _setToken] = useState(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    const setToken = (token) => {
        _setToken(token);
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    };

    const fetchUser = async () => {
        if (token) {
            try {
                setIsLoading(true);
                const response = await UsuariosApiService.getUserByToken();
                setUser(response.data);
            } catch (error) {
                console.error('Error al obtener el usuario:', error.response?.data || error.message);
                
                // Solo limpiar token si es un error de autenticación real (401)
                // NO limpiar si es rate limit (429) u otro error temporal
                if (error.response?.status === 401) {
                    console.log('Token inválido, cerrando sesión');
                    setToken(null);
                    setUser(null);
                } else if (error.isRateLimited || error.response?.status === 429) {
                    // Rate limit - no hacer nada, mantener sesión
                    console.warn('Rate limit alcanzado, manteniendo sesión');
                } else {
                    // Otro error (red, servidor) - no cerrar sesión inmediatamente
                    console.warn('Error temporal, manteniendo sesión');
                }
            } finally {
                setIsLoading(false);
            }
        } else {
            setUser(null);
            setIsLoading(false);
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