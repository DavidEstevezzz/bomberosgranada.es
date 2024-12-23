import SortableFirefightersList from './SortableFirefightersList';
import AssignmentsApiService from '../services/AssignmentsApiService';

const FirefightersByOrder = () => (
  <SortableFirefightersList
    title="Bomberos Ordenados por Orden"
    fetchData={() => AssignmentsApiService.getAvailableFirefighters()}
    listType="firefighters by order"
    orderColumn="orden"
/>
);

export default AvailableFirefighters;
