import React, { useState, useEffect } from 'react';
import ExtraHourApiService from '../services/ExtraHourApiService';
import EditExtraHourModal from '../components/EditExtraHourModal';
import AddExtraHourModal from '../components/AddExtraHourModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const ExtraHoursTable = () => {
  const [extraHours, setExtraHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExtraHour, setSelectedExtraHour] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });

  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchExtraHours();
  }, [currentMonth, sortConfig]);

  const fetchExtraHours = async () => {
    setLoading(true);
    try {
      const response = await ExtraHourApiService.getExtraHours();
      if (response.data) {
        const filteredData = response.data.filter((extraHour) => {
          const hourDate = dayjs(extraHour.date);
          return hourDate.format('YYYY-MM') === currentMonth;
        });
        const sortedData = sortData(filteredData, sortConfig.key, sortConfig.direction);
        setExtraHours(sortedData);
        setError(null);
      } else {
        throw new Error('No extra hours data returned from the API');
      }
    } catch (error) {
      console.error('Failed to fetch extra hours:', error);
      setError('Failed to load extra hours');
    } finally {
      setLoading(false);
    }
  };

  const sortData = (data, key, direction) => {
    return data.sort((a, b) => {
      if (key === 'nombre') {
        return direction === 'asc'
          ? a.user.nombre.localeCompare(b.user.nombre)
          : b.user.nombre.localeCompare(a.user.nombre);
      } else if (key === 'fecha') {
        return direction === 'asc'
          ? dayjs(a.date).unix() - dayjs(b.date).unix()
          : dayjs(b.date).unix() - dayjs(a.date).unix();
      }
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleEditClick = (extraHour) => {
    setSelectedExtraHour(extraHour);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      await ExtraHourApiService.deleteExtraHour(id);
      fetchExtraHours();
    } catch (error) {
      console.error('Failed to delete extra hour:', error);
    }
  };

  const handleAddExtraHour = async () => {
    try {
      fetchExtraHours();
    } catch (error) {
      console.error('Failed to add extra hour:', error);
    }
  };

  const handleUpdateExtraHour = async () => {
    try {
      fetchExtraHours();
    } catch (error) {
      console.error('Failed to update extra hour:', error);
    }
  };

  const handlePreviousMonth = () => {
    const newMonth = dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM');
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = dayjs(currentMonth).add(1, 'month').format('YYYY-MM');
    setCurrentMonth(newMonth);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Horas Extras - {dayjs(currentMonth).format('MMMM YYYY')}</h1>
        <div className="flex items-center space-x-2">
          <button onClick={handlePreviousMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
            Mes Anterior
          </button>
          <button onClick={handleNextMonth} className="bg-blue-500 text-white px-4 py-2 rounded">
            Mes Siguiente
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className={`px-4 py-2 rounded flex items-center space-x-2 ${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>
            <FontAwesomeIcon icon={faPlus} />
            <span>Añadir Hora Extra</span>
          </button>
        </div>
      </div>
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('nombre')}>
                  Nombre
                  {sortConfig.key === 'nombre' && (
                    <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} className="ml-1" />
                  )}
                </th>
                <th className="py-2 px-2">Apellido</th>
                <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('fecha')}>
                  Fecha
                  {sortConfig.key === 'fecha' && (
                    <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} className="ml-1" />
                  )}
                </th>
                <th className="py-2 px-2">Horas Diurnas</th>
                <th className="py-2 px-2">Horas Nocturnas</th>
                <th className="py-2 px-2">Total Salario</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {extraHours.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">No hay horas extras para este mes</td>
                </tr>
              ) : (
                extraHours.map((extraHour) => {
                  const totalSalary =
                    (extraHour.horas_diurnas * parseFloat(extraHour.salarie.precio_diurno)) +
                    (extraHour.horas_nocturnas * parseFloat(extraHour.salarie.precio_nocturno));

                  return (
                    <tr key={extraHour.id} className="border-b border-gray-700">
                      <td className="py-2 px-2">{extraHour.user?.nombre || 'N/A'}</td>
                      <td className="py-2 px-2">{extraHour.user?.apellido || 'N/A'}</td>
                      <td className="py-2 px-2">{dayjs(extraHour.date).format('DD-MM-YYYY')}</td>
                      <td className="py-2 px-2">{extraHour.horas_diurnas}</td>
                      <td className="py-2 px-2">{extraHour.horas_nocturnas}</td>
                      <td className="py-2 px-2">{totalSalary.toFixed(2)} €</td>
                      <td className="py-2 px-2 flex space-x-2">
                        <button onClick={() => handleEditClick(extraHour)} className="bg-blue-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                          <FontAwesomeIcon icon={faEdit} />
                          <span>Editar</span>
                        </button>
                        <button onClick={() => handleDeleteClick(extraHour.id)} className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                          <FontAwesomeIcon icon={faTrash} />
                          <span>Borrar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedExtraHour && (
        <EditExtraHourModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          extraHour={selectedExtraHour}
          onUpdate={handleUpdateExtraHour}
        />
      )}
      <AddExtraHourModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddExtraHour}
      />
    </div>
  );
};

export default ExtraHoursTable;
