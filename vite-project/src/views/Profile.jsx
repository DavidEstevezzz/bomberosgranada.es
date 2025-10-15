import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import UsuariosApiService from '../services/UsuariosApiService';
import SettingsApiService from '../services/SettingsApiService';
import AssignmentsApiService from '../services/AssignmentsApiService';
import { useDarkMode } from '../contexts/DarkModeContext';
import EmployeeSalary from '../components/EmployeeSalary';
import EmployeeShiftChangeTable from '../components/EmployeeShiftChangeTable';
import UserExtraHoursTable from '../components/UserExtraHoursTable';
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

  const pageWrapperClass = `min-h-[calc(100vh-6rem)] w-full px-4 py-10 transition-colors duration-300 ${
    darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
  }`;
  const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
  darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
}`;
  const sectionCardClass = `rounded-2xl border px-5 py-6 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/70'
  }`;
  const statCardClass = `rounded-2xl border px-4 py-5 transition-colors ${
    darkMode ? 'border-slate-800 bg-slate-950/60 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
  }`;
  const subtleTextClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const infoValueClass = darkMode
    ? 'text-base font-semibold text-slate-100'
    : 'text-base font-semibold text-slate-900';
  const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
    darkMode
      ? 'border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-500'
  }`;

  if (loading) {
    return (
      <div className={pageWrapperClass}>
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={pageWrapperClass}>
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-semibold text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={pageWrapperClass}>
        <div className={`${cardContainerClass} flex items-center justify-center py-16`}>
          <p className="text-sm font-medium">No se encontró información del usuario.</p>
        </div>
      </div>
    );
  }

  const personalInformation = [
    { label: 'Email', value: user.email || 'Sin especificar' },
    { label: 'Teléfono', value: user.telefono || 'Sin especificar' },
    { label: 'Nº Funcionario', value: user.dni || 'Sin especificar' },
    { label: 'Puesto', value: user.puesto || 'Sin especificar' },
  ];

  const permissionStats = [
  { label: 'Vacaciones', value: `${user.vacaciones ?? 0} días`, helper: user.mes_vacaciones ? `Mes: ${user.mes_vacaciones}` : null },
  { label: 'Asuntos Propios', value: `${user.AP ?? 0} jornadas` },
  { label: 'Salidas Personales', value: `${user.SP ?? 0} horas` },
  { label: 'Horas Sindicales', value: `${user.horas_sindicales ?? 0} horas` },
  { label: 'Módulos', value: `${user.modulo ?? 0} días` },
  { label: 'Compensación grupos', value: `${user.compensacion_grupos ?? 0} jornadas` },
];

  return (
      <div className={cardContainerClass}>
        <div
          className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
            darkMode
              ? 'from-primary-900/90 via-primary-700/90 to-primary-500/80'
              : 'from-primary-200 via-primary-300 to-primary-400'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            Perfil profesional
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {user.nombre} {user.apellido}
          </h1>
          
        </div>

        <div className="space-y-8 px-6 py-8 sm:px-10">
          <section className={sectionCardClass}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-200">
                  Información personal
                </p>
                <p className={`mt-1 text-xs ${subtleTextClass}`}>
                  Datos de contacto y puesto dentro del cuerpo.
                </p>
              </div>
              {user.type && (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                    darkMode
                      ? 'border-slate-700 bg-slate-900/70 text-slate-200'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  Rol: {user.type}
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {personalInformation.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border px-5 py-4 transition-colors ${
                    darkMode
                      ? 'border-slate-800 bg-slate-950/40 text-slate-200'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
                    {item.label}
                  </p>
                  <p className={`mt-2 ${infoValueClass}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={sectionCardClass}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-200">
              Permisos y disponibilidades
            </p>
            <p className={`mt-1 text-xs ${subtleTextClass}`}>
              Revisa los días y horas restantes disponibles para solicitudes de permisos.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {permissionStats.map((stat) => (
                <div key={stat.label} className={statCardClass}>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                  {stat.helper && (
                    <p className={`mt-1 text-xs ${subtleTextClass}`}>{stat.helper}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={sectionCardClass}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-200">
                  Calendario de guardias
                </p>
                <p className={`mt-1 text-xs ${subtleTextClass}`}>
                  Visualiza las guardias asignadas a este empleado.
                </p>
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-dashed border-primary-300/40 bg-white/40 p-2 dark:border-primary-700/40 dark:bg-slate-900/40">
              <UserGuardsCalendarPage user={user} />
            </div>
          </section>

          <section className="space-y-6">
            <EmployeeSalary user={user} />
            <EmployeeShiftChangeTable user={user} />
            <UserExtraHoursTable user={user} />
          </section>

          <section className={sectionCardClass}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-200">
              Seguridad de la cuenta
            </p>
            <p className={`mt-1 text-xs ${subtleTextClass}`}>
              Cambia la contraseña periódicamente para mantener la cuenta segura.
            </p>

            <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`${inputBaseClass} mt-2`}
                  required
                />
              </div>
              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputBaseClass} mt-2`}
                  required
                />
              </div>
              <div>
                <label className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-primary-500 dark:text-primary-200">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={`${inputBaseClass} mt-2`}
                  required
                />
              </div>
              {passwordError && (
                <p
                  className={`text-xs font-medium ${
                    darkMode ? 'text-red-300' : 'text-red-600'
                  }`}
                >
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p
                  className={`text-xs font-medium ${
                    darkMode ? 'text-emerald-300' : 'text-emerald-600'
                  }`}
                >
                  {passwordSuccess}
                </p>
              )}
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1 focus:ring-offset-transparent"
              >
                Cambiar contraseña
              </button>
            </form>
          </section>
        </div>
      </div>
  );
};

export default Profile;
