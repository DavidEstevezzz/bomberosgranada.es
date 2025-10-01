import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import CalendarEspeciales from '../components/CalendarEspeciales';
import GuardDetailOptionsModal from '../components/GuardDetailOptionsModal.jsx';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import { useDarkMode } from '../contexts/DarkModeContext';

const GuardDetailCalendarPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [especialGuards, setEspecialGuards] = useState([]);
  const [brigades, setBrigades] = useState([]);
  const [brigadeMap, setBrigadeMap] = useState({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [guardDetailOptions, setGuardDetailOptions] = useState([]);

  useEffect(() => {
    const fetchGuards = async () => {
      try {
        const response = await GuardsApiService.getGuards();
        const filteredEspecialGuards = response.data.filter(
          (guard) =>
            guard.especiales !== null &&
            guard.especiales !== undefined &&
            guard.especiales !== ''
        );

        setEspecialGuards(filteredEspecialGuards);
      } catch (error) {
        console.error('Error fetching guards:', error);
      }
    };

    const fetchBrigades = async () => {
      try {
        const response = await BrigadesApiService.getEspecialBrigades();
        setBrigades(response.data);

        const map = response.data.reduce((acc, brigade) => {
          acc[brigade.id_brigada] = brigade.nombre;
          return acc;
        }, {});
        setBrigadeMap(map);
      } catch (error) {
        console.error('Error fetching special brigades:', error);
      }
    };

    fetchGuards();
    fetchBrigades();
  }, []);

  const getBrigadeDisplayInfo = (brigadeName) => {
    let brigadeColor = '';
    let textColor = 'text-slate-900';

    switch (brigadeName) {
      case 'Brigada A':
        brigadeColor = 'bg-green-500';
        textColor = 'text-white';
        break;
      case 'Brigada B':
        brigadeColor = 'bg-zinc-200';
        textColor = 'text-slate-800';
        break;
      case 'Brigada C':
        brigadeColor = 'bg-blue-500';
        textColor = 'text-white';
        break;
      case 'Brigada D':
        brigadeColor = 'bg-red-600';
        textColor = 'text-white';
        break;
      case 'Brigada E':
        brigadeColor = 'bg-yellow-300';
        textColor = 'text-slate-900';
        break;
      case 'Brigada F':
        brigadeColor = 'bg-gray-300';
        textColor = 'text-slate-700';
        break;
      case 'GREPS':
        brigadeColor = 'bg-orange-500';
        textColor = 'text-white';
        break;
      case 'GRAFOR':
        brigadeColor = 'bg-emerald-500';
        textColor = 'text-white';
        break;
      case 'UNIBUL':
        brigadeColor = 'bg-indigo-500';
        textColor = 'text-white';
        break;
      case 'Riesgos Tecnológicos':
        brigadeColor = 'bg-teal-500';
        textColor = 'text-white';
        break;
      case 'Rescate Accidentes Tráfico':
        brigadeColor = 'bg-sky-500';
        textColor = 'text-white';
        break;
      default:
        brigadeColor = 'bg-slate-300';
        textColor = 'text-slate-700';
    }

    return { brigadeColor, textColor };
  };

  const handleDateClick = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const guardsOnThisDay = especialGuards.filter((guard) => guard.date === dateString);

    if (guardsOnThisDay.length > 0) {
      const options = guardsOnThisDay.map((guard) => {
        const brigadeName = brigadeMap[guard.id_brigada] || 'Sin Brigada';
        const { brigadeColor, textColor } = getBrigadeDisplayInfo(brigadeName);

        return {
          id_brigada: guard.id_brigada,
          date: dateString,
          brigadeName,
          brigadeColor,
          textColor,
          especiales: guard.especiales,
          tipo: guard.tipo,
        };
      });

      setGuardDetailOptions(options);
      setDetailModalOpen(true);
    } else {
      setGuardDetailOptions([]);
      setDetailModalOpen(true);
    }
  };

  const handleSelectOption = (option) => {
    setDetailModalOpen(false);
    navigate(`/guard-detail/${option.id_brigada}/${option.date}`);
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

  return (
    <div className="px-3 py-6 sm:px-8">
      <div className={`${cardContainerClass} space-y-8`}>
        <div className={headerGradientClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                Guardias especiales
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Calendario de grupos especiales</h1>
              <p className="mt-3 max-w-3xl text-base text-white/90">
                Consulta de un vistazo las guardias especiales programadas y accede rápidamente al detalle de cada brigada para gestionar su asistencia.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 text-sm text-white/90 sm:items-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 font-semibold">
                <span className="flex h-2.5 w-2.5 rounded-full bg-white" />
                Toca un día para ver las brigadas asignadas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Selecciona una brigada para acceder al detalle
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 pb-10 sm:px-10">
          <section className={sectionBaseClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Planificación mensual</h2>
                <p className={`mt-1 text-base ${subtleTextClass}`}>
                  Elige un día del calendario para visualizar las brigadas con guardias especiales y acceder a su información detallada.
                </p>
              </div>
            </div>
            <div className={`${surfaceCardClass} mt-6 overflow-hidden px-0 py-0`}>
              <CalendarEspeciales
                onDateClick={handleDateClick}
                guards={especialGuards}
                brigadeMap={brigadeMap}
              />
            </div>
          </section>

          {brigades.length > 0 && (
            <section className={sectionBaseClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Brigadas especiales</h2>
                  <p className={`mt-1 text-base ${subtleTextClass}`}>
                    Referencia rápida de los colores asociados a cada grupo especial para identificarlo dentro del calendario.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {brigades.map((brigade) => {
                  const { brigadeColor, textColor } = getBrigadeDisplayInfo(brigade.nombre);
                  return (
                    <div
                      key={brigade.id_brigada}
                      className={`${surfaceCardClass} flex items-center justify-between gap-4`}
                    >
                      <div>
                        <p className="text-base font-semibold">{brigade.nombre}</p>
                        {brigade.responsable && (
                          <p className={`mt-1 text-sm ${subtleTextClass}`}>
                            Responsable: {brigade.responsable}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex min-w-[90px] items-center justify-center rounded-full px-3 py-1 text-sm font-semibold ${brigadeColor} ${textColor}`}>
                        {brigade.nombre.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {detailModalOpen && (
        <GuardDetailOptionsModal
          isOpen={detailModalOpen}
          options={guardDetailOptions}
          onSelectOption={handleSelectOption}
          onClose={() => setDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GuardDetailCalendarPage;
