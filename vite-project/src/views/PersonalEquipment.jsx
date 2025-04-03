import React, { useState, useEffect } from 'react';
import PersonalEquipmentApiService from '../services/PersonalEquipmentApiService';
import ParkApiService from '../services/ParkApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEllipsisH, faCheck, faTimes, faFilePdf } from '@fortawesome/free-solid-svg-icons';
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
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const { darkMode } = useDarkMode();

  useEffect(() => {
    fetchEquipments();
    fetchParks();
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

  // Filtra equipos por nombre o categoría
  const filteredEquipments = equipments.filter((equipment) => {
    const normalizedSearch = normalizeString(searchTerm);
    return (
      normalizeString(equipment.nombre).includes(normalizedSearch) ||
      normalizeString(equipment.categoria).includes(normalizedSearch)
    );
  });

  // Función para exportar a PDF los equipos no disponibles
  const exportToPDF = () => {
    // Filtrar solo los equipos no disponibles
    const unavailableEquipments = filteredEquipments.filter(
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
        0: { halign: 'left' }, // Nombre alineado a la izquierda
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
    doc.save(`equipos_no_disponibles_${parkTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`);
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

  // Función para obtener el nombre del parque según el ID
  const getParkName = (parkId) => {
    if (!parkId) return "No asignado";
    const park = parks.find(p => p.id_parque === parkId);
    return park ? park.nombre : `Parque ${parkId}`;
  };

  if (loading) return <div>Cargando equipos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-8 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-300'}`}>
      {/* Cabecera y botones */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold mb-4 md:mb-0 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
          Equipos Personales
        </h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Añadir equipo</span>
          </button>
          <button
            onClick={exportToPDF}
            className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            <span>Exportar No Disponibles a PDF</span>
          </button>
        </div>
      </div>

      {/* Filtro por parque */}
      <div className="flex justify-center space-x-4 mb-4">
        <button
          onClick={() => setSelectedParkFilter("Todas")}
          className={`px-4 py-2 rounded ${selectedParkFilter === "Todas" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"}`}
        >
          Todas
        </button>
        <button
          onClick={() => setSelectedParkFilter("Parque Norte")}
          className={`px-4 py-2 rounded ${selectedParkFilter === "Parque Norte" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"}`}
        >
          Parque Norte
        </button>
        <button
          onClick={() => setSelectedParkFilter("Parque Sur")}
          className={`px-4 py-2 rounded ${selectedParkFilter === "Parque Sur" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-800"}`}
        >
          Parque Sur
        </button>
      </div>

      {/* Panel de búsqueda */}
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-black'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-600 pb-2 mb-4 space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="Buscar equipos (nombre, categoría)"
            value={searchTerm}
            onChange={handleSearchChange}
            className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'} px-4 py-2 rounded w-full md:w-3/4`}
          />
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faEllipsisH} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
        </div>

        {/* Tabla de equipos */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="py-2 px-2 text-center">Nombre</th>
                <th className="py-2 px-2 text-center">Categoría</th>
                <th className="py-2 px-2 text-center">Parque</th>
                <th className="py-2 px-2 text-center">Disponible</th>
                <th className="py-2 px-2 text-center" style={{ width: '300px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map((equipment) => (
                <tr 
                  key={equipment.id} 
                  className={`border-b border-gray-700`}
                >
                  <td className="py-2 px-2 text-center">{equipment.nombre}</td>
                  <td className="py-2 px-2 text-center">{equipment.categoria}</td>
                  <td className="py-2 px-2 text-center">{getParkName(equipment.parque)}</td>
                  <td className="py-2 px-2 text-center">
                    {equipment.disponible ? (
                      <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                    ) : (
                      <FontAwesomeIcon icon={faTimes} className="text-red-500" />
                    )}
                  </td>
                  <td className="py-2 px-2 flex justify-center space-x-2">
                    <button
                      onClick={() => handleEditClick(equipment)}
                      className="bg-blue-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleToggleDisponibilidad(equipment)}
                      className={`${
                        equipment.disponible
                          ? 'bg-red-600'
                          : 'bg-green-600'
                      } text-white px-3 py-1 rounded flex items-center space-x-1`}
                    >
                      {equipment.disponible ? 'Inhabilitar' : 'Habilitar'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(equipment)}
                      className="bg-red-600 text-white px-3 py-1 rounded flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Eliminar</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEquipments.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center">
                    No se encontraron equipos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
  );
};

export default PersonalEquipment;