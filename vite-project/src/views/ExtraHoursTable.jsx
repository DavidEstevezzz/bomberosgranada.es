import React, { useState, useEffect } from 'react';
import ExtraHourApiService from '../services/ExtraHourApiService';
import EditExtraHourModal from '../components/EditExtraHourModal';
import AddExtraHourModal from '../components/AddExtraHourModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrash,
  faPlus,
  faSortUp,
  faSortDown,
  faChevronLeft,
  faChevronRight,
  faClock,
  faEuroSign,
} from '@fortawesome/free-solid-svg-icons';
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
    } catch (fetchError) {
      console.error('Failed to fetch extra hours:', fetchError);
      setError('No se pudieron cargar las horas extra');
    } finally {
      setLoading(false);
    }
  };

  const sortData = (data, key, direction) => {
    const sorted = [...data].sort((a, b) => {
      if (key === 'nombre') {
        const firstNameA = a.user?.nombre ?? '';
        const firstNameB = b.user?.nombre ?? '';
        return direction === 'asc'
          ? firstNameA.localeCompare(firstNameB)
          : firstNameB.localeCompare(firstNameA);
      }

      if (key === 'fecha') {
        return direction === 'asc'
          ? dayjs(a.date).unix() - dayjs(b.date).unix()
          : dayjs(b.date).unix() - dayjs(a.date).unix();
      }

      return 0;
    });

    return sorted;
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
    if (!window.confirm('¿Seguro que deseas eliminar esta hora extra?')) {
      return;
    }

    try {
      await ExtraHourApiService.deleteExtraHour(id);
      fetchExtraHours();
    } catch (deleteError) {
      console.error('Failed to delete extra hour:', deleteError);
      alert('No se pudo eliminar la hora extra. Inténtalo de nuevo.');
    }
  };

  const handleAddExtraHour = async () => {
    try {
      await fetchExtraHours();
      setIsAddModalOpen(false);
    } catch (addError) {
      console.error('Failed to add extra hour:', addError);
    }
  };

  const handleUpdateExtraHour = async () => {
    try {
      await fetchExtraHours();
      setIsEditModalOpen(false);
    } catch (updateError) {
      console.error('Failed to update extra hour:', updateError);
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

  const monthLabel = (() => {
    const formatted = dayjs(currentMonth).format('MMMM YYYY');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  })();

  const totalDayHours = extraHours.reduce((sum, entry) => sum + (Number(entry.horas_diurnas) || 0), 0);
  const totalNightHours = extraHours.reduce((sum, entry) => sum + (Number(entry.horas_nocturnas) || 0), 0);
  const totalSalary = extraHours.reduce((sum, entry) => {
    const dayRate = Number(entry.salarie?.precio_diurno) || 0;
    const nightRate = Number(entry.salarie?.precio_nocturno) || 0;
    return sum + (Number(entry.horas_diurnas) || 0) * dayRate + (Number(entry.horas_nocturnas) || 0) * nightRate;
  }, 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value || 0);

  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
  }`;
  const sectionCardClass = `rounded-2xl border px-6 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/70'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const actionButtonBaseClass = `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${
    darkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
  }`;

  if (loading) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
        <p className="text-lg font-medium">Cargando horas extra...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
        <p className="text-lg font-semibold text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
            darkMode
              ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
              : 'from-primary-400 via-primary-500 to-primary-600'
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Gestión de horas extra</p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold">Horas extra</h1>
              <p className="max-w-2xl text-base text-white/90">
                Controla las horas diurnas y nocturnas del personal, revisa sus importes y mantén la información accesible para
                todo el equipo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePreviousMonth}
                className={`${actionButtonBaseClass} ${
                  darkMode
                    ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-900/60'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
                <span>Mes anterior</span>
              </button>
              <div className="rounded-2xl bg-white/10 px-5 py-2 text-center text-base font-semibold uppercase tracking-wide backdrop-blur-sm">
                {monthLabel}
              </div>
              <button
                onClick={handleNextMonth}
                className={`${actionButtonBaseClass} ${
                  darkMode
                    ? 'bg-slate-900/70 text-slate-100 hover:bg-slate-900/60'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <span>Mes siguiente</span>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className={`${actionButtonBaseClass} ${
                  darkMode ? 'bg-primary-500/90 text-white hover:bg-primary-400' : 'bg-white/90 text-primary-600 hover:bg-white'
                }`}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Registrar horas</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <div className={sectionCardClass}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div
                className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${
                  darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <p className={`text-sm font-medium uppercase tracking-wide ${subtleTextClass}`}>Registros</p>
                  <p className="text-2xl font-semibold">{extraHours.length}</p>
                </div>
                <FontAwesomeIcon icon={faClock} className="text-2xl text-primary-400" />
              </div>
              <div
                className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${
                  darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <p className={`text-sm font-medium uppercase tracking-wide ${subtleTextClass}`}>Horas totales</p>
                  <p className="text-2xl font-semibold">{totalDayHours + totalNightHours}</p>
                  <p className={`text-sm ${subtleTextClass}`}>
                    {totalDayHours} diurnas · {totalNightHours} nocturnas
                  </p>
                </div>
                <FontAwesomeIcon icon={faClock} className="text-2xl text-primary-400" />
              </div>
              <div
                className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${
                  darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <p className={`text-sm font-medium uppercase tracking-wide ${subtleTextClass}`}>Importe estimado</p>
                  <p className="text-2xl font-semibold">{formatCurrency(totalSalary)}</p>
                </div>
                <FontAwesomeIcon icon={faEuroSign} className="text-2xl text-primary-400" />
              </div>
            </div>
          </div>

          <div className={sectionCardClass}>
            {extraHours.length > 0 ? (
              <>
                <div
                  className={`hidden overflow-hidden rounded-2xl border transition-colors duration-200 lg:block ${
                    darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y text-base">
                      <thead className={darkMode ? 'bg-slate-900/60 text-slate-200' : 'bg-slate-100 text-slate-700'}>
                        <tr>
                          <th
                            className="px-6 py-4 text-left font-semibold uppercase tracking-wide"
                            onClick={() => handleSort('nombre')}
                          >
                            <button className="inline-flex items-center gap-2">
                              <span>Nombre</span>
                              {sortConfig.key === 'nombre' && (
                                <FontAwesomeIcon
                                  icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown}
                                  className="text-primary-400"
                                />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Apellido</th>
                          <th
                            className="px-6 py-4 text-left font-semibold uppercase tracking-wide"
                            onClick={() => handleSort('fecha')}
                          >
                            <button className="inline-flex items-center gap-2">
                              <span>Fecha</span>
                              {sortConfig.key === 'fecha' && (
                                <FontAwesomeIcon
                                  icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown}
                                  className="text-primary-400"
                                />
                              )}
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Horas diurnas</th>
                          <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Horas nocturnas</th>
                          <th className="px-6 py-4 text-left font-semibold uppercase tracking-wide">Importe</th>
                          <th className="px-6 py-4 text-right font-semibold uppercase tracking-wide">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className={darkMode ? 'divide-y divide-slate-800' : 'divide-y divide-slate-200'}>
                        {extraHours.map((extraHour) => {
                          const totalSalaryEntry =
                            (Number(extraHour.horas_diurnas) || 0) * (Number(extraHour.salarie?.precio_diurno) || 0) +
                            (Number(extraHour.horas_nocturnas) || 0) * (Number(extraHour.salarie?.precio_nocturno) || 0);

                          return (
                            <tr key={extraHour.id} className={darkMode ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50/80'}>
                              <td className="px-6 py-5 font-semibold">{extraHour.user?.nombre ?? 'N/A'}</td>
                              <td className="px-6 py-5 font-medium">{extraHour.user?.apellido ?? 'N/A'}</td>
                              <td className="px-6 py-5 font-medium">{dayjs(extraHour.date).format('DD/MM/YYYY')}</td>
                              <td className="px-6 py-5 font-medium">{extraHour.horas_diurnas}</td>
                              <td className="px-6 py-5 font-medium">{extraHour.horas_nocturnas}</td>
                              <td className="px-6 py-5 font-semibold">{formatCurrency(totalSalaryEntry)}</td>
                              <td className="px-6 py-5">
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    onClick={() => handleEditClick(extraHour)}
                                    className={`${actionButtonBaseClass} ${
                                      darkMode
                                        ? 'bg-primary-500/80 text-white hover:bg-primary-400'
                                        : 'bg-primary-500 text-white hover:bg-primary-600'
                                    }`}
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(extraHour.id)}
                                    className={`${actionButtonBaseClass} ${
                                      darkMode
                                        ? 'bg-red-500/80 text-white hover:bg-red-400'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                    <span>Borrar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col gap-4 lg:hidden">
                  {extraHours.map((extraHour) => {
                    const totalSalaryEntry =
                      (Number(extraHour.horas_diurnas) || 0) * (Number(extraHour.salarie?.precio_diurno) || 0) +
                      (Number(extraHour.horas_nocturnas) || 0) * (Number(extraHour.salarie?.precio_nocturno) || 0);

                    return (
                      <article
                        key={`${extraHour.id}-card`}
                        className={`rounded-2xl border px-5 py-5 transition-colors ${
                          darkMode
                            ? 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/60'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium uppercase tracking-wide text-primary-500">
                              {dayjs(extraHour.date).format('DD/MM/YYYY')}
                            </p>
                            <h2 className="text-xl font-semibold leading-tight">
                              {extraHour.user?.nombre ?? 'N/A'} {extraHour.user?.apellido ?? ''}
                            </h2>
                          </div>
                          <span className="rounded-full bg-primary-500/10 px-3 py-1 text-base font-semibold text-primary-600 dark:text-primary-300">
                            {formatCurrency(totalSalaryEntry)}
                          </span>
                        </div>
                        <div className={`mt-4 grid gap-3 text-base ${subtleTextClass}`}>
                          <div className="flex items-center justify-between">
                            <span>Horas diurnas</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {extraHour.horas_diurnas}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Horas nocturnas</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {extraHour.horas_nocturnas}
                            </span>
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() => handleEditClick(extraHour)}
                            className={`${actionButtonBaseClass} ${
                              darkMode
                                ? 'bg-primary-500/80 text-white hover:bg-primary-400'
                                : 'bg-primary-500 text-white hover:bg-primary-600'
                            }`}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(extraHour.id)}
                            className={`${actionButtonBaseClass} ${
                              darkMode
                                ? 'bg-red-500/80 text-white hover:bg-red-400'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            <span>Borrar</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border px-6 py-12 text-center ${
                  darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-lg font-semibold">No hay horas extra registradas este mes</p>
                <p className={`max-w-md text-base ${subtleTextClass}`}>
                  Añade una nueva entrada para comenzar a seguir las horas diurnas y nocturnas y mantener el control del pago
                  correspondiente.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`${actionButtonBaseClass} ${
                    darkMode
                      ? 'bg-primary-500/80 text-white hover:bg-primary-400'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Registrar horas</span>
                </button>
              </div>
            )}
          </div>
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
    </>
  );
};

export default ExtraHoursTable;
