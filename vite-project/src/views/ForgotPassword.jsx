import React, { useState } from 'react';
import UsuariosApiService from '../services/UsuariosApiService';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        try {
            await UsuariosApiService.forgotPassword({ email });
            setMessage('Correo enviado. Revisa tu bandeja de entrada.');
        } catch (error) {
            setMessage('Error: ' + error.response?.data?.error || 'Ocurrió un error.');
        }
    };

    return (
        <form onSubmit={handleForgotPassword}>
            <input
                type="email"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <button type="submit">Enviar enlace</button>
            {message && <p>{message}</p>}
        </form>
    );
};

export default ForgotPassword;
