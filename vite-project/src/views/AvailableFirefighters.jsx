import SortableFirefightersList from '../components/SortableFirefightersList';
import AssignmentsApiService from '../services/AssignmentsApiService';

const AvailableFirefighters = () => (
  <SortableFirefightersList
    title="Lista de Rquerimientos 24h"
    fetchData={() => AssignmentsApiService.getAvailableFirefighters()}
    listType="firefighters by order"
    orderColumn="orden"
/>
);

export default AvailableFirefighters;
