import React from 'react';
import SortableFirefightersList from '../components/SortableFirefightersList';
import AssignmentsApiService from '../services/AssignmentsApiService';

const AvailableFirefighters = () => {
  const fetchAvailableFirefighters = (date) => {
    return AssignmentsApiService.getAvailableFirefighters(date); // Pasar la fecha a la API
  };

  return (
    <SortableFirefightersList
      title="Lista de Requerimientos 24h"
      fetchData={fetchAvailableFirefighters} // Pasar la función corregida
      listType="firefighters by order"
      orderColumn="orden"
    />
  );
};

export default AvailableFirefighters;
