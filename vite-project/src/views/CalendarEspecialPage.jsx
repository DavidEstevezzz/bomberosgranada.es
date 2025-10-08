import React, { useState, useEffect } from 'react';
import Calendar from '../components/CalendarEspeciales';
import GuardEspecialModal from '../components/GuardEspecialModal';
import GuardOptionsModal from '../components/GuardOptionsModal';
import EditGuardEspecialModal from '../components/EditGuardEspecialModal';
import GuardsApiService from '../services/GuardsApiService';
import BrigadesApiService from '../services/BrigadesApiService';
import UsuariosApiService from '../services/UsuariosApiService';
import { format } from 'date-fns';

const CalendarEspecialPage = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedGuard, setSelectedGuard] = useState(null);
    const [allGuards, setAllGuards] = useState([]);
    const [especialGuards, setEspecialGuards] = useState([]); // Solo guardias con especiales no nulo
    const [brigades, setBrigades] = useState([]);
    const [brigadeMap, setBrigadeMap] = useState({});
    const [isMandoEspecial, setIsMandoEspecial] = useState(false);
    const [user, setUser] = useState(null);
    const [guardOptionsModalOpen, setGuardOptionsModalOpen] = useState(false);
    const [guardOptions, setGuardOptions] = useState([]);
    const idParque = 1;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await UsuariosApiService.getUserByToken();
                setUser(response.data);

                const mandoEspecialResponse = await UsuariosApiService.checkMandoEspecial(response.data.id_empleado);
                setIsMandoEspecial(mandoEspecialResponse.data.mando_especial);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const fetchGuards = async () => {
            try {
                // Cargar todas las guardias
                const response = await GuardsApiService.getGuards();
                console.log('Guardias recibidas del API:', response.data);
                
                setAllGuards(response.data);

                // Filtrar solo las que tienen especiales no nulo
                const filteredEspecialGuards = response.data.filter(guard =>
                    guard.especiales !== null &&
                    guard.especiales !== undefined &&
                    guard.especiales !== ""
                );

                // Loguear las guardias especiales para depuración
                console.log('Guardias especiales filtradas:', filteredEspecialGuards);
                
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

        fetchUserData();
        fetchGuards();
        fetchBrigades();
    }, []);

    const handleDateClick = (date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const especialGuardsOnThisDay = especialGuards.filter(guard => guard.date === dateString);

        console.log('Fecha seleccionada:', dateString);
        console.log('Guardias especiales en esta fecha:', especialGuardsOnThisDay);

        if (especialGuardsOnThisDay.length > 0) {
            // Se construye la lista de opciones
            const options = [
                {
                    type: 'add',
                    label: 'Añadir guardia',
                    date,  // Podemos pasar la fecha para usarla al crear
                }
            ];

            especialGuardsOnThisDay.forEach((guard) => {
                // Se obtiene el nombre de la brigada usando brigadeMap
                const brigadeName = brigadeMap[guard.id_brigada] || 'Sin Brigada';
                
                // Verificamos que la guardia tiene un ID válido
                const guardId = guard.id_guard || guard.id;
                if (!guardId) {
                    console.warn('Guardia sin ID detectada:', guard);
                }
                
                options.push({
                    type: 'edit',
                    label: `Editar guardia ${brigadeName}`,
                    guard,  // Pasamos la guardia para poder editarla
                });
            });

            setGuardOptions(options);
            setGuardOptionsModalOpen(true);
        } else {
            // Si no hay guardias, se abre el modal de creación directamente
            setSelectedDate(date);
            setModalOpen(true);
        }
    };

    const handleSelectOption = (option) => {
        // Cierra el modal de opciones
        setGuardOptionsModalOpen(false);

        if (option.type === 'add') {
            // Abrir el modal de creación para la fecha seleccionada
            setSelectedDate(option.date);
            setModalOpen(true);
        } else if (option.type === 'edit') {
            // Loguear la guardia para depuración
            console.log('Guardia seleccionada para editar:', option.guard);
            
            // Verificar si la guardia tiene los IDs necesarios
            if (!option.guard.id_guard && !option.guard.id) {
                console.error('La guardia no tiene un ID válido:', option.guard);
                alert('No se puede editar esta guardia: falta el ID');
                return;
            }
            
            // Abrir el modal de edición para la guardia seleccionada
            setSelectedGuard(option.guard);
            setEditModalOpen(true);
        }
    };

    return (
        <div className="flex flex-col items-start justify-start min-h-screen mt-3">
                <Calendar
                    onDateClick={handleDateClick}
                    onEditClick={(guard) => {
                        if (!isMandoEspecial) return;

                        // Loguear la guardia para depuración
                        console.log('Guardia para editar desde calendario:', guard);
                        
                        // Verificar que la guardia sea especial antes de editarla
                        if (guard.especiales) {
                            // Verificar si tiene ID
                            if (!guard.id_guard && !guard.id) {
                                console.error('La guardia no tiene un ID válido:', guard);
                                alert('No se puede editar esta guardia: falta el ID');
                                return;
                            }
                            
                            setSelectedGuard(guard);
                            setEditModalOpen(true);
                        }
                    }}
                    guards={especialGuards} // Solo mostrar guardias especiales en el calendario
                    brigadeMap={brigadeMap}
                />

            {modalOpen && (
                <GuardEspecialModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    guardDate={selectedDate}
                    setGuards={(newGuards) => {
                        // Verificar estructura de las nuevas guardias
                        console.log('Nuevas guardias creadas:', newGuards);
                        
                        // Actualizar el estado de guardias
                        if (Array.isArray(newGuards)) {
                            setEspecialGuards(prev => [...prev, ...newGuards.filter(g => g.especiales)]);
                        } else {
                            // Si es una sola guardia
                            if (newGuards.especiales) {
                                setEspecialGuards(prev => [...prev, newGuards]);
                            }
                        }
                    }}
                    brigades={brigades}
                />
            )}

            {guardOptionsModalOpen && (
                <GuardOptionsModal
                    isOpen={guardOptionsModalOpen}
                    options={guardOptions}
                    onSelectOption={handleSelectOption}
                    onClose={() => setGuardOptionsModalOpen(false)}
                />
            )}

            {editModalOpen && (
                <EditGuardEspecialModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    guard={selectedGuard}
                    setGuards={(updatedGuards) => {
                        console.log('Actualización de guardias recibida:', updatedGuards);
                        
                        // Actualizar el estado de guardias especiales
                        if (Array.isArray(updatedGuards)) {
                            setEspecialGuards(updatedGuards.filter(g => g.especiales));
                        } else {
                            // Si es solo una guardia actualizada
                            const guardId = selectedGuard.id_guard || selectedGuard.id;
                            
                            if (updatedGuards.especiales) {
                                setEspecialGuards(prev => prev.map(g =>
                                    (g.id_guard === guardId || g.id === guardId) ? updatedGuards : g
                                ));
                            } else {
                                // Si la guardia ya no es especial, eliminarla del estado
                                setEspecialGuards(prev => prev.filter(g => 
                                    g.id_guard !== guardId && g.id !== guardId
                                ));
                            }
                        }
                        
                        // Cerrar el modal después de actualizar
                        setEditModalOpen(false);
                    }}
                    availableBrigades={brigades}
                />
            )}
        </div>
    );
};

export default CalendarEspecialPage;