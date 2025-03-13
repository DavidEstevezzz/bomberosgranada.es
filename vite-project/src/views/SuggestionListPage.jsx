// src/pages/SuggestionListPage.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import SuggestionApiService from '../services/SuggestionApiService';
import SuggestionVoteApiService from '../services/SuggestionVoteApiService';
import AddSuggestionModal from '../components/AddSuggestionModal';

const SuggestionListPage = () => {
  const { darkMode } = useDarkMode();
  const { user } = useStateContext(); // Se asume que contiene datos del usuario actual, incluyendo "id_empleado"
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await SuggestionApiService.getSuggestions();
      // Se ordenan las sugerencias por el recuento de votos de mayor a menor
      const sorted = response.data.sort((a, b) => b.conteo_votos - a.conteo_votos);
      setSuggestions(sorted);
      setError(null);
    } catch (err) {
      console.error('Error al cargar sugerencias:', err);
      setError('Error al cargar sugerencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Función para alternar el voto de la sugerencia
  // Se asume que la API de sugerencias retorna un campo "userVoted" (boolean) para saber si el usuario ya votó
  const handleToggleVote = async (suggestion) => {
    try {
      if (suggestion.userVoted) {
        // Si ya votó, se elimina el voto
        await SuggestionVoteApiService.deleteVote({ suggestion_id: suggestion.id, usuario_id: user.id_empleado });
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestion.id
              ? { ...s, conteo_votos: s.conteo_votos - 1, userVoted: false }
              : s
          )
        );
      } else {
        // Si no ha votado, se registra el voto
        await SuggestionVoteApiService.storeVote({ suggestion_id: suggestion.id, usuario_id: user.id_empleado });
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestion.id
              ? { ...s, conteo_votos: s.conteo_votos + 1, userVoted: true }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Error al alternar el voto:', err);
    }
  };

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sugerencias</h1>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Sugerencia</span>
        </button>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Autor</th>
                <th className="py-2 px-2">Título</th>
                <th className="py-2 px-2">Descripción</th>
                <th className="py-2 px-2">Votos</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length > 0 ? (
                suggestions.map((sugg) => (
                  <tr key={sugg.id} className="border-b border-gray-700">
                    <td className="py-2 px-2">
                      {/* Se asume que "usuario" es el objeto del autor */}
                      {sugg.usuario ? `${sugg.usuario.nombre} ${sugg.usuario.apellido}` : 'Desconocido'}
                    </td>
                    <td className="py-2 px-2">{sugg.titulo}</td>
                    <td className="py-2 px-2">{sugg.descripcion}</td>
                    <td className="py-2 px-2">{sugg.conteo_votos}</td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => handleToggleVote(sugg)}
                        className="bg-green-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                      >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        <span>{sugg.userVoted ? 'Quitar Voto' : 'Votar'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-center">
                    No hay sugerencias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isAddModalOpen && (
        <AddSuggestionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={fetchSuggestions} />
      )}
    </div>
  );
};

export default SuggestionListPage;
