import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrigadesApiService from '../services/BrigadesApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDownload, faEdit, faTrash, faEllipsisH, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import EditBrigadeModal from '../components/EditBrigadeModal';
import AddBrigadeModal from '../components/AddBrigadeModal';

const Brigades = () => {
  const [brigades, setBrigades] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBrigade, setSelectedBrigade] = useState(null);

  const navigate = useNavigate();

  const fetchBrigadesAndParks = async () => {
    setLoading(true);
    try {
      const [brigadesResponse, parksResponse] = await Promise.all([
        BrigadesApiService.getBrigades(),
        BrigadesApiService.getParks()
      ]);
      if (brigadesResponse.data && parksResponse.data) {
        setBrigades(brigadesResponse.data);
        setParks(parksResponse.data);
        setError(null);
      } else {
        throw new Error('No brigade or park data returned from the API');
      }
    } catch (error) {
      console.error('Failed to fetch brigades and parks:', error);
      setError('Failed to load brigades and parks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrigadesAndParks(); // Fetch brigades and parks data on mount
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditClick = (brigade) => {
    setSelectedBrigade(brigade);
    setIsEditModalOpen(true);
  };

  const handleAddBrigadeClick = () => {
    setIsAddModalOpen(true);
  };

  const handleUpdateBrigade = async (updatedBrigade) => {
    try {
      const response = await BrigadesApiService.updateBrigade(updatedBrigade.id_brigada, updatedBrigade);
      setBrigades(brigades.map(brigade => brigade.id_brigada === updatedBrigade.id_brigada ? response.data : brigade));
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update brigade:', error);
      if (error.response && error.response.data) {
        alert("Error: " + Object.values(error.response.data).join("\n"));
      }
    }
  };

  const handleAddBrigade = async () => {
    try {
      fetchBrigadesAndParks();
      setIsAddModalOpen(false);
      console.log('Add Brigade Modal Closed');
    } catch (error) {
      console.error('Failed to add brigade in handleAddBrigade:', error);
    }
  };

  const handleDeleteBrigade = async (id_brigada) => {
    if (window.confirm("Are you sure you want to delete this brigade?")) {
      try {
        await BrigadesApiService.deleteBrigade(id_brigada);
        setBrigades(brigades.filter(brigade => brigade.id_brigada !== id_brigada));
      } catch (error) {
        console.error('Failed to delete brigade:', error);
        alert('Failed to delete brigade');
      }
    }
  };

  const handleDetailClick = (brigade) => {
    navigate(`/brigades/${brigade.id_brigada}`);
  };

  useEffect(() => {
  }, [isAddModalOpen]);

  const getParkNameById = (id_parque) => {
    const park = parks.find(p => p.id_parque === id_parque);
    return park ? park.nombre : 'Unknown';
  };

  const filteredBrigades = brigades.filter((brigade) =>
    (brigade.nombre && brigade.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white mb-4 md:mb-0">Brigadas</h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
          <button onClick={handleAddBrigadeClick} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
            <FontAwesomeIcon icon={faPlus} />
            <span>Añadir Brigada</span>
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded flex items-center space-x-2">
            <FontAwesomeIcon icon={faDownload} />
            <span>Exportar</span>
          </button>
        </div>
      </div>
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-700 pb-2 mb-4 space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="text"
            placeholder="Buscar brigadas"
            value={searchTerm}
            onChange={handleSearchChange}
            className="bg-gray-700 text-gray-300 px-4 py-2 rounded w-full md:w-3/4 flex-grow md:flex-grow-0"
          />
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faEllipsisH} className="text-gray-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Nombre</th>
                <th className="py-2 px-2">Parque</th>
                <th className="py-2 px-2" style={{ width: '200px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredBrigades.map((brigade) => (
                <tr key={brigade.id_brigada} className="border-b border-gray-700">
                  <td className="py-2 px-2">{brigade.nombre}</td>
                  <td className="py-2 px-2">{getParkNameById(brigade.id_parque)}</td>
                  <td className="py-2 px-2 flex space-x-2">
                    <button onClick={() => handleEditClick(brigade)} className="bg-blue-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Editar</span>
                    </button>
                    <button onClick={() => handleDeleteBrigade(brigade.id_brigada)} className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Borrar</span>
                    </button>
                    <button onClick={() => handleDetailClick(brigade)} className="bg-gray-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      <span>Detalle</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedBrigade && (
        <EditBrigadeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          brigade={selectedBrigade}
          onUpdate={handleUpdateBrigade}
        />
      )}
      <AddBrigadeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          console.log('Closing Add Brigade Modal');
          setIsAddModalOpen(false);
        }}
        onAdd={handleAddBrigade}
      />
    </div>
  );
};

export default Brigades;
