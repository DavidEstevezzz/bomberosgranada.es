import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/es';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronLeft, faChevronRight, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import AssignmentsTable from '../components/AssignmentsTable';
import AddAssignmentModal from '../components/AddAssignmentModal';
import EditAssignmentModal from '../components/EditAssignmentModal';
import AssignmentsApiService from '../services/AssignmentsApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

dayjs.locale('es');
dayjs.extend(isBetween);

// Función para normalizar texto (eliminar acentos y convertir a minúsculas)
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const FirefighterAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [currentPage, setCurrentPage] = useState(1);
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const itemsPerPage = 15;

  const { darkMode } = useDarkMode();

  const subtleTextClass = darkMode
    ? 'text-slate-300'
    : 'text-slate-600';
  const cardContainerClass = `min-h-screen w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
  darkMode
    ? 'border-slate-800 bg-slate-950/60 text-slate-100'
    : 'border-slate-200 bg-white/90 text-slate-900 backdrop-blur'
}`;
  const headerGradientClass = `bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
    darkMode
      ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
      : 'from-primary-600 via-primary-700 to-primary-800'
  }`;
  const sectionCardClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode
      ? 'border-slate-800 bg-slate-900/60'
      : 'border-slate-200 bg-slate-50/70'
  }`;
  const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-base font-medium shadow-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-transparent ${
    darkMode
      ? 'border-slate-700 bg-slate-900/80 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const pillButtonBaseClass = `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2`;
  const neutralPillButtonClass = `${pillButtonBaseClass} ${
    darkMode
      ? 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
      : 'bg-white text-slate-700 hover:bg-slate-100'
  }`;
  const primaryPillButtonClass = `${pillButtonBaseClass} ${
    darkMode
      ? 'bg-primary-500/80 text-white hover:bg-primary-500'
      : 'bg-primary-500 text-white hover:bg-primary-600'
  }`;

  useEffect(() => {
    fetchAssignments();
  }, [currentMonth]);

  useEffect(() => {
    filterAssignmentsByMonth();
  }, [assignments, currentMonth]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Cargar asignaciones y usuarios en paralelo
        const [assignmentsResponse, usuariosResponse] = await Promise.all([
          AssignmentsApiService.getAssignments(),
          UsuariosApiService.getUsuarios()
        ]);

        setAssignments(assignmentsResponse.data);
        setUsuarios(usuariosResponse.data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await AssignmentsApiService.getAssignments();
      setAssignments(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const filterAssignmentsByMonth = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const filtered = assignments.filter((assignment) => {
      const assignmentDate = dayjs(assignment.fecha_ini);
      return assignmentDate.isBetween(startOfMonth, endOfMonth, 'day', '[]');
    });
    setFilteredAssignments(filtered);
    setCurrentPage(1);
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth(currentMonth.add(direction, 'month'));
  };

  const getUsuarioNombre = (id_empleado) => {
    const usuario = usuarios.find(usuario => usuario.id_empleado === id_empleado);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido';
  };

  // Función para ordenar los datos
  const sortData = (data, sortConfig) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (sortConfig.key === 'nombre') {
        const aValue = getUsuarioNombre(a.id_empleado);
        const bValue = getUsuarioNombre(b.id_empleado);

        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (sortConfig.key === 'fecha_ini') {
        const aValue = dayjs(a.fecha_ini);
        const bValue = dayjs(b.fecha_ini);

        return sortConfig.direction === 'asc'
          ? aValue.diff(bValue)
          : bValue.diff(aValue);
      }
      return 0;
    });
  };

  // Manejador para ordenar al hacer clic en encabezados de columna
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const paginate = (data) => {
    // Aplicar ordenación antes de la paginación
    const sortedData = sortData(data, sortConfig);
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  };

  // Se aplica la búsqueda sobre el conjunto completo filtrado por mes, ahora normalizando el texto
  const searchedAssignments = filteredAssignments.filter((assignment) => {
    if (!searchTerm.trim()) return true;

    const fullName = getUsuarioNombre(assignment.id_empleado);
    const normalizedFullName = normalizeText(fullName);
    const normalizedSearchTerm = normalizeText(searchTerm);

    const words = normalizedSearchTerm.split(/\s+/).filter(Boolean);
    return words.every(word => normalizedFullName.includes(word));
  });

  const paginatedAssignments = paginate(searchedAssignments);

  const totalPages = Math.ceil(searchedAssignments.length / itemsPerPage);

  const handleAdd = () => {
    fetchAssignments();
  };

  const handleEdit = () => {
    fetchAssignments();
  };

  const handleDelete = async (id) => {
    if (deleteLoading) return;

    setDeleteLoading(true);
    try {
      await AssignmentsApiService.deleteAssignment(id);
      setAssignments(assignments.filter((a) => a.id_asignacion !== id));
      setFilteredAssignments(filteredAssignments.filter((a) => a.id_asignacion !== id));
      console.log('Asignación eliminada con éxito');
    } catch (error) {
      console.error('Error al eliminar la asignación:', error);
      setError('No se pudo eliminar la asignación');
      fetchAssignments();
    } finally {
      setDeleteLoading(false);
    }
  };

  const stats = [
    {
      label: 'Asignaciones del mes',
      value: filteredAssignments.length
    },
    {
      label: 'Resultados visibles',
      value: searchedAssignments.length
    },
    {
      label: 'Bomberos registrados',
      value: usuarios.length
    }
  ];

  return (
    <>
      <div className={cardContainerClass}>
        <div className={headerGradientClass}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
            Planificación de brigadas
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                Asignaciones de Bomberos
              </h1>
              <p className="mt-3 max-w-2xl text-base text-white/90">
                Gestiona las asignaciones activas y la modificación de las mismas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleMonthChange(-1)}
                className={neutralPillButtonClass}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                <span>Mes anterior</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className={primaryPillButtonClass}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Nueva asignación</span>
              </button>
              <button
                type="button"
                onClick={() => handleMonthChange(1)}
                className={neutralPillButtonClass}
              >
                <span>Mes siguiente</span>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 text-base font-semibold text-white shadow-lg backdrop-blur">
            <span>{currentMonth.format('MMMM YYYY')}</span>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          {(loading || error) && (
            <div
              className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
                loading
                  ? darkMode
                    ? 'border-primary-500/40 bg-primary-500/10 text-primary-100'
                    : 'border-primary-200 bg-primary-50 text-primary-700'
                  : ''
              } ${
                error
                  ? darkMode
                    ? 'border-red-500/40 bg-red-500/10 text-red-200'
                    : 'border-red-200 bg-red-50 text-red-700'
                  : ''
              }`}
            >
              {loading ? 'Cargando asignaciones...' : `Error: ${error}`}
            </div>
          )}

          <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className={sectionCardClass}>
              <label className="text-sm font-semibold text-primary-600 dark:text-primary-200">
                Búsqueda avanzada
              </label>
              <p className={`mt-2 text-sm ${subtleTextClass}`}>
                Filtra por nombre y apellidos para localizar rápidamente a cualquier miembro del cuerpo.
              </p>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre y apellido"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={inputBaseClass}
                />
              </div>
            </div>

            <div className={`${sectionCardClass} flex flex-col justify-between gap-5`}>
              <div>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-200">
                  Resumen del periodo
                </p>
                <p className={`mt-2 text-sm ${subtleTextClass}`}>
                  Información clave para el mes seleccionado.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-2xl px-4 py-3 text-center shadow-sm ${
                      darkMode
                        ? 'bg-slate-900/70 text-slate-100'
                        : 'bg-white text-slate-800'
                    }`}
                  >
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-600 dark:text-primary-200">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={sectionCardClass}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Listado de asignaciones</h2>
                <p className={`mt-2 text-sm ${subtleTextClass}`}>
                  Consulta, edita o elimina asignaciones directamente desde la tabla interactiva.
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${
                darkMode
                  ? 'bg-primary-500/20 text-primary-100'
                  : 'bg-primary-100 text-primary-700'
              }`}>
                <FontAwesomeIcon icon={faSortUp} />
                <FontAwesomeIcon icon={faSortDown} />
                <span>Ordenación disponible</span>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-dashed border-slate-300/60 dark:border-slate-700/60">
              {loading ? (
                <div className="px-6 py-12 text-center text-base font-medium">
                  Cargando asignaciones...
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="px-6 py-12 text-center text-base font-medium">
                  No hay asignaciones registradas para este mes.
                </div>
              ) : searchedAssignments.length === 0 ? (
                <div className="px-6 py-12 text-center text-base font-medium">
                  No se encontraron resultados para la búsqueda actual.
                </div>
              ) : (
                <AssignmentsTable
                  assignments={paginatedAssignments}
                  setSelectedAssignment={setSelectedAssignment}
                  setShowEditModal={setShowEditModal}
                  handleDelete={handleDelete}
                  darkMode={darkMode}
                  deleteLoading={deleteLoading}
                  sortConfig={sortConfig}
                  handleSort={handleSort}
                />
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className={`text-sm ${subtleTextClass}`}>
                Mostrando {paginatedAssignments.length} de {searchedAssignments.length} resultados
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || searchedAssignments.length === 0}
                  className={`${neutralPillButtonClass} ${
                    currentPage === 1 || searchedAssignments.length === 0
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  Anterior
                </button>
                <span className="text-base font-semibold">
                  Página {Math.min(currentPage, totalPages || 1)} de {totalPages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`${neutralPillButtonClass} ${
                    currentPage === totalPages || totalPages === 0
                      ? 'cursor-not-allowed opacity-60'
                      : ''
                  }`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <AddAssignmentModal show={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      <EditAssignmentModal
        assignment={selectedAssignment}
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onEdit={handleEdit}
      />
    </>
  );
};

export default FirefighterAssignment;
