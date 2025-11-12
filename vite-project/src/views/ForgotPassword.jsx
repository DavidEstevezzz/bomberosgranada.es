import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import UsuariosApiService from '../services/UsuariosApiService';
import logo from '../assets/logo.png';
import fondo from '../assets/fondo3.webp';

const ForgotPassword = () => {
     const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      await UsuariosApiService.forgotPassword({ email });
      setMessage('Correo enviado. Revisa tu bandeja de entrada.');
      setMessageType('success');
      setEmail('');
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.error || 'Ocurrió un error.'));
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
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="mt-3 text-base text-gray-600 max-w-md">
            Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="tu-correo@ejemplo.com"
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
            {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
          <div>
            ¿Recordaste tu contraseña?
            <Link to="/" className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500">
              Volver al inicio de sesión
            </Link>
          </div>
          <p className="italic text-gray-500">
            Servicio digital del Cuerpo de Bomberos de Granada
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;