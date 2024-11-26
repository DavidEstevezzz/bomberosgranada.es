import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UsuariosApiService from '../services/UsuariosApiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faDownload, faEdit, faTrash, faEllipsisH, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import EditUserModal from '../components/editUserModal';
import AddUserModal from '../components/addUserModal';
import { useDarkMode } from '../contexts/DarkModeContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { darkMode } = useDarkMode();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await UsuariosApiService.getUsuarios();
        if (response.data) {
          setUsers(response.data);
          setError(null);
        } else {
          throw new Error('No user data returned from the API');
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleAddUserClick = () => {
    setIsAddModalOpen(true);
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      const response = await UsuariosApiService.updateUsuario(updatedUser.id_empleado, updatedUser);
      setUsers(users.map(user => user.id_empleado === updatedUser.id_empleado ? response.data : user));
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update user:', error);
      if (error.response && error.response.data) {
        alert("Error: " + Object.values(error.response.data).join("\n"));
      }
    }
  };

  const handleAddUser = async (newUser) => {
    try {
      fetchUsers(); // Refresh data after adding
      setIsAddModalOpen(false);
    } catch (error) {
      if (error.response && error.response.data) {
        alert("Error: " + Object.values(error.response.data).join("\n"));
      }
    }
  };

  const handleDetailClick = (user) => {
    navigate(`/users/${user.id_empleado}`);
  };

  const filteredUsers = users.filter((user) =>
    (user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telefono.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (roleFilter === '' || user.role_name === roleFilter)
  );

  const uniqueRoles = [...new Set(users.map(user => user.role_name))];

  if (loading) return <div>Cargando usuarios...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className={`p-8 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-gray-300'}`}>
      <div className="flex flex-col md:flex-row items-center justify-between mb-4">
      <h1 className={`text-2xl font-bold mb-4 md:mb-0 ${darkMode ? 'text-white' : 'text-gray-700'}`}>Usuarios</h1>
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
          <button onClick={handleAddUserClick} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
            <FontAwesomeIcon icon={faPlus} />
            <span>Añadir usuario</span>
          </button>
        </div>
      </div>
      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-200 text-black'}`}>
  <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-600 pb-2 mb-4 space-y-4 md:space-y-0 md:space-x-4">
    <input
      type="text"
      placeholder="Buscar usuarios"
      value={searchTerm}
      onChange={handleSearchChange}
      className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'} px-4 py-2 rounded w-full md:w-3/4`}
    />
    <select
      value={roleFilter}
      onChange={handleRoleFilterChange}
      className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'} px-4 py-2 rounded w-full md:w-1/4`}
    >
      <option value="">Todos los roles</option>
      {uniqueRoles.map((role) => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
    <div className="flex items-center space-x-2">
      <FontAwesomeIcon icon={faEllipsisH} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    </div>
  </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-2">Nombre</th>
                <th className="py-2 px-2">Rol</th>
                <th className="py-2 px-2">Teléfono</th>
                <th className="py-2 px-2">Puesto</th>
                <th className="py-2 px-2" style={{ width: '200px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id_empleado} className="border-b border-gray-700">
                  <td className="py-2 px-2 flex items-center space-x-2">
                    <img src="https://via.placeholder.com/40" alt="Avatar" className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col">
                      <span className="font-bold">{user.nombre}</span>
                      <span className="text-gray-500 text-sm">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">{user.role_name}</td>
                  <td className="py-2 px-2">{user.telefono}</td>
                  <td className="py-2 px-2">{user.puesto}</td>
                  <td className="py-2 px-2 flex space-x-2">
                    <button onClick={() => handleEditClick(user)} className="bg-blue-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Editar</span>
                    </button>
                    <button className="bg-red-600 text-white px-4 py-1 rounded flex items-center space-x-1">
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Borrar</span>
                    </button>
                    <button onClick={() => handleDetailClick(user)} className="bg-gray-600 text-white px-4 py-1 rounded flex items-center space-x-1">
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
      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onUpdate={handleUpdateUser}
        />
      )}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUser}
      />
    </div>
  );
};

export default Users;
