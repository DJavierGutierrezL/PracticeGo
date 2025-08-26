
import React, { useState } from 'react';
import { PracticeGoLogo } from './icons/Icons';

interface LoginProps {
  onLogin: (user: string, pass: string) => boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(username, password);
    if (!success) {
      setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center">
            <PracticeGoLogo />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-700 dark:text-gray-200">
          Iniciar sesión en tu cuenta
        </h2>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="admin"
              />
            </div>
            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 mt-1 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="•••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm group bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
