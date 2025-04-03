import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import UsuariosApiService from '../services/UsuariosApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const AssignmentsTable = ({
  assignments,
  setSelectedAssignment,
  setShowEditModal,
  handleDelete,
  darkMode,
  deleteLoading,
  sortConfig,
  handleSort
}) => {
  const [usuarios, setUsuarios] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resUsuarios, resBrigades] = await Promise.all([
          UsuariosApiService.getUsuarios(),
          BrigadesApiService.getBrigades()
        ]);

        setUsuarios(resUsuarios.data);
        setBrigades(resBrigades.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUsuarioNombre = (id_empleado) => {
    const usuario = usuarios.find((usuario) => usuario.id_empleado === id_empleado);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido';
  };

  const getBrigadaNombre = (id_brigada) => {
    const brigada = brigades.find((brigada) => brigada.id_brigada === id_brigada);
    return brigada ? brigada.nombre : 'Desconocida';
  };

  // Renderiza el indicador de ordenamiento
  const getSortIcon = (columnName) => {
    if (sortConfig && sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? (
        <FontAwesomeIcon icon={faSortUp} className="ml-1" />
      ) : (
        <FontAwesomeIcon icon={faSortDown} className="ml-1" />
      );
    }
    return null;
  };

  if (loading)
    return <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cargando...</p>;
  if (error)
    return <p className={`text-center ${darkMode ? 'text-red-300' : 'text-red-500'}`}>Error: {error}</p>;

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full text-left border-collapse rounded-lg ${
          darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'
        }`}
      >
        <thead>
          <tr className={`${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-900'}`}>
            <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('fecha_ini')}>
              <div className="flex items-center">
                Fecha Inicio {getSortIcon('fecha_ini')}
              </div>
            </th>
            <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('nombre')}>
              <div className="flex items-center">
                Empleado {getSortIcon('nombre')}
              </div>
            </th>
            <th className="py-2 px-2">Brigada Origen</th>
            <th className="py-2 px-2">Brigada Destino</th>
            <th className="py-2 px-2">Turno</th>
            <th className="py-2 px-2" style={{ width: '200px' }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <tr
                key={assignment.id_asignacion}
                className={`border-b ${
                  darkMode ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <td className="py-2 px-2">{assignment.fecha_ini}</td>
                <td className="py-2 px-2">{getUsuarioNombre(assignment.id_empleado)}</td>
                <td className="py-2 px-2">{getBrigadaNombre(assignment.id_brigada_origen)}</td>
                <td className="py-2 px-2">{getBrigadaNombre(assignment.id_brigada_destino)}</td>
                <td className="py-2 px-2">{assignment.turno}</td>
                <td className="py-2 px-2 flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowEditModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(assignment.id_asignacion)}
                    disabled={deleteLoading}
                    className={`${deleteLoading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-1 rounded flex items-center space-x-1`}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>{deleteLoading ? 'Borrando...' : 'Borrar'}</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className={`text-center py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                No hay asignaciones disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssignmentsTable;