import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Login from "./views/Login.jsx";
import NotFound from "./views/NotFound";
import Users from "./views/Users";
import Dashboard from "./views/Dashboard";
import DefaultLayout from "./layout/DefaultLayout";
import GuestLayout from "./layout/GuestLayout";
import Brigades from "./views/Brigades";
import FirefighterAssigment from './views/FirefighterAssignment.jsx';
import BrigadeDetail from './components/BrigadeDetail.jsx';
import Salaries from './views/Salaries.jsx';
import Settings from './views/Settings.jsx';
import CalendarPage from './views/CalendarPage.jsx';
import Profile from './views/Profile.jsx';
import AvailableFirefighters from './views/AvailableFirefighters.jsx';
import ExtraHoursTable from './views/ExtraHoursTable.jsx';
import TotalExtraHours from './views/TotalExtraHours.jsx';
import CalendarPage2 from './views/CalendarPage2.jsx';
import ShiftChangeRequestPage from './views/ShiftChangeRequestPage.jsx';
import ShiftChangeRequestsTable from './views/ShiftChangeRequestsTable.jsx';
import CreateRequestPage from './views/CreateRequestPage.jsx';
import RequestListPage from './views/RequestListPage.jsx';
import ActiveFirefighters from './views/ActiveFirefighters.jsx';
import ShiftChangeApprovalPage from './views/ShiftChangeApproval.jsx';
import AvailableFirefighters2 from './views/AvailableFirefighters2.jsx';
import ProtectedRoute from "./components/ProtectedRoute"; 
import ForgotPassword from './views/ForgotPassword.jsx';
import ResetPassword from './views/ResetPassword.jsx';
import RequestAndShiftChangePage from './views/RequestAndShiftChangePage.jsx';
import MessagesPage from './views/MessagesPage.jsx';
import AvailableFirefightersSouth from './views/AvailableFirefightersSouth.jsx';
import AvailableOperatorsMorning from './views/AvailableOperatorsMorning.jsx';
import AvailableOperatorsNight from './views/AvailableOperatorsNight.jsx';
import Vehicles from './views/Vehicles.jsx'; 
import Incidents from './views/IncidentListPage.jsx';
import SuggestionListPage from './views/SuggestionListPage.jsx';
import Transfers from './views/TransferList.jsx';
import HorasOfrecidas from './views/HoursCountTable.jsx';
import RubishList from './views/RubishList.jsx';
import PersonalEquipment from './views/PersonalEquipment.jsx';
import PdfViewerPage from './views/PdfViewerPage.jsx';
import CalendarEspecialPage from './views/CalendarEspecialPage.jsx';
import MandoEspecialRoute from './components/MandoEspecialRoute.jsx';
import GuardDetailCalendarPage from './views/GuardDetailCalendarPage.jsx';
import GuardDetailPage from './views/GuardDetailPage.jsx';
import BrigadePracticesPage from './views/BrigadePracticesPage.jsx';
import ClothingItems from './views/ClothingItems.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'users', element: <ProtectedRoute element={<Users />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: '/users/:id_empleado', element: <Profile /> },
      { path: 'brigades', element: <ProtectedRoute element={<Brigades />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'firefighter-assignments', element: <ProtectedRoute element={<FirefighterAssigment />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'salaries', element: <ProtectedRoute element={<Salaries />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'settings', element: <ProtectedRoute element={<Settings />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: '/horas-extra', element: <ProtectedRoute element={<ExtraHoursTable />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'total-horas-extra', element: <ProtectedRoute element={<TotalExtraHours />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'solicitudes-guardia', element: <ProtectedRoute element={<ShiftChangeRequestsTable />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'solicitudes', element: <ProtectedRoute element={<RequestListPage />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'guardia-activa', element: <ProtectedRoute element={<ActiveFirefighters />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'aprobacion-cambio-guardia', element: <ProtectedRoute element={<ShiftChangeApprovalPage />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'vehicles', element: <ProtectedRoute element={<Vehicles />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'incidents', element: <ProtectedRoute element={<Incidents />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'transfers', element: <ProtectedRoute element={<Transfers />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: 'personal-equipment', element: <ProtectedRoute element={<PersonalEquipment />} rolesAllowed={['Jefe', 'Mando']} /> },
      { path: '/pdf', element: <ProtectedRoute element={<PdfViewerPage  />} rolesAllowed={['Jefe', 'Mando']} /> },
      
      // Nueva ruta para el calendario especial (solo para usuarios con mando_especial=true)
      { path: 'calendario-especial', element: <MandoEspecialRoute element={<CalendarEspecialPage />} /> },
{ path: 'detalle-guardia-calendario', element: <MandoEspecialRoute element={<GuardDetailCalendarPage />} /> },
{ path: 'guard-detail/:brigadeId/:date', element: <MandoEspecialRoute element={<GuardDetailPage />} /> },

      // Rutas existentes
      { path: 'horas-requerimientos', element: <HorasOfrecidas /> },
      { path: '/brigades/:id_brigada', element: <BrigadeDetail /> },
      { path: '/messages', element: <MessagesPage /> },
      { path: 'brigade-practices', element: <BrigadePracticesPage /> },
      { path: 'calendario-norte', element: <CalendarPage /> },
      { path: 'calendario-sur', element: <CalendarPage2 /> },
      { path: 'requerimientos', element: <AvailableFirefighters /> },
      { path: 'requerimientos-10-horas', element: <AvailableFirefighters2 /> },
      { path: 'requerimientos-operadores-mañana', element: <AvailableOperatorsMorning /> },
      { path: 'requerimientos-operadores-noche', element: <AvailableOperatorsNight /> },
      { path: 'cambio-guardia', element: <ShiftChangeRequestPage /> },
      { path: 'solicitud', element: <CreateRequestPage /> },
      { path: 'lista-solicitudes', element: <RequestAndShiftChangePage /> },
      { path: 'sugerencias', element: <SuggestionListPage /> },
      { path: 'clothing-items', element: <ClothingItems /> },
    ],
  },
  {
    path: '/login',
    element: <GuestLayout />,
    children: [
      { path: '', element: <Login /> },
    ],
  },
  // Rutas para restablecimiento de contraseña.
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password/:token', element: <ResetPassword /> },
  { path: '*', element: <NotFound /> },
]);

export default router;