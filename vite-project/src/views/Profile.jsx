import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UsuariosApiService from '../services/UsuariosApiService';
import SettingsApiService from '../services/SettingsApiService';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import EmployeeSalary from '../components/EmployeeSalary';
import EmployeeShiftChangeTable from '../components/EmployeeShiftChangeTable';
import dayjs from 'dayjs';

const Profile = () => {
  const { id_empleado } = useParams(); // Obtén el id del usuario desde la URL si existe
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useDarkMode();
  const [vacationDaysRemaining, setVacationDaysRemaining] = useState(null);
  const id_brigada_vacaciones = 10;

  // Estado para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchUserAndVacationDays = async () => {
      try {        
        const authenticatedUserResponse = await UsuariosApiService.getUserByToken();
        const authenticatedUser = authenticatedUserResponse.data;

        if (
          authenticatedUser.type !== 'jefe' &&
          authenticatedUser.type !== 'mando' &&
          parseInt(id_empleado) !== authenticatedUser.id_empleado
        ) {
          setError('No tienes permisos para ver este perfil');
          return;
        }

        let userResponse;
        if (id_empleado) {
          userResponse = await UsuariosApiService.getUsuario(id_empleado);
        } else {
          userResponse = authenticatedUserResponse; // Usa directamente el usuario autenticado
        }

        setUser(userResponse.data);

        const settingsResponse = await SettingsApiService.getSetting(2);
        const maxVacationDays = parseInt(settingsResponse.data.valor);
        const currentYear = new Date().getFullYear();
        const assignmentsResponse = await AssignmentsApiService.getAssignments();
        const userAssignments = assignmentsResponse.data.filter(
          (assignment) =>
            assignment.id_empleado === userResponse.data.id_empleado &&
            new Date(assignment.fecha_ini).getFullYear() === currentYear
        );

        const vacationAssignments = userAssignments
          .filter((assignment) => assignment.id_brigada_destino === id_brigada_vacaciones)
          .sort((a, b) => new Date(a.fecha_ini) - new Date(b.fecha_ini));

        let vacationDaysTaken = 0;

        for (let i = 0; i < vacationAssignments.length; i++) {
          const startDate = dayjs(vacationAssignments[i].fecha_ini);
          const nextAssignment = userAssignments.find(
            (assignment) =>
              dayjs(assignment.fecha_ini).isAfter(startDate) &&
              assignment.id_brigada_destino !== id_brigada_vacaciones
          );

          if (nextAssignment) {
            const endDate = dayjs(nextAssignment.fecha_ini);
            vacationDaysTaken += endDate.diff(startDate, 'day');
          } else {
            const endOfYear = dayjs(`${currentYear}-12-31`);
            vacationDaysTaken += endOfYear.diff(startDate, 'day') + 1;
          }
        }

        const remainingDays = maxVacationDays - vacationDaysTaken;
        setVacationDaysRemaining(remainingDays);

      } catch (error) {
        console.error('Error fetching user or vacation days data:', error);
        setError('Error loading user data or vacation days');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndVacationDays();
  }, [id_empleado]);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
        setPasswordError('Las contraseñas nuevas no coinciden');
        return;
    }

    try {
        await UsuariosApiService.updateUsuario(user.id_empleado, {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: confirmNewPassword, // Enviar al backend
        });

        setPasswordSuccess('Contraseña actualizada con éxito');
        setPasswordError('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    } catch (error) {
        console.error('Error updating password:', error);
        setPasswordError('Error al actualizar la contraseña');
    }
};


  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className={`min-h-screen max-w-screen p-4 ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
      <div className={`max-w-4xl mx-auto p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
        <h1 className="text-3xl font-bold mb-6 text-center">Perfil de {user.nombre} {user.apellido}</h1>
        
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Información Personal</h2>
          <div className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Teléfono:</strong> {user.telefono}</p>
            <p><strong>DNI:</strong> {user.dni}</p>
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Detalles del Rol</h2>
          <div className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p><strong>Puesto:</strong> {user.puesto}</p>
            <p><strong>Tipo:</strong> {user.type.charAt(0).toUpperCase() + user.type.slice(1)}</p>
          </div>
        </div>

        {/* Sección de días de vacaciones restantes */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Días de Vacaciones Restantes</h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {vacationDaysRemaining !== null ? (
              <span>Te quedan <strong>{vacationDaysRemaining}</strong> días de vacaciones para este año.</span>
            ) : (
              'No se pudo cargar la información de los días de vacaciones.'
            )}
          </p>

          <h2 className="text-xl font-semibold mb-4"> Días de Asuntos propios restantes</h2>
          <p className={`p-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <span>Te quedan <strong>{user.AP}</strong> días de asuntos propios para este año.</span>
          </p>
          <h2 className="text-xl font-semibold mb-4"> Horas de Salidas personales restantes</h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>

            <span>Te quedan <strong>{user.SP}</strong> horas de salidas personales para este año.</span>

          </p>
        </div>

        <EmployeeSalary user={user} />
        <EmployeeShiftChangeTable user={user} />
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Cambiar Contraseña</h2>
          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Contraseña Actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                required
              />
            </div>
            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Cambiar Contraseña
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
