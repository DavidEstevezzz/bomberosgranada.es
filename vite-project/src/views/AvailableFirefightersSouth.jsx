import React from 'react';
import AssignmentsApiService from '../services/AssignmentsApiService';
import RequirementList from '../components/RequirementList';

const AvailableFirefighters2 = () => {
  const fetchAvailableFirefighters = (date) => {
    return AssignmentsApiService.getAvailableFirefightersWithoutMands(date); // Pasar la fecha al servicio
  };

  return (
    <RequirementList
      title="Lista de Requerimientos Parque Sur"
      fetchData={fetchAvailableFirefighters} // Función corregida para manejar fecha
      listType="firefighters by order"
      orderColumn="horas_ofrecidas"
      orderColumn2="fecha_req"
    />
  );
};

export default AvailableFirefighters2;
