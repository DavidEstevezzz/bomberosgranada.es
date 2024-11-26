import React, { useState } from 'react';
import UsuariosApiService from '../services/LogApiService';
import { useNavigate } from 'react-router-dom';
import { useStateContext } from '../contexts/ContextProvider.jsx';
import logo from '../assets/logo.png';
import fondo from '../assets/fondo.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const { setUser, setToken } = useStateContext();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const user = { email, password };
      const response = await UsuariosApiService.loginUser(user);
      if (response.data && response.data.token) {
        setUser(response.data.user);
        setToken(response.data.token);
        setMessage('Login successful!');
        navigate('/dashboard');
      } else {
        throw new Error('Authentication failed, no token received');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setMessage('Login failed: ' + (error.response ? error.response.data.message : error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="absolute inset-0 bg-black opacity-50 backdrop-blur-md"></div>
      <div className="relative z-10 w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            alt="Your Company"
            src={logo}
            className="mx-auto h-30 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Cuerpo de Bomberos de Granada
          </h2>
          {message && <div className={message.includes("failed") ? "text-red-500" : "text-green-500"}>{message}</div>}
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email 
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                  Contraseña
                </label>
                <div className="text-sm">
  <a href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
    Olvidé mi contraseña
  </a>
</div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {loading ? 'Entrando...' : 'Iniciar sesión'}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <a href="#" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
              Contacta con un superior
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
