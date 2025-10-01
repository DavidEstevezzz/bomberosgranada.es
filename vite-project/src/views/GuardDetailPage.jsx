import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import BrigadeUsersApiService from '../services/BrigadeUserApiService';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const GuardDetailPage = () => {
  const { brigadeId, date } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [guard, setGuard] = useState(null);
  const [brigade, setBrigade] = useState(null);
  const [brigadeUsers, setBrigadeUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [processingUser, setProcessingUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const brigadeResponse = await BrigadesApiService.getBrigade(brigadeId);
        if (!brigadeResponse || !brigadeResponse.data) {
          setError('No se pudo obtener información de la brigada.');
          setLoading(false);
          return;
        }
        setBrigade(brigadeResponse.data);

        const guardsResponse = await GuardsApiService.getGuards();
        if (guardsResponse && guardsResponse.data) {
          const guardsFiltered = guardsResponse.data.filter(
            (g) =>
              g.id_brigada == brigadeId &&
              g.date === date &&
              g.especiales !== null &&
              g.especiales !== undefined &&
              g.especiales !== ''
          );

          if (guardsFiltered.length > 0) {
            setGuard(guardsFiltered[0]);
          }
        }

        const brigadeUsersResponse = await BrigadeUsersApiService.getUsersByBrigade(brigadeId);
        let formattedUsers = [];
        if (brigadeUsersResponse.data && brigadeUsersResponse.data.brigadeUsers) {
          formattedUsers = brigadeUsersResponse.data.brigadeUsers;
        }
        setBrigadeUsers(formattedUsers);

        const assignmentsData = {};
        for (const user of formattedUsers) {
          try {
            const checkResponse = await AssignmentsApiService.checkEspecialAssignment(
              brigadeId,
              date,
              user.id_usuario
            );
            assignmentsData[user.id_usuario] = checkResponse.data.has_assignments || false;
          } catch (assignError) {
            assignmentsData[user.id_usuario] = false;
          }
        }

        setAssignments(assignmentsData);
        setLoading(false);
      } catch (fetchError) {
        console.error('Error en fetchData:', fetchError);
        setError('Ocurrió un error al cargar los detalles de la guardia.');
        setLoading(false);
      }
    };

    fetchData();
  }, [brigadeId, date]);

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const parsedDate = new Date(dateString);
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const toggleUserAssignment = async (userId) => {
    if (!guard || !guard.especiales) return;

    try {
      setProcessingUser(userId);
      const isCurrentlyAssigned = assignments[userId];
      const payload = {
        id_empleado: userId,
        id_brigada_destino: parseInt(brigadeId, 10),
        fecha: date,
      };

      if (isCurrentlyAssigned) {
        if (guard.especiales.includes('Prácticas')) {
          await AssignmentsApiService.deletePracticesAssignments(brigadeId, date, userId);

          await BrigadeUsersApiService.incrementPracticas({
            id_brigada: parseInt(brigadeId, 10),
            id_usuario: userId,
            increment: -1,
          });
        } else if (guard.especiales.includes('Guardia localizada')) {
          await AssignmentsApiService.deleteRTAssignments(brigadeId, date, userId);
        }

        setAssignments((prev) => ({
          ...prev,
          [userId]: false,
        }));
      } else {
        if (guard.especiales.includes('Prácticas')) {
          await AssignmentsApiService.createPracticesAssignments(payload);

          await BrigadeUsersApiService.incrementPracticas({
            id_brigada: parseInt(brigadeId, 10),
            id_usuario: userId,
            increment: 1,
          });
        } else if (guard.especiales.includes('Guardia localizada')) {
          await AssignmentsApiService.createRTAssignments(payload);
        }

        setAssignments((prev) => ({
          ...prev,
          [userId]: true,
        }));
      }

      setProcessingUser(null);
    } catch (toggleError) {
      console.error('Error toggling user assignment:', toggleError);
      setProcessingUser(null);
      alert('Ocurrió un error al actualizar la asignación.');
    }
  };

  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-6xl overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
    darkMode
      ? 'border-slate-800 bg-slate-950/80 text-slate-100'
      : 'border-slate-200 bg-white/95 text-slate-900'
  }`;
  const headerGradientClass = `bg-gradient-to-r px-6 py-8 sm:px-10 text-white transition-colors duration-300 ${
    darkMode
      ? 'from-primary-950 via-primary-800 to-primary-600'
      : 'from-primary-400 via-primary-500 to-primary-600'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const sectionBaseClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/70'
  }`;
  const surfaceCardClass = `rounded-2xl border px-5 py-5 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'
  }`;

  if (loading) {
    return (
      <div className="px-3 py-6 sm:px-8">
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            <p className="text-base font-medium">Cargando detalles de la guardia...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-6 sm:px-8">
        <div className={`${cardContainerClass} space-y-6`}>
          <div className={headerGradientClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                  Guardias especiales
                </p>
                <h1 className="mt-2 text-3xl font-semibold">Detalle no disponible</h1>
                <p className="mt-3 max-w-2xl text-base text-white/90">
                  No hemos podido cargar la información solicitada. Inténtalo de nuevo más tarde.
                </p>
              </div>
              <button
                onClick={handleBack}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0 7-7m-7 7h18" />
                </svg>
                Volver al calendario
              </button>
            </div>
          </div>
          <div
            className={`mx-6 mb-8 rounded-2xl border px-5 py-5 text-base font-medium ${
              darkMode
                ? 'border-red-500/40 bg-red-500/10 text-red-100'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!brigade) {
    return (
      <div className="px-3 py-6 sm:px-8">
        <div className={`${cardContainerClass} space-y-6`}>
          <div className={headerGradientClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                  Guardias especiales
                </p>
                <h1 className="mt-2 text-3xl font-semibold">No se encontró información</h1>
                <p className="mt-3 max-w-2xl text-base text-white/90">
                  La brigada seleccionada no cuenta con datos disponibles en la fecha indicada.
                </p>
              </div>
              <button
                onClick={handleBack}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0 7-7m-7 7h18" />
                </svg>
                Volver al calendario
              </button>
            </div>
          </div>
          <div className={`${surfaceCardClass} mx-6 mb-8 text-center`}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-semibold">No hay datos disponibles</h2>
            <p className={`mt-2 text-base ${subtleTextClass}`}>
              Comprueba otra fecha o brigada para consultar la información de guardia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-6 sm:px-8">
      <div className={`${cardContainerClass} space-y-8`}>
        <div className={headerGradientClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                Guardias especiales
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Detalle de la guardia</h1>
              <p className="mt-3 max-w-2xl text-base text-white/90">
                Consulta la información de la brigada seleccionada y gestiona rápidamente la asistencia del personal asignado.
              </p>
            </div>
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0 7-7m-7 7h18" />
              </svg>
              Volver al calendario
            </button>
          </div>
        </div>

        <div className="space-y-8 px-6 pb-10 sm:px-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className={sectionBaseClass}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Brigada asignada</h2>
                  <p className={`mt-1 text-base ${subtleTextClass}`}>
                    Información general de la brigada responsable de la guardia especial.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-5 text-base">
                <div className={surfaceCardClass}>
                  <p className={`text-sm font-medium uppercase tracking-[0.2em] ${subtleTextClass}`}>
                    Nombre
                  </p>
                  <p className="mt-2 text-lg font-semibold">{brigade.nombre}</p>
                </div>
                {brigade.responsable && (
                  <div className={surfaceCardClass}>
                    <p className={`text-sm font-medium uppercase tracking-[0.2em] ${subtleTextClass}`}>
                      Responsable
                    </p>
                    <p className="mt-2 text-lg font-semibold">{brigade.responsable}</p>
                  </div>
                )}
              </div>
            </section>

            <section className={sectionBaseClass}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Detalles de la guardia</h2>
                  <p className={`mt-1 text-base ${subtleTextClass}`}>
                    Fecha y observaciones destacadas de la guardia especial.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-5 text-base">
                <div className={surfaceCardClass}>
                  <p className={`text-sm font-medium uppercase tracking-[0.2em] ${subtleTextClass}`}>
                    Fecha
                  </p>
                  <p className="mt-2 text-lg font-semibold">{formatDate(date)}</p>
                </div>
                {guard && guard.especiales ? (
                  <div className={surfaceCardClass}>
                    <p className={`text-sm font-medium uppercase tracking-[0.2em] ${subtleTextClass}`}>
                      Información especial
                    </p>
                    <p className="mt-2 text-base leading-relaxed">{guard.especiales}</p>
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl border px-5 py-4 text-base font-medium ${
                      darkMode
                        ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    No se encontraron notas especiales para esta guardia.
                  </div>
                )}
              </div>
            </section>
          </div>

          <section className={sectionBaseClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Personal asignado</h2>
                  <p className={`mt-1 text-base ${subtleTextClass}`}>
                    Controla quién acude a la guardia y actualiza el estado en tiempo real.
                  </p>
                </div>
              </div>
            </div>

            {brigadeUsers && brigadeUsers.length > 0 ? (
              <div className={`${surfaceCardClass} mt-6 overflow-hidden px-0 py-0`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className={darkMode ? 'bg-slate-900/60' : 'bg-slate-100'}>
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.18em]">
                          Bombero
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em]">
                          Estado
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em]">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {brigadeUsers.map((brigadeUser) => (
                        <tr
                          key={brigadeUser.id}
                          className={`${darkMode ? 'hover:bg-slate-900/70' : 'hover:bg-slate-50'} transition-colors`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
                                  darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {(brigadeUser.user?.nombre?.charAt(0) ?? '').toUpperCase()}
                                {(brigadeUser.user?.apellido?.charAt(0) ?? '').toUpperCase()}
                              </div>
                              <div>
                                <p className="text-base font-semibold">
                                  {brigadeUser.user?.nombre} {brigadeUser.user?.apellido}
                                </p>
                                {brigadeUser.user?.puesto && (
                                  <p className={`mt-1 text-sm ${subtleTextClass}`}>
                                    {brigadeUser.user.puesto}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
                                assignments[brigadeUser.id_usuario]
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
                              }`}
                            >
                              {assignments[brigadeUser.id_usuario] ? (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Acude
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  No acude
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleUserAssignment(brigadeUser.id_usuario)}
                              disabled={processingUser === brigadeUser.id_usuario}
                              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition-all ${
                                assignments[brigadeUser.id_usuario]
                                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:shadow-lg'
                                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg'
                              } ${
                                processingUser === brigadeUser.id_usuario
                                  ? 'cursor-not-allowed opacity-70'
                                  : 'hover:scale-[1.02]'
                              }`}
                            >
                              {processingUser === brigadeUser.id_usuario ? (
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                              ) : assignments[brigadeUser.id_usuario] ? (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              )}
                              {processingUser === brigadeUser.id_usuario
                                ? 'Actualizando'
                                : assignments[brigadeUser.id_usuario]
                                ? 'Quitar'
                                : 'Asignar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className={`${surfaceCardClass} mt-6 text-center`}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-300">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-semibold">Sin personal asignado</h3>
                <p className={`mt-2 text-base ${subtleTextClass}`}>
                  No hay bomberos asociados a esta brigada para la fecha indicada.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default GuardDetailPage;
