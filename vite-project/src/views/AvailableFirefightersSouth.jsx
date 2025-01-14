import SortableFirefightersList from '../components/SortableFirefightersList';
import AssignmentsApiService from '../services/AssignmentsApiService';

const AvailableFirefighters2 = () => (
  <SortableFirefightersList
    title="Lista de Requerimientos Parque Sur"
    fetchData={() => AssignmentsApiService.getAvailableFirefighters()}
    listType="firefighters by order"
    orderColumn="orden_sur"
/>
);

export default AvailableFirefighters2;
