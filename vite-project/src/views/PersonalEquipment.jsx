import React, { useState, useEffect, useMemo } from 'react';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
import ParkApiService from '../services/ParkApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCheck, faTimes, faFilePdf, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import EditPersonalEquipmentModal from '../components/EditPersonalEquipmentModal';
import AddPersonalEquipmentModal from '../components/AddPersonalEquipmentModal';
import { useDarkMode } from '../contexts/DarkModeContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PersonalEquipment = () => {
  const [equipments, setEquipments] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParkFilter, setSelectedParkFilter] = useState("Todas");
  const [sortConfig, setSortConfig] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchParks();
  }, []);

  useEffect(() => {
    fetchEquipments();
  }, [selectedParkFilter]);

  const fetchParks = async () => {
    try {
      const response = await ParkApiService.getParks();
      if (response.data) {
        setParks(response.data);
      }
    } catch (error) {
      console.error('Error al cargar parques:', error);
    }
  };

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      let response;

      if (selectedParkFilter === "Todas") {
        response = await PersonalEquipmentApiService.getPersonalEquipments();
      } else {
        // Buscar el ID del parque basado en el nombre seleccionado
        const park = parks.find(p => p.nombre === selectedParkFilter);
        if (park) {
          response = await PersonalEquipmentApiService.getEquipmentsByPark(park.id_parque);
        } else {
          response = await PersonalEquipmentApiService.getPersonalEquipments();
        }
      }

      if (response.data) {
        setEquipments(response.data);
        setError(null);
      } else {
        throw new Error('No se retornaron equipos desde el API');
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      setError('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const normalizeString = (str) => {
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Función para extraer el número del nombre
  const extractNumber = (name) => {
    // Busca patrones como "Batería 10", "Portátil 5", etc.
    const match = name.match(/(\d+)$/);
    if (match) {
      // Si hay un número al final, devuélvelo como entero
      return parseInt(match[0], 10);
    }

    // Si no hay número (como "Batería Norte-1"), retorna el texto original
    return name;
  };

  const getParkName = (parkId) => {
    if (!parkId) return "No asignado";
    const park = parks.find(p => p.id_parque === parkId);
    return park ? park.nombre : `Parque ${parkId}`;
  };

  const handleSort = (column) => {
    setSortConfig((prev) => {
      if (prev && prev.key === column) {
        return { key: column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };

      }
      return { key: column, direction: 'asc' };
    });
  };
  const filteredEquipments = useMemo(() => {
    const normalizedSearch = normalizeString(searchTerm);
    return equipments.filter((equipment) =>
      normalizeString(equipment.nombre).includes(normalizedSearch) ||
      normalizeString(equipment.categoria).includes(normalizedSearch)
    );
  }, [equipments, searchTerm]);

  const sortedEquipments = useMemo(() => {
    const items = [...filteredEquipments];
    if (!sortConfig) {
      return items.sort((a, b) => {
        const categoriasComparadas = normalizeString(a.categoria).localeCompare(normalizeString(b.categoria));
        if (categoriasComparadas !== 0) {
          return categoriasComparadas;
        }
        const baseNameA = a.nombre.replace(/\d+$/, '').trim();
        const baseNameB = b.nombre.replace(/\d+$/, '').trim();
        if (baseNameA !== baseNameB) {
          return baseNameA.localeCompare(baseNameB);
        }
        const numA = extractNumber(a.nombre);
        const numB = extractNumber(b.nombre);
        if (typeof numA === 'number' && typeof numB === 'number') {
          return numA - numB;
        }
        if (a.nombre.includes('Norte') && b.nombre.includes('Sur')) {
          return -1;
        }
        if (a.nombre.includes('Sur') && b.nombre.includes('Norte')) {
          return 1;
        }
        return a.nombre.localeCompare(b.nombre);
      });
    }
    items.sort((a, b) => {
      const order = sortConfig.direction === 'asc' ? 1 : -1;
      switch (sortConfig.key) {
        case 'nombre':
          return order * a.nombre.localeCompare(b.nombre);
        case 'categoria':
          return order * a.categoria.localeCompare(b.categoria);
        case 'parque':
          return order * getParkName(a.parque).localeCompare(getParkName(b.parque));
        case 'disponible':
          return order * ((a.disponible === b.disponible) ? 0 : a.disponible ? -1 : 1);
        default:
          return 0;
      }

    });

    return items;
  }, [filteredEquipments, sortConfig]);

  const parkOptions = useMemo(() => {
    const parkNames = parks
      .map((park) => park.nombre)
      .filter((name) => !!name);
    return ['Todas', ...Array.from(new Set(parkNames))];
  }, [parks]);

  const totalEquipments = equipments.length;
  const availableEquipments = equipments.filter((equipment) => equipment.disponible).length;
  const unavailableEquipments = totalEquipments - availableEquipments;

  const summaryStats = [
    {
      label: 'Equipos totales',
      value: totalEquipments.toLocaleString('es-ES'),
      helper: selectedParkFilter === 'Todas' ? 'Todos los parques' : selectedParkFilter,
    },
    {
      label: 'Disponibles',
      value: availableEquipments.toLocaleString('es-ES'),
      helper: 'En servicio',
    },
    {
      label: 'No disponibles',
      value: unavailableEquipments.toLocaleString('es-ES'),
      helper: 'Revisión necesaria',
    },
  ];

  // Función para exportar a PDF los equipos no disponibles
  const exportToPDF = () => {
    // Filtrar solo los equipos no disponibles
    const unavailableEquipments = sortedEquipments.filter(
      (equipment) => !equipment.disponible
    );

    // Crear el documento PDF
    const doc = new jsPDF();

    // Título y configuración inicial
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102); // Azul oscuro para el título

    // Logo o cabecera (simulado con un rectángulo de color)
    doc.setFillColor(0, 102, 204);
    doc.rect(10, 10, 190, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.text("SERVICIO DE BOMBEROS DE GRANADA", 105, 18, { align: 'center' });

    // Configuración del título del informe
    doc.setTextColor(0, 51, 102);
    let parkTitle = selectedParkFilter === "Todas" ? "Todos los Parques" : selectedParkFilter;
    doc.text(`Informe de Equipos No Disponibles - ${parkTitle}`, 105, 30, { align: 'center' });

    // Fecha actual
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(10);
    doc.text(`Fecha del informe: ${dateStr}`, 105, 38, { align: 'center' });

    // Si no hay equipos no disponibles, mostrar mensaje
    if (unavailableEquipments.length === 0) {
      doc.setFontSize(12);
      doc.text("No hay equipos no disponibles para mostrar en este momento.", 105, 50, { align: 'center' });
      doc.save(`equipos_no_disponibles_${parkTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      return;
    }

    // Preparar datos para la tabla
    const tableData = unavailableEquipments.map(equipment => [
      equipment.nombre,
      equipment.categoria,
      getParkName(equipment.parque),
    ]);

    // Configuración de la tabla
    const tableColumns = [
      'Nombre del Equipo',
      'Categoría',
      'Parque',
    ];

    // Añadir la tabla al documento
    doc.autoTable({
      startY: 45,
      head: [tableColumns],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255] // Azul muy claro para filas alternas
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: 'middle',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center' }, // Nombre centrado
        1: { halign: 'center' }, // Categoría centrada
        2: { halign: 'center' }, // Parque centrado
        3: { halign: 'center' }  // Fecha centrada
      }
    });

    // Pie de página
    const finalY = doc.autoTable.previous.finalY;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128); // Gris para el pie de página
    doc.text("Este informe contiene equipos que se encuentran inoperativos.", 105, finalY + 10, { align: 'center' });
    doc.text("Por favor, notifique al departamento de mantenimiento.", 105, finalY + 15, { align: 'center' });

    // Guardar el PDF
    doc.save(`Equipos_no_disponibles_${parkTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handleEditClick = (equipment) => {
    setSelectedEquipment(equipment);
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  const handleDeleteClick = async (equipment) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el equipo ${equipment.nombre}?`);
    if (!confirmDelete) return;

    try {
      await PersonalEquipmentApiService.deletePersonalEquipment(equipment.id);
      setEquipments((prev) => prev.filter((eq) => eq.id !== equipment.id));
    } catch (error) {
      console.error('Error al eliminar equipo:', error);
      alert('Ocurrió un error al eliminar el equipo.');
    }
  };

  const handleUpdateEquipment = async (updatedEquipment) => {
    try {
      const response = await PersonalEquipmentApiService.updatePersonalEquipment(updatedEquipment.id, updatedEquipment);
      setEquipments((prev) =>
        prev.map((equipment) =>
          equipment.id === updatedEquipment.id ? response.data : equipment
        )
      );
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar equipo:', error);
      alert('Ocurrió un error al actualizar el equipo.');
    }
  };

  const handleAddEquipment = async (newEquipment) => {
    try {
      await fetchEquipments();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error al agregar equipo:', error);
      alert('Ocurrió un error al agregar el equipo');
    }
  };

  const handleToggleDisponibilidad = async (equipment) => {
    try {
      const response = await PersonalEquipmentApiService.toggleDisponibilidad(equipment.id);
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.id === equipment.id ? response.data : eq
        )
      );
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error);
      alert('Ocurrió un error al cambiar el estado de disponibilidad.');
    }
  };

  const pageWrapperClass = `min-h-[calc(100vh-6rem)] w-full px-4 py-10 transition-colors duration-300 ${
    darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
  }`;
  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
    darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
  }`;
  const sectionCardClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50/70'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;
  const primaryButtonClass = `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${
    darkMode
      ? 'bg-primary-500 hover:bg-primary-400 focus:ring-offset-slate-900'
      : 'bg-primary-600 hover:bg-primary-500 focus:ring-offset-white'
  }`;
  const secondaryButtonClass = `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${
    darkMode
      ? 'border border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800 focus:ring-offset-slate-900'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 focus:ring-offset-white'
  }`;
  const filterButtonClass = (active) =>
    `inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
      active
        ? darkMode
          ? 'border-primary-500/60 bg-primary-500/20 text-primary-100'
          : 'border-primary-500 bg-primary-500 text-white shadow-sm'
        : darkMode
          ? 'border-slate-700 bg-slate-900/40 text-slate-200 hover:border-primary-400/60 hover:text-primary-200'
          : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-600'
    }`;
  const statusBadgeClass = (available) =>
    `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
      available
        ? darkMode
          ? 'bg-emerald-500/10 text-emerald-200'
          : 'bg-emerald-50 text-emerald-600'
        : darkMode
          ? 'bg-rose-500/10 text-rose-200'
          : 'bg-rose-50 text-rose-600'
    }`;
  const tableActionButtonClass = (variant) => {
    const baseClass = 'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    switch (variant) {
      case 'edit':
        return `${baseClass} ${
          darkMode
            ? 'bg-slate-900/60 text-slate-100 hover:bg-slate-800 focus:ring-primary-400 focus:ring-offset-slate-900'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-primary-400 focus:ring-offset-white'
        }`;
      case 'toggle-disable':
        return `${baseClass} ${
          darkMode
            ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 focus:ring-amber-400 focus:ring-offset-slate-900'
            : 'bg-amber-50 text-amber-600 hover:bg-amber-100 focus:ring-amber-400 focus:ring-offset-white'
        }`;
      case 'delete':
        return `${baseClass} ${
          darkMode
            ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 focus:ring-rose-400 focus:ring-offset-slate-900'
            : 'bg-rose-50 text-rose-600 hover:bg-rose-100 focus:ring-rose-400 focus:ring-offset-white'
        }`;
      case 'toggle-active':
        return `${baseClass} ${
          darkMode
            ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 focus:ring-emerald-400 focus:ring-offset-slate-900'
            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 focus:ring-emerald-400 focus:ring-offset-white'
        }`;
      default:
        return baseClass;
    }
  };

  if (loading) {
    return (
      <div className={pageWrapperClass}>
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-medium">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageWrapperClass}>
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
            darkMode
              ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
              : 'from-primary-500 via-primary-600 to-primary-700'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Inventario personal
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Equipos personales</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/90">
            Gestiona la disponibilidad de los equipos asignados a cada parque, aplica filtros y exporta listados actualizados.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 px-4 py-4 text-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                {stat.helper && (
                  <p className="mt-1 text-xs text-white/80">{stat.helper}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          {error && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                darkMode
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {error}
            </div>
          )}

          <section className={sectionCardClass}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-200">Filtrado y gestión</p>
                <p className={`text-xs ${subtleTextClass}`}>
                  Selecciona un parque, busca por nombre o categoría y administra los equipos disponibles.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button onClick={handleAddClick} className={primaryButtonClass}>
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Añadir equipo</span>
                </button>
                <button onClick={exportToPDF} className={secondaryButtonClass}>
                  <FontAwesomeIcon icon={faFilePdf} />
                  <span>Exportar no disponibles</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {parkOptions.map((park) => (
                  <button
                    key={park}
                    onClick={() => setSelectedParkFilter(park)}
                    className={filterButtonClass(park === selectedParkFilter)}
                  >
                    {park}
                  </button>
                ))}
              </div>
              <div className="w-full max-w-sm">
                <label htmlFor="equipment-search" className="sr-only">
                  Buscar equipos
                </label>
                <div className="relative">
                  <input
                    id="equipment-search"
                    type="text"
                    placeholder="Buscar por nombre o categoría"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`${inputBaseClass} pr-10`}
                  />
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${
                      darkMode ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={`${sectionCardClass} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className={darkMode ? 'bg-slate-900/60' : 'bg-slate-100/70'}>
                  <tr>
                    <th
                      scope="col"
                      onClick={() => handleSort('nombre')}
                      className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-primary-500 dark:text-slate-300"
                    >
                      Nombre
                    </th>
                    <th
                      scope="col"
                      onClick={() => handleSort('categoria')}
                      className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-primary-500 dark:text-slate-300"
                    >
                      Categoría
                    </th>
                    <th
                      scope="col"
                      onClick={() => handleSort('parque')}
                      className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-primary-500 dark:text-slate-300"
                    >
                      Parque
                    </th>
                    <th
                      scope="col"
                      onClick={() => handleSort('disponible')}
                      className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-primary-500 dark:text-slate-300"
                    >
                      Disponibilidad
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {sortedEquipments.map((equipment) => (
                    <tr
                      key={equipment.id}
                      className={`transition-colors duration-150 ${
                        darkMode ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">{equipment.nombre}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">{equipment.categoria}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">{getParkName(equipment.parque)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className={statusBadgeClass(equipment.disponible)}>
                          <FontAwesomeIcon icon={equipment.disponible ? faCheck : faTimes} />
                          {equipment.disponible ? 'Disponible' : 'No disponible'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(equipment)}
                            className={tableActionButtonClass('edit')}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleDisponibilidad(equipment)}
                            className={tableActionButtonClass(
                              equipment.disponible ? 'toggle-disable' : 'toggle-active'
                            )}
                          >
                            {equipment.disponible ? 'Inhabilitar' : 'Habilitar'}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(equipment)}
                            className={tableActionButtonClass('delete')}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedEquipments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-6 text-center text-sm font-medium">
                        No se encontraron equipos para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Modales */}
          {selectedEquipment && (
            <EditPersonalEquipmentModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              equipment={selectedEquipment}
              onUpdate={handleUpdateEquipment}
              parks={parks}
            />
          )}
          <AddPersonalEquipmentModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddEquipment}
            parks={parks}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalEquipment;
