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
    return <p className={`text-center text-base font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Cargando...</p>;
  if (error)
    return <p className={`text-center text-base font-medium ${darkMode ? 'text-red-300' : 'text-red-600'}`}>Error: {error}</p>;

  const headerCellClass = 'px-4 py-3 text-base font-semibold uppercase tracking-wide';
  const bodyCellClass = 'px-4 py-3 text-base';

  const actionButtonBase =
    'inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const subtleLabelClass = darkMode ? 'text-slate-300' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {assignments.length === 0 ? (
        <div
          className={`rounded-2xl border px-6 py-12 text-center text-base font-medium ${
            darkMode
              ? 'border-slate-800/80 bg-slate-900/80 text-slate-200'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          No hay asignaciones disponibles
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-2xl border shadow-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-collapse">
                  <thead
                    className={`${
                      darkMode
                        ? 'bg-slate-900/80 text-slate-200 border-b border-slate-700'
                        : 'bg-slate-50 text-slate-700 border-b border-slate-200'
                    }`}
                  >
                    <tr>
                      <th
                        scope="col"
                        className={`${headerCellClass} cursor-pointer`}
                        onClick={() => handleSort('fecha_ini')}
                      >
                        <span className="flex items-center gap-2">
                          Fecha inicio {getSortIcon('fecha_ini')}
                        </span>
                      </th>
                      <th
                        scope="col"
                        className={`${headerCellClass} cursor-pointer`}
                        onClick={() => handleSort('nombre')}
                      >
                        <span className="flex items-center gap-2">
                          Empleado {getSortIcon('nombre')}
                        </span>
                      </th>
                      <th scope="col" className={headerCellClass}>
                        Brigada origen
                      </th>
                      <th scope="col" className={headerCellClass}>
                        Brigada destino
                      </th>
                      <th scope="col" className={headerCellClass}>
                        Turno
                      </th>
                      <th scope="col" className={`${headerCellClass} w-56`}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`${
                      darkMode
                        ? 'divide-y divide-slate-800/80'
                        : 'divide-y divide-slate-200'
                    }`}
                  >
                    {assignments.map((assignment) => (
                      <tr
                        key={assignment.id_asignacion}
                        className={`${
                          darkMode
                            ? 'bg-slate-900/50 hover:bg-slate-900/80'
                            : 'bg-white hover:bg-slate-50'
                        } transition-colors`}
                      >
                        <td className={`${bodyCellClass} font-medium`}>{assignment.fecha_ini}</td>
                        <td className={bodyCellClass}>
                          {getUsuarioNombre(assignment.id_empleado)}
                        </td>
                        <td className={bodyCellClass}>
                          {getBrigadaNombre(assignment.id_brigada_origen)}
                        </td>
                        <td className={bodyCellClass}>
                          {getBrigadaNombre(assignment.id_brigada_destino)}
                        </td>
                        <td className={bodyCellClass}>{assignment.turno}</td>
                        <td className={`${bodyCellClass}`}>
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setShowEditModal(true);
                              }}
                              className={`${
                                darkMode
                                  ? 'bg-primary-500/20 text-primary-100 hover:bg-primary-500/30 focus:ring-primary-500/40 focus:ring-offset-slate-900'
                                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200 focus:ring-primary-500 focus:ring-offset-white'
                              } ${actionButtonBase}`}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDelete(assignment.id_asignacion)}
                              disabled={deleteLoading}
                              className={`${
                                deleteLoading
                                  ? darkMode
                                    ? 'bg-red-500/20 text-red-200'
                                    : 'bg-red-200 text-red-600'
                                  : darkMode
                                  ? 'bg-red-500/30 text-red-200 hover:bg-red-500/40'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              } ${actionButtonBase} focus:ring-red-500 ${
                                darkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
                              } disabled:cursor-not-allowed disabled:opacity-70`}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              <span>{deleteLoading ? 'Borrando…' : 'Borrar'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:hidden">
            {assignments.map((assignment) => (
              <article
                key={`mobile-${assignment.id_asignacion}`}
                className={`rounded-2xl border px-4 py-4 shadow-sm transition-colors ${
                  darkMode
                    ? 'border-slate-800/80 bg-slate-900/70'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-200">
                      Fecha inicio
                    </p>
                    <p className="mt-1 text-base font-semibold">{assignment.fecha_ini}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${subtleLabelClass}`}>
                      Empleado
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {getUsuarioNombre(assignment.id_empleado)}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${subtleLabelClass}`}>
                        Brigada origen
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {getBrigadaNombre(assignment.id_brigada_origen)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${subtleLabelClass}`}>
                        Brigada destino
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {getBrigadaNombre(assignment.id_brigada_destino)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${subtleLabelClass}`}>
                      Turno
                    </p>
                    <p className="mt-1 text-sm font-semibold">{assignment.turno}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowEditModal(true);
                      }}
                      className={`${
                        darkMode
                          ? 'bg-primary-500/20 text-primary-100 hover:bg-primary-500/30 focus:ring-primary-500/40 focus:ring-offset-slate-900'
                          : 'bg-primary-100 text-primary-700 hover:bg-primary-200 focus:ring-primary-500 focus:ring-offset-white'
                      } ${actionButtonBase} w-full justify-center`}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id_asignacion)}
                      disabled={deleteLoading}
                      className={`${
                        deleteLoading
                          ? darkMode
                            ? 'bg-red-500/20 text-red-200'
                            : 'bg-red-200 text-red-600'
                          : darkMode
                          ? 'bg-red-500/30 text-red-200 hover:bg-red-500/40'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } ${actionButtonBase} w-full justify-center focus:ring-red-500 ${
                        darkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>{deleteLoading ? 'Borrando…' : 'Borrar'}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AssignmentsTable;