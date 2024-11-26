import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import UsuariosApiService from '../services/UsuariosApiService';

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            await UsuariosApiService.resetPassword({ token, password, password_confirmation: confirmPassword });
            setMessage('Contraseña restablecida con éxito.');
        } catch (error) {
            setMessage('Error: ' + error.response?.data?.error || 'Ocurrió un error.');
        }
    };

    return (
        <form onSubmit={handleResetPassword}>
            <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
            />
            <button type="submit">Restablecer contraseña</button>
            {message && <p>{message}</p>}
        </form>
    );
};

export default ResetPassword;
