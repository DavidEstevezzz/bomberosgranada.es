import React from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import RequirementList from '../components/RequirementList';

const AvailableFirefighters = () => {
  const fetchAvailableFirefighters = (date) => {
    return AssignmentsApiService.getAvailableFirefighters(date); // Pasar la fecha a la API
  };

  return (
    <RequirementList
      title="Lista de Requerimientos 24h"
      fetchData={fetchAvailableFirefighters} 
      listType="firefighters by order"
      orderColumn="horas_ofrecidas"
      orderColumn2="fecha_req"
    />
  );
};  

export default AvailableFirefighters;
