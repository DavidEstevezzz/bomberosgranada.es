import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import UsuariosApiService from '../services/UsuariosApiService';
import logo from '../assets/logo.png';
import fondo from '../assets/fondo3.webp';

const ResetPassword = () => {
    
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      await UsuariosApiService.resetPassword({
        token,
        password,
        password_confirmation: confirmPassword,
      });

      setMessage('¡Contraseña restablecida con éxito! Ahora puedes iniciar sesión.');
      setMessageType('success');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => navigate('/'), 2500);
    } catch (error) {
      setMessage(
        'Error: ' + (error.response?.data?.error || 'No pudimos restablecer tu contraseña. Inténtalo nuevamente.')
      );
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <div className="absolute inset-0 bg-black opacity-50 backdrop-blur-md" />

      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur rounded-xl shadow-2xl p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="Cuerpo de Bomberos de Granada" className="h-28 w-auto" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Restablece tu contraseña</h1>
          <p className="mt-3 text-base text-gray-600 max-w-md">
            Crea una nueva contraseña para acceder nuevamente a la plataforma. Asegúrate de que sea fácil de recordar y difícil
            de adivinar.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ingresa una nueva contraseña"
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <div className="mt-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Confirma tu nueva contraseña"
                minLength={8}
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md p-4 text-sm font-medium ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                  : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Actualizando contraseña...' : 'Restablecer contraseña'}
          </button>
        </form>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
          <div>
            ¿Recordaste tu contraseña?
            <Link to="/" className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500">
              Volver al inicio de sesión
            </Link>
          </div>
          <p className="italic text-gray-500">Servicio digital del Cuerpo de Bomberos de Granada</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;