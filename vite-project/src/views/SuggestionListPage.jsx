import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useStateContext } from "../contexts/ContextProvider";
import SuggestionApiService from "../services/SuggestionApiService";
import SuggestionVoteApiService from "../services/SuggestionVoteApiService";
import AddSuggestionModal from "../components/AddSuggestionModal";

const SuggestionListPage = () => {
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await SuggestionApiService.getSuggestions();
      const sorted = response.data.sort((a, b) => b.conteo_votos - a.conteo_votos);
      setSuggestions(sorted);
      setError(null);
    } catch (err) {
      console.error("Error al cargar sugerencias:", err);
      setError("Error al cargar sugerencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleToggleVote = async (suggestion) => {
    const voteData = { suggestion_id: suggestion.id, usuario_id: user.id_empleado };
    try {
      if (suggestion.userVoted) {
        await SuggestionVoteApiService.deleteVote(voteData);
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestion.id
              ? { ...s, conteo_votos: s.conteo_votos - 1, userVoted: false }
              : s
          )
        );
      } else {
        await SuggestionVoteApiService.storeVote(voteData);
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === suggestion.id
              ? { ...s, conteo_votos: s.conteo_votos + 1, userVoted: true }
              : s
          )
        );
      }
    } catch (err) {
      console.error("Error al alternar el voto:", err);
    }
  };

  return (
    <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold"> Sugerencias</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white px-5 py-2 rounded-lg flex items-center space-x-2 shadow-md"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Nueva Sugerencia</span>
        </button>
      </div>

      {/* Cargando/Error */}
      {loading ? (
        <div className="text-center text-lg">Cargando...</div>
      ) : error ? (
        <div className="text-red-500 text-center text-lg">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg shadow-lg">
            <thead>
              <tr className={`${darkMode ? "bg-gray-800" : "bg-gray-200"} text-left`}>
                <th className="py-3 px-4">Autor</th>
                <th className="py-3 px-4">Título</th>
                <th className="py-3 px-4 w-2/5">Descripción</th>
                <th className="py-3 px-4 text-center">Votos</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.length > 0 ? (
                suggestions.map((sugg) => (
                  <tr key={sugg.id} className="border-b border-gray-700 hover:bg-gray-700/10 transition-all duration-200">
                    <td className="py-4 px-4">
                      {sugg.usuario ? `${sugg.user.nombre} ${sugg.user.apellido}` : "Desconocido"}
                    </td>
                    <td className="py-4 px-4 font-semibold">{sugg.titulo}</td>
                    <td className="py-4 px-4 max-w-xs truncate">{sugg.descripcion}</td>
                    <td className="py-4 px-4 text-center font-bold">{sugg.conteo_votos}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleVote(sugg)}
                        className={`${
                          sugg.userVoted ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                        } transition-all duration-200 text-white px-4 py-2 rounded-lg flex items-center space-x-1 shadow-md`}
                      >
                        <FontAwesomeIcon icon={faThumbsUp} />
                        <span>{sugg.userVoted ? "Quitar Voto" : "Votar"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-lg font-semibold">
                    No hay sugerencias disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para añadir sugerencia */}
      {isAddModalOpen && (
        <AddSuggestionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={fetchSuggestions} />
      )}
    </div>
  );
};

export default SuggestionListPage;
