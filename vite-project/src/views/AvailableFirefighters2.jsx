import SortableFirefightersList from '../components/SortableFirefightersList';
import AssignmentsApiService from '../services/AssignmentsApiService';

const AvailableFirefighters2 = () => (
  <SortableFirefightersList
    title="Lista de Rquerimientos 10h"
    fetchData={() => AssignmentsApiService.getAvailableFirefighters()}
    listType="firefighters by order"
    orderColumn="orden10"
/>
);

export default AvailableFirefighters2;
