import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useStateContext } from '../contexts/ContextProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar,
  faCopy,
  faExchangeAlt,
  faArrowLeft,
  faSpinner,
  faUsers,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons';
import BrigadeCompositionApiService from '../services/BrigadeCompositionApiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BrigadeCompositionPage = () => {
  const { darkMode } = useDarkMode();
  const { user } = useStateContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado de fecha
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  // Estado de brigadas
  const [brigades, setBrigades] = useState([]);
  const [selectedBrigade, setSelectedBrigade] = useState(null);
  const [selectedParque, setSelectedParque] = useState(null);

  // Estado de composición
  const [composition, setComposition] = useState(null);
  const [firefighters, setFirefighters] = useState([]);
  const [guardDays, setGuardDays] = useState([]);

  // Estado de modales
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedFirefighter, setSelectedFirefighter] = useState(null);

  // Configuración de colores por letra de brigada
  const brigadesColorMap = {
    'A': { color: 'bg-green-500', hoverColor: 'hover:bg-green-600', textColor: 'text-white' },
    'B': { color: 'bg-zinc-50 text-gray-800 border-2 border-gray-300', hoverColor: 'hover:bg-gray-100', textColor: 'text-gray-800' },
    'C': { color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', textColor: 'text-white' },
    'D': { color: 'bg-red-600', hoverColor: 'hover:bg-red-700', textColor: 'text-white' },
    'E': { color: 'bg-yellow-300 text-gray-800', hoverColor: 'hover:bg-yellow-400', textColor: 'text-gray-800' },
    'F': { color: 'bg-gray-900', hoverColor: 'hover:bg-gray-800', textColor: 'text-white' },

  };

  const brigadesConfig = [
    { name: 'Brigada A', short: 'A' },
    { name: 'Brigada B', short: 'B' },
    { name: 'Brigada C', short: 'C' },
    { name: 'Brigada D', short: 'D' },
    { name: 'Brigada E', short: 'E' },
    { name: 'Brigada F', short: 'F' },

  ];

  // Configuración de estados con colores
  const statusConfig = {
    acude: { label: 'Acude', color: 'bg-green-500', textColor: 'text-white' },
    vacaciones: { label: 'Vacaciones', color: 'bg-red-500', textColor: 'text-white' },
    baja: { label: 'Baja', color: 'bg-gray-900', textColor: 'text-white' },
    permiso: { label: 'Permiso', color: 'bg-orange-500', textColor: 'text-white' },
    cambio: { label: 'Cambio de guardia', color: 'bg-blue-500', textColor: 'text-white' },
  };

  useEffect(() => {
    fetchBrigades();
  }, []);

  const fetchBrigades = async () => {
    try {
      const response = await BrigadeCompositionApiService.getBrigades();
      // Agrupar brigadas por nombre (sin duplicar por parque)
      const uniqueBrigades = {};
      response.data.forEach((brigade) => {
        const brigadeName = brigade.nombre;
        if (!uniqueBrigades[brigadeName]) {
          uniqueBrigades[brigadeName] = brigade;
        }
      });
      setBrigades(response.data);
    } catch (error) {
      console.error('Error fetching brigades:', error);
      setError('Error al cargar las brigadas');
    }
  };

  const handleBrigadeClick = (brigadeConfig) => {
    // Solo guardamos el nombre de la brigada, no el ID todavía
    // El ID se determinará cuando se seleccione el parque
    setSelectedBrigade(brigadeConfig);
    setSelectedParque(null);
    setComposition(null);
    setFirefighters([]);
    setGuardDays([]);
  };

  const handleParqueClick = async (parqueId) => {
    setSelectedParque(parqueId);

    // Buscar la brigada específica con el nombre Y el parque correcto
    const brigade = brigades.find(
      (b) => b.nombre === selectedBrigade.name && b.id_parque === parqueId
    );

    if (brigade) {
      // Actualizar el selectedBrigade con el ID correcto
      setSelectedBrigade({ ...selectedBrigade, id: brigade.id_brigada });
      await fetchComposition(brigade.id_brigada, parqueId);
    } else {
      setError(`No se encontró la brigada ${selectedBrigade.name} para el parque ${parqueId}`);
    }
  };

  const fetchComposition = async (brigadeId, parqueId, year = null, month = null) => {
    setLoading(true);
    setError(null);
    // Usar los parámetros pasados o los valores del estado
    const yearToUse = year !== null ? year : selectedYear;
    const monthToUse = month !== null ? month : selectedMonth;
 
    try {
      const response = await BrigadeCompositionApiService.getComposition(
        brigadeId,
        parqueId,
        yearToUse,
        monthToUse
      );

      setComposition(response.data);
      setFirefighters(response.data.firefighters || []);
      setGuardDays(response.data.guard_days || []);
    } catch (error) {
      console.error('Error fetching composition:', error);
      setError('Error al cargar la composición de la brigada');
      setFirefighters([]);
      setGuardDays([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = async (increment) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);

    // Pasar los nuevos valores directamente para evitar usar el estado desactualizado
    if (selectedBrigade && selectedParque) {
      await fetchComposition(selectedBrigade.id, selectedParque, newYear, newMonth);
    }
  };

  const handleCopyToNextMonth = async () => {
    if (!window.confirm(`¿Estás seguro de copiar todas las brigadas de ${getMonthName(selectedMonth)} ${selectedYear} al mes siguiente?`)) {
      return;
    }

    try {
      setLoading(true);
      await BrigadeCompositionApiService.copyToNextMonth(selectedYear, selectedMonth);
      alert('Brigadas copiadas exitosamente al mes siguiente');

      // Avanzar al mes siguiente
      handleMonthChange(1);
    } catch (error) {
      console.error('Error copying brigades:', error);
      if (error.response && error.response.status === 409) {
        alert('Ya existen composiciones para el mes siguiente');
      } else {
        alert('Error al copiar las brigadas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransferFirefighter = async (firefighter) => {
    setSelectedFirefighter(firefighter);
    setShowTransferModal(true);
  };

  const executeTransfer = async (toBrigadeId, toParqueId) => {
    try {
      setLoading(true);
      await BrigadeCompositionApiService.transferFirefighter({
        user_id: selectedFirefighter.id_empleado,
        from_brigade_id: selectedBrigade.id,
        from_id_parque: selectedParque,
        to_brigade_id: toBrigadeId,
        to_id_parque: toParqueId,
        year: selectedYear,
        month: selectedMonth,
      });

      alert('Bombero trasladado exitosamente');
      setShowTransferModal(false);
      setSelectedFirefighter(null);

      // Recargar composición
      await fetchComposition(selectedBrigade.id, selectedParque);
    } catch (error) {
      console.error('Error transferring firefighter:', error);
      alert('Error al trasladar el bombero');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedParque) {
      setSelectedParque(null);
      setComposition(null);
      setFirefighters([]);
      setGuardDays([]);
    } else {
      setSelectedBrigade(null);
    }
  };

  const getMonthName = (month) => {
    const date = new Date(2024, month - 1, 1);
    return format(date, 'MMMM', { locale: es });
  };

  const getDayNumber = (dateString) => {
    const date = new Date(dateString);
    return date.getDate();
  };

  const isJefe = () => {
    return user?.type === 'jefe';
  };

  // Agrupar bomberos por puesto
  const groupByPuesto = (firefightersList) => {
    const grouped = {};
    firefightersList.forEach((firefighter) => {
      const puesto = firefighter.puesto || 'Sin puesto';
      if (!grouped[puesto]) {
        grouped[puesto] = [];
      }
      grouped[puesto].push(firefighter);
    });
    return grouped;
  };

  const groupedFirefighters = groupByPuesto(firefighters);
 const puestoOrder = ['Subinspector', 'Oficial', 'Sargento', 'Cabo', 'Conductor', 'Operador', 'Bombero', 'Sin puesto'];
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FontAwesomeIcon icon={faUsers} className="text-blue-500" />
                Composición de Brigadas
              </h1>
              <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Gestiona la composición de bomberos por brigada y mes
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Selector de mes */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className={`px-3 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  title="Mes anterior"
                >
                  ←
                </button>
                <div className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} font-semibold min-w-[180px] text-center`}>
                  <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                  {getMonthName(selectedMonth).charAt(0).toUpperCase() + getMonthName(selectedMonth).slice(1)} {selectedYear}
                </div>
                <button
                  onClick={() => handleMonthChange(1)}
                  className={`px-3 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  title="Mes siguiente"
                >
                  →
                </button>
              </div>

              {/* Botón copiar brigadas (solo Jefes) */}
              {isJefe() && (
                <button
                  onClick={handleCopyToNextMonth}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copiar todas las brigadas al mes siguiente"
                >
                  <FontAwesomeIcon icon={faCopy} />
                  Copiar al mes siguiente
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Botón volver */}
        {(selectedBrigade || selectedParque) && (
          <button
            onClick={handleBack}
            className={`mb-4 px-4 py-2 rounded-lg flex items-center gap-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver
          </button>
        )}

        {/* Contenido principal */}
        {!selectedBrigade ? (
          // Selección de brigada
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8`}>
            <h2 className="text-2xl font-bold mb-6 text-center">Selecciona una Brigada</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {brigadesConfig.map((brigade) => {
                const colorConfig = brigadesColorMap[brigade.short] || brigadesColorMap['A'];
                return (
                  <button
                    key={brigade.short}
                    onClick={() => handleBrigadeClick(brigade)}
                    className={`${colorConfig.color} ${colorConfig.hoverColor} ${colorConfig.textColor} font-bold py-12 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-2xl`}
                  >
                    <div className="text-6xl mb-4">{brigade.short}</div>
                    <div className="text-lg">{brigade.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : !selectedParque ? (
          // Selección de parque
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8`}>
            <h2 className="text-2xl font-bold mb-6 text-center">
              {selectedBrigade.name} - Selecciona un Parque
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <button
                onClick={() => handleParqueClick(1)}
                className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-16 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-2xl"
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-5xl mb-4" />
                <div className="text-2xl">Parque Norte</div>
              </button>
              <button
                onClick={() => handleParqueClick(2)}
                className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-16 px-8 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-2xl"
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-5xl mb-4" />
                <div className="text-2xl">Parque Sur</div>
              </button>
            </div>
          </div>
        ) : (
          // Tabla de composición
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500" />
                <span className="ml-4 text-xl">Cargando...</span>
              </div>
            ) : error ? (
              <div className={`${darkMode ? 'bg-red-900/20' : 'bg-red-100'} border border-red-500 rounded-lg p-4 text-center`}>
                <p className="text-red-500">{error}</p>
              </div>
            ) : firefighters.length === 0 ? (
              <div className={`${darkMode ? 'bg-yellow-900/20' : 'bg-yellow-100'} border border-yellow-500 rounded-lg p-6 text-center`}>
                <p className="text-yellow-600">No hay composiciones para esta brigada en este mes</p>
              </div>
            ) : (
              <>
                {/* Info header */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 mb-6`}>
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedBrigade.name} - Parque {selectedParque === 1 ? 'Norte' : 'Sur'}
                      </h2>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Total de bomberos: {firefighters.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabla */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-x-auto`}>
                  <table className="min-w-full">
                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold border-r border-gray-300">Puesto</th>
                        <th className="px-4 py-3 text-left font-semibold border-r border-gray-300">Nombre y Apellido</th>
                        {guardDays.map((day) => (
                          <th key={day} className="px-2 py-3 text-center font-semibold border-r border-gray-300 min-w-[50px]">
                            {getDayNumber(day)}
                          </th>
                        ))}
                        {isJefe() && (
                          <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {puestoOrder.map((puesto) => {
                        if (!groupedFirefighters[puesto]) return null;

                        return (
                          <React.Fragment key={puesto}>
                            {/* Header de puesto */}
                            <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} font-bold`}>
                              <td colSpan={2 + guardDays.length + (isJefe() ? 1 : 0)} className="px-4 py-2">
                                {puesto}
                              </td>
                            </tr>

                            {/* Bomberos del puesto */}
                            {groupedFirefighters[puesto].map((firefighter, idx) => (
                              <tr
                                key={firefighter.id_empleado}
                                className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-850' : 'bg-gray-50')}`}
                              >
                                <td className="px-4 py-2 border-r border-gray-300"></td>
                                <td className="px-4 py-2 border-r border-gray-300">
                                  {firefighter.nombre} {firefighter.apellido}
                                </td>
                                {firefighter.guard_days.map((guardDay, dayIdx) => {
                                  const statusInfo = statusConfig[guardDay.status] || statusConfig.acude;
                                  return (
                                    <td
                                      key={dayIdx}
                                      className={`px-2 py-2 text-center border-r border-gray-300`}
                                      title={guardDay.detail || statusInfo.label}
                                    >
                                      <div
                                        className={`${statusInfo.color} ${statusInfo.textColor} rounded px-1 py-1 text-xs font-semibold`}
                                      >
                                        {guardDay.status === 'acude' ? '✓' : guardDay.status === 'cambio' ? '⇄' : '✗'}
                                      </div>
                                    </td>
                                  );
                                })}
                                {isJefe() && (
                                  <td className="px-4 py-2 text-center">
                                    <button
                                      onClick={() => handleTransferFirefighter(firefighter)}
                                      className="text-blue-500 hover:text-blue-700"
                                      title="Trasladar bombero"
                                    >
                                      <FontAwesomeIcon icon={faExchangeAlt} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Leyenda */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mt-6`}>
                  <h3 className="text-lg font-bold mb-4">Leyenda de Estados</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(statusConfig).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`${value.color} ${value.textColor} px-3 py-2 rounded font-semibold text-sm`}>
                          {key === 'acude' ? '✓' : key === 'cambio' ? '⇄' : '✗'}
                        </div>
                        <span className="text-sm">{value.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal de traslado */}
        {showTransferModal && selectedFirefighter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full p-6`}>
              <h3 className="text-2xl font-bold mb-4">
                Trasladar Bombero: {selectedFirefighter.nombre} {selectedFirefighter.apellido}
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Selecciona la brigada y parque de destino
              </p>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg">Brigadas disponibles:</h4>
                {brigadesConfig.map((brigadeConfig) => {
                  const colorConfig = brigadesColorMap[brigadeConfig.short] || brigadesColorMap['A'];
                  // Buscar las brigadas por nombre Y parque
                  const brigadeNorte = brigades.find((b) => b.nombre === brigadeConfig.name && b.id_parque === 1);
                  const brigadeSur = brigades.find((b) => b.nombre === brigadeConfig.name && b.id_parque === 2);
 
                  if (!brigadeNorte && !brigadeSur) return null;
 
                  return (
                    <div key={brigadeConfig.short} className="space-y-2">
                      <div className="font-semibold">{brigadeConfig.name}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => brigadeNorte && executeTransfer(brigadeNorte.id_brigada, 1)}
                          disabled={!brigadeNorte || (selectedBrigade.id === brigadeNorte?.id_brigada && selectedParque === 1)}
                          className={`${colorConfig.color} ${colorConfig.hoverColor} ${colorConfig.textColor} font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Parque Norte
                        </button>
                        <button
                          onClick={() => brigadeSur && executeTransfer(brigadeSur.id_brigada, 2)}
                          disabled={!brigadeSur || (selectedBrigade.id === brigadeSur?.id_brigada && selectedParque === 2)}
                          className={`${colorConfig.color} ${colorConfig.hoverColor} ${colorConfig.textColor} font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          Parque Sur
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedFirefighter(null);
                  }}
                  className={`px-6 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrigadeCompositionPage;
