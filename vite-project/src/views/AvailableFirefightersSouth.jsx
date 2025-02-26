import React from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import IncrementableFirefightersList from '../components/IncrementableFirefightersList';

const AvailableFirefighters2 = () => {
  const fetchAvailableFirefighters = (date) => {
    return AssignmentsApiService.getAvailableFirefightersWithoutMands(date); // Pasar la fecha al servicio
  };

  return (
    <IncrementableFirefightersList
      title="Lista de Requerimientos Parque Sur"
      fetchData={fetchAvailableFirefighters} // Función corregida para manejar fecha
      listType="firefighters by order"
      orderColumn="orden_sur"
    />
  );
};

export default AvailableFirefighters2;
