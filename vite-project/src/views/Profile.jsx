import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UsuariosApiService from '../services/UsuariosApiService';
import SettingsApiService from '../services/SettingsApiService';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import EmployeeSalary from '../components/EmployeeSalary';
import EmployeeShiftChangeTable from '../components/EmployeeShiftChangeTable';
import UserExtraHoursTable from '../components/UserExtraHoursTable';
import dayjs from 'dayjs';
import UserGuardsCalendarPage from '../components/UserGuardsCalendarPage';

const Profile = () => {
  const { id_empleado } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useDarkMode();

  const [assignments, setAssignments] = useState([]);
  const [guards, setGuards] = useState([]); // Array para pintar en el calendario

  // Estado para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
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
          userResponse = authenticatedUserResponse;
        }
        const userData = userResponse.data;
        setUser(userData);

        // Cargar asignaciones
        const assignmentsResponse = await AssignmentsApiService.getAssignments();
        const allAssignments = assignmentsResponse.data;

        // Filtrar las del usuario
        const userAssignments = allAssignments.filter(
          (assignment) => assignment.id_empleado === userData.id_empleado
        );
        setAssignments(userAssignments);

        // Por ejemplo, consideramos "guardia" las brigadas 1,2,3,4,5
        const brigadasGuardia = [6, 2, 7, 4, 9, 21, 22, 23, 24, 25];
        const guardAssignments = userAssignments.filter((assign) =>
          brigadasGuardia.includes(assign.id_brigada_destino)
        );

        console.log('Profile - guardAssignments:', guardAssignments);

        // Construimos array de guards
        const guardsArray = guardAssignments.map((assign) => ({
          date: dayjs(assign.fecha_ini).format('YYYY-MM-DD'),
        }));

        console.log('Profile - guardsArray:', guardsArray);

        setGuards(guardsArray);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading user data or assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id_empleado]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (!user) return;

    try {
      await UsuariosApiService.updateUsuario(user.id_empleado, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmNewPassword,
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div
      className={`min-h-screen max-w-screen p-4 ${
        darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
      }`}
    >
      <div
        className={`max-w-4xl mx-auto p-6 rounded-lg shadow-md ${
          darkMode ? 'bg-gray-700' : 'bg-white'
        }`}
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          Perfil de {user?.nombre} {user?.apellido}
        </h1>
        

        {/* Información Personal */}
        <div className="grid grid-cols-1 mb-6 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 text-gray-200">
            <h2 className="text-xl font-semibold mb-2">Información Personal</h2>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Teléfono:</strong> {user.telefono}
            </p>
            <p>
              <strong>Nº Funcionario:</strong> {user.dni}
            </p>
            <p>
              <strong>Puesto:</strong> {user.puesto}
            </p>
          </div>

          {/* Permisos Restantes */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 text-white">
            <h2 className="text-xl font-semibold mb-2">Permisos Restantes</h2>
            <p>
              <strong>Vacaciones:</strong> {user.vacaciones} días (
              {user.mes_vacaciones})
            </p>
            <p>
              <strong>Asuntos Propios:</strong> {user.AP} jornadas
            </p>
            <p>
              <strong>Salidas Personales:</strong> {user.SP} horas
            </p>
            <p>
              <strong>Módulos:</strong> {user.modulo} días
            </p>
            <p>
              <strong>Compensación grupos:</strong> {user.compensacion_grupos}{' '}
              jornadas
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Calendario de Guardia</h2>
          <UserGuardsCalendarPage user={user} />
          </div>

        {/* Tablas extra */}
        <EmployeeSalary user={user} />
        <EmployeeShiftChangeTable user={user} />
        <UserExtraHoursTable user={user} />

        {/* Formulario para cambiar contraseña */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Cambiar Contraseña</h2>
          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                }`}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                }`}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'
                }`}
                required
              />
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-green-500 text-sm">{passwordSuccess}</p>
            )}
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
