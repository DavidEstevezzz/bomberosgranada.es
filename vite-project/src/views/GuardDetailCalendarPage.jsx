import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import CalendarEspeciales from '../components/CalendarEspeciales';
import GuardDetailOptionsModal from '../components/GuardDetailOptionsModal.jsx';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';

const GuardDetailCalendarPage = () => {
    const navigate = useNavigate();
    const [especialGuards, setEspecialGuards] = useState([]);
    const [brigades, setBrigades] = useState([]);
    const [brigadeMap, setBrigadeMap] = useState({});
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [guardDetailOptions, setGuardDetailOptions] = useState([]);

    useEffect(() => {
        const fetchGuards = async () => {
            try {
                // Cargar todas las guardias
                const response = await GuardsApiService.getGuards();
                
                // Filtrar solo las que tienen especiales no nulo
                const filteredEspecialGuards = response.data.filter(guard =>
                    guard.especiales !== null &&
                    guard.especiales !== undefined &&
                    guard.especiales !== ""
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

    // Función para determinar los estilos de visualización según la brigada
    const getBrigadeDisplayInfo = (brigadeName) => {
        let brigadeColor = '';
        let textColor = 'text-black';

        switch (brigadeName) {
            // Casos originales
            case 'Brigada A':
                brigadeColor = 'bg-green-500';
                break;
            case 'Brigada B':
                brigadeColor = 'bg-zinc-50';
                break;
            case 'Brigada C':
                brigadeColor = 'bg-blue-500';
                break;
            case 'Brigada D':
                brigadeColor = 'bg-red-600';
                textColor = 'text-white';
                break;
            case 'Brigada E':
                brigadeColor = 'bg-yellow-300';
                break;
            case 'Brigada F':
                brigadeColor = 'bg-gray-300';
                textColor = 'text-gray-600';
                break;
            // Nuevas brigadas
            case 'GREPS':
                brigadeColor = 'bg-orange-500';
                textColor = 'text-white';
                break;
            case 'GRAFOR':
                brigadeColor = 'bg-green-500';
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
                brigadeColor = 'bg-blue-500';
                textColor = 'text-white';
                break;
            default:
                brigadeColor = 'bg-gray-200';
        }

        return { brigadeColor, textColor };
    };

    const handleDateClick = (date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const guardsOnThisDay = especialGuards.filter(guard => guard.date === dateString);

        if (guardsOnThisDay.length > 0) {
            // Construir opciones para el modal
            const options = guardsOnThisDay.map(guard => {
                const brigadeName = brigadeMap[guard.id_brigada] || 'Sin Brigada';
                const { brigadeColor, textColor } = getBrigadeDisplayInfo(brigadeName);
                
                return {
                    id_brigada: guard.id_brigada,
                    date: dateString,
                    brigadeName,
                    brigadeColor,
                    textColor,
                    // Incluimos también la información de especiales por si se necesita mostrar en la página de detalles
                    especiales: guard.especiales,
                    tipo: guard.tipo
                };
            });

            setGuardDetailOptions(options);
            setDetailModalOpen(true);
        } else {
            // Si no hay guardias, mostrar modal vacío
            setGuardDetailOptions([]);
            setDetailModalOpen(true);
        }
    };

    const handleSelectOption = (option) => {
        // Cierra el modal de opciones
        setDetailModalOpen(false);
        
        // Navegar a la página de detalle usando la ruta del componente existente
        navigate(`/guard-detail/${option.id_brigada}/${option.date}`);
    };

    return (
        <div className="flex flex-col items-start justify-start min-h-screen mt-3">
            <div className="w-full p-4 bg-gray-50 rounded-lg shadow-lg">
                <h1 className="text-2xl text-center font-bold mb-4 ">Calendario de Grupos especiales</h1>
                
                {/* Ahora usamos el nuevo componente CalendarEspeciales */}
                <CalendarEspeciales
                    onDateClick={handleDateClick}
                    guards={especialGuards}
                    brigadeMap={brigadeMap}
                />
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