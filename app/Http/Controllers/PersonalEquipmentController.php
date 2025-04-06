<?php

namespace App\Http\Controllers;

use App\Models\PersonalEquipment;
use App\Models\EquipmentAssignment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PersonalEquipmentController extends Controller
{
    // Definir las reservas fijas de números por asignación
    private $reservedNumbers = [
        // Subinspector/Oficial Norte (N)
        'N1' => ['Portátil' => 1, 'PTT' => 1, 'Micro' => 1, 'Linterna casco' => 1, 'Linterna pecho' => 1],
        'N2' => ['Portátil' => 3, 'PTT' => 3, 'Micro' => 3, 'Linterna casco' => 3, 'Linterna pecho' => 3],
        'N3' => ['Portátil' => 5, 'PTT' => 5, 'Micro' => 5, 'Linterna casco' => 5, 'Linterna pecho' => 5],

        // Subinspector/Oficial Sur (S)
        'S1' => ['Portátil' => 2, 'PTT' => 2, 'Micro' => 2, 'Linterna casco' => 2, 'Linterna pecho' => 2],
        'S2' => ['Portátil' => 4, 'PTT' => 4, 'Micro' => 4, 'Linterna casco' => 4, 'Linterna pecho' => 4],
        'S3' => ['Portátil' => 6, 'PTT' => 6, 'Micro' => 6, 'Linterna casco' => 6, 'Linterna pecho' => 6],

        // Conductores Norte (C)
        'C1' => ['Portátil' => 7, 'Micro' => 7, 'Linterna casco' => 7, 'Linterna pecho' => 7],
        'C2' => ['Portátil' => 9, 'Micro' => 9, 'Linterna casco' => 9, 'Linterna pecho' => 9],
        'C3' => ['Portátil' => 11, 'Micro' => 11, 'Linterna casco' => 11, 'Linterna pecho' => 11],
        'C4' => ['Portátil' => 13, 'Micro' => 13, 'Linterna casco' => 13, 'Linterna pecho' => 13],
        'C5' => ['Portátil' => 15, 'Micro' => 15, 'Linterna casco' => 15, 'Linterna pecho' => 15],

        // Conductores Sur (C)
        'C1S' => ['Portátil' => 8, 'Micro' => 8, 'Linterna casco' => 8, 'Linterna pecho' => 8],
        'C2S' => ['Portátil' => 10, 'Micro' => 10, 'Linterna casco' => 10, 'Linterna pecho' => 10],
        'C3S' => ['Portátil' => 12, 'Micro' => 12, 'Linterna casco' => 12, 'Linterna pecho' => 12],
        'C4S' => ['Portátil' => 14, 'Micro' => 14, 'Linterna casco' => 14, 'Linterna pecho' => 14],
        'C5S' => ['Portátil' => 16, 'Micro' => 16, 'Linterna casco' => 16, 'Linterna pecho' => 16],

        // Bomberos Norte (B)
        'B1' => ['Portátil' => 15, 'PTT' => 15, 'Linterna casco' => 15, 'Linterna pecho' => 15],
        'B2' => ['Portátil' => 17, 'PTT' => 17, 'Linterna casco' => 17, 'Linterna pecho' => 17],
        'B3' => ['Portátil' => 19, 'PTT' => 19, 'Linterna casco' => 19, 'Linterna pecho' => 19],
        'B4' => ['Portátil' => 21, 'PTT' => 21, 'Linterna casco' => 21, 'Linterna pecho' => 21],
        'B5' => ['Portátil' => 23, 'PTT' => 23, 'Linterna casco' => 23, 'Linterna pecho' => 23],
        'B6' => ['Portátil' => 25, 'PTT' => 25, 'Linterna casco' => 25, 'Linterna pecho' => 25],
        'B7' => ['Portátil' => 27, 'PTT' => 27, 'Linterna casco' => 27, 'Linterna pecho' => 27],
        'B8' => ['Portátil' => 29, 'PTT' => 29, 'Linterna casco' => 29, 'Linterna pecho' => 29],
        'B9' => ['Portátil' => 31, 'PTT' => 31, 'Linterna casco' => 31, 'Linterna pecho' => 31],

        // Bomberos Sur (B)
        'B1S' => ['Portátil' => 16, 'PTT' => 16, 'Linterna casco' => 16, 'Linterna pecho' => 16],
        'B2S' => ['Portátil' => 18, 'PTT' => 18, 'Linterna casco' => 18, 'Linterna pecho' => 18],
        'B3S' => ['Portátil' => 20, 'PTT' => 20, 'Linterna casco' => 20, 'Linterna pecho' => 20],
        'B4S' => ['Portátil' => 22, 'PTT' => 22, 'Linterna casco' => 22, 'Linterna pecho' => 22],
        'B5S' => ['Portátil' => 24, 'PTT' => 24, 'Linterna casco' => 24, 'Linterna pecho' => 24],
        'B6S' => ['Portátil' => 26, 'PTT' => 26, 'Linterna casco' => 26, 'Linterna pecho' => 26],
        'B7S' => ['Portátil' => 28, 'PTT' => 28, 'Linterna casco' => 28, 'Linterna pecho' => 28],
        'B8S' => ['Portátil' => 30, 'PTT' => 30, 'Linterna casco' => 30, 'Linterna pecho' => 30],
        'B9S' => ['Portátil' => 32, 'PTT' => 32, 'Linterna casco' => 32, 'Linterna pecho' => 32],

        // Jefe de Guardia
        'Jefe de Guardia' => ['Portátil' => 1, 'PTT' => 1, 'Micro' => 1, 'Linterna casco' => 1, 'Linterna pecho' => 1],
    ];

    /**
     * Mostrar listado de equipos personales
     */
    public function index()
    {
        $equipos = PersonalEquipment::all();
        return response()->json($equipos);
    }

    /**
     * Almacenar un nuevo equipo
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => ['required', Rule::in(PersonalEquipment::getCategorias())],
            'disponible' => 'boolean'
        ]);

        $equipo = PersonalEquipment::create($request->all());

        return response()->json($equipo, 201);
    }

    /**
     * Mostrar un equipo específico
     */
    public function show(PersonalEquipment $equipo)
    {
        return response()->json($equipo);
    }

    /**
     * Actualizar un equipo específico
     */
    public function update(Request $request, PersonalEquipment $equipo)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => ['required', Rule::in(PersonalEquipment::getCategorias())],
            'disponible' => 'boolean'
        ]);

        $equipo->update($request->all());

        return response()->json($equipo);
    }

    /**
     * Eliminar un equipo específico
     */
    public function destroy(PersonalEquipment $equipo)
    {
        $equipo->delete();

        return response()->json(null, 204);
    }

    /**
     * Obtener todas las categorías disponibles
     */
    public function getCategories()
    {
        return response()->json(PersonalEquipment::getCategorias());
    }

    public function toggleDisponibilidad(PersonalEquipment $equipo)
    {
        $equipo->disponible = !$equipo->disponible;
        $equipo->save();

        return response()->json($equipo);
    }

    public function getByPark($parkId)
    {
        $equipos = PersonalEquipment::where('parque', $parkId)->get();
        return response()->json($equipos);
    }

    /**
     * Resetear todas las asignaciones para un parque en una fecha específica
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetEquipmentAssignments(Request $request)
    {
        $request->validate([
            'parkId' => 'required|integer|in:1,2',
            'date' => 'nullable|date'
        ]);

        $parkId = $request->parkId;
        $date = $request->date ?? now()->toDateString();

        $count = $this->markAllAssignmentsAsInactive($parkId, $date);

        Log::info("Reseteo de asignaciones para parque $parkId en fecha $date: $count asignaciones limpiadas");

        return response()->json([
            'success' => true,
            'message' => "Se han reseteado $count asignaciones de equipos",
            'park_id' => $parkId,
            'date' => $date
        ]);
    }

    /**
     * Marcar todas las asignaciones como inactivas para una fecha y parque específicos
     * 
     * @param int $parque ID del parque
     * @param string $fecha Fecha de las asignaciones (formato Y-m-d)
     * @return int Número de registros afectados
     */
    private function markAllAssignmentsAsInactive($parque, $fecha)
    {
        return EquipmentAssignment::where('parque', $parque)
            ->where('fecha', $fecha)
            ->update(['activo' => false]);
    }

    /**
     * Marcar un equipo como asignado
     * 
     * @param string $categoria Categoría del equipo
     * @param int $numero Número del equipo
     * @param int $parque ID del parque
     * @param string $asignacion A quién está asignado
     * @param string|null $fecha Fecha de la asignación (por defecto hoy)
     * @return EquipmentAssignment
     */
    private function markEquipmentAsAssigned($categoria, $numero, $parque, $asignacion, $fecha = null)
    {
        $fecha = $fecha ?? now()->toDateString();

        return EquipmentAssignment::updateOrCreate(
            ['categoria' => $categoria, 'numero' => $numero, 'parque' => $parque, 'fecha' => $fecha],
            ['asignacion' => $asignacion, 'activo' => true]
        );
    }

    /**
     * Verificar si un equipo ya está asignado
     * 
     * @param string $categoria Categoría del equipo
     * @param int $numero Número del equipo
     * @param int $parque ID del parque
     * @param string|null $fecha Fecha para verificar (por defecto hoy)
     * @return bool
     */
    private function isEquipmentAlreadyAssigned($categoria, $numero, $parque, $fecha = null)
    {
        $fecha = $fecha ?? now()->toDateString();

        return EquipmentAssignment::where('categoria', $categoria)
            ->where('numero', $numero)
            ->where('parque', $parque)
            ->where('fecha', $fecha)
            ->where('activo', true)
            ->exists();
    }

    /**
     * Obtener el número reservado para una asignación y categoría específicas
     * Ajusta automáticamente según el parque (par/impar)
     */
    private function getReservedNumber($assignment, $categoria, $parkId)
{
    // Verificar si estamos en el parque Sur (parkId = 2)
    $esPar = ($parkId == 2);
    
    // Obtener la primera letra y el número de la asignación
    $firstLetter = substr($assignment, 0, 1);
    $number = substr($assignment, 1);
    
    // Clave específica para Sur (ejemplo: B1S)
    $suAssignment = $firstLetter . $number . 'S';
    
    // Verificar si existe una entrada específica para Sur
    if ($esPar && isset($this->reservedNumbers[$suAssignment]) && isset($this->reservedNumbers[$suAssignment][$categoria])) {
        return $this->reservedNumbers[$suAssignment][$categoria];
    }
    
    // Verificar si hay una entrada en la tabla para la asignación original
    if (isset($this->reservedNumbers[$assignment]) && isset($this->reservedNumbers[$assignment][$categoria])) {
        $numero = $this->reservedNumbers[$assignment][$categoria];
        
        // Si es B o C en parque Sur, convertir a par si es impar
        if ($esPar && ($firstLetter == 'B' || $firstLetter == 'C') && $numero % 2 == 1) {
            $numero += 1;
        }
        
        return $numero;
    }
    
    // Si no hay un número explícitamente definido, calcularlo según las reglas generales
    return $this->getInitialEquipmentNumber($firstLetter, $number, $parkId);
}
    /**
     * Verificar disponibilidad y asignar equipos individualmente para un puesto específico
     * 
     * @param Request $request Contiene los parámetros: 
     *                         - parkId (1: Norte, 2: Sur)
     *                         - assignment (ej: B1, C3, N2, etc)
     *                         - maxAssignment (ej: B7 si es el último bombero asignado)
     *                         - date (opcional, fecha para la asignación, formato: YYYY-MM-DD)
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkAndAssignEquipment(Request $request)
    {
        $request->validate([
            'parkId' => 'required|integer|in:1,2',
            'assignment' => 'required|string',
            'maxAssignment' => 'required|string',
            'date' => 'nullable|date' // Fecha opcional
        ]);

        
        $parkId = $request->parkId;
        $assignment = strtoupper($request->assignment);
        $maxAssignment = strtoupper($request->maxAssignment);
        $date = $request->date ?? now()->toDateString();

        $currentAssignments = \App\Models\GuardAssignment::getAssignmentsByDateAndParque($date, $parkId)->toArray();
        Log::info("Asignaciones obtenidaaaaaaas: " . json_encode($currentAssignments));


        // Agregar logs para depuración
        Log::info("Procesando asignación: $assignment, maxAssignment: $maxAssignment, parque: $parkId, fecha: $date");

        // Determinar el rol basado en la primera letra de la asignación
        $role = substr($assignment, 0, 1);

        // Si es operador, devolver respuesta vacía porque no necesitan equipos
        if ($role == 'O' || strpos($assignment, 'OPERADOR') !== false) {
            Log::info("Asignación de Operador detectada, no se asignan equipos");
            return response()->json([
                'assignment' => $assignment,
                'initial_number' => 0,
                'equipment_assigned' => [],
                'equipment_details' => [],
                'unavailable_equipment' => [],
                'nonexistent_equipment' => []
            ]);
        }

        // Determinar las categorías a verificar según el rol
        $categoriasAVerificar = $this->getCategoriasForRole($role);
        Log::info("Rol: $role, Categorías a verificar: " . implode(", ", $categoriasAVerificar));

        // Asignar equipos individualmente
        $equipoAsignado = [];
        $equiposNoDisponibles = [];
        $equiposNoExistentes = [];

        // Mantener un conjunto de números ya asignados para esta fecha y parque
        $numerosYaAsignados = $this->getAssignedNumbersByDate($parkId, $date);
        Log::info("Números ya asignados para esta fecha: " . implode(", ", $numerosYaAsignados));

        foreach ($categoriasAVerificar as $categoria) {
            Log::info("Verificando categoría: $categoria para asignación $assignment");

            // Obtener el número reservado para esta asignación y categoría
            $numeroReservado = $this->getReservedNumber($assignment, $categoria, $parkId);
            Log::info("Número reservado para $assignment - $categoria: $numeroReservado");

            // PASO 1: Intentar asignar primero el número reservado según la tabla
            $asignacionCompletada = false;

            // Comprobar si el equipo con el número reservado existe
            $equipoExiste = $this->checkEquipmentExists($categoria, $numeroReservado);

            if ($equipoExiste) {
                // Verificar si el número ya ha sido asignado para esta categoría en esta fecha
                $yaAsignado = $this->isEquipmentAlreadyAssigned($categoria, $numeroReservado, $parkId, $date);

                if (!$yaAsignado) {
                    // Comprobar si el equipo está disponible en general
                    $disponible = $this->isEquipmentAvailable($categoria, $numeroReservado);

                    if ($disponible) {
                        $equipoAsignado[$categoria] = $numeroReservado;

                        // Marcar este equipo como asignado en la base de datos
                        $this->markEquipmentAsAssigned(
                            $categoria,
                            $numeroReservado,
                            $parkId,
                            $assignment,
                            $date
                        );

                        // Añadir al conjunto de números asignados
                        $numerosYaAsignados[] = $numeroReservado;

                        Log::info("Asignado número reservado para $categoria: $numeroReservado - COINCIDE CON REGLA");
                        $asignacionCompletada = true;
                    } else {
                        Log::info("Equipo $categoria $numeroReservado existe pero no está disponible");
                        $equiposNoDisponibles[] = "$categoria $numeroReservado";
                    }
                } else {
                    Log::info("Equipo $categoria $numeroReservado ya asignado a otro en esta fecha");
                    $equiposNoDisponibles[] = "$categoria $numeroReservado (ya asignado)";
                }
            } else {
                Log::info("Equipo $categoria $numeroReservado no existe en el sistema");
                $equiposNoExistentes[] = "$categoria $numeroReservado";
            }

            // PASO 2: Si no se pudo asignar el número reservado, buscar alternativas
            if (!$asignacionCompletada) {
                Log::info("Buscando alternativa para $categoria, ya que el número reservado $numeroReservado no está disponible");

                // Obtener un rango para buscar alternativas
                $rangoBusqueda = $this->calcularRangoBusqueda($role, $parkId);

                // Buscar el número más cercano disponible
                $numeroAlternativo = $this->findAvailableInRange(
                    $categoria,
                    $numeroReservado,
                    $rangoBusqueda['min'],
                    $rangoBusqueda['max'],
                    $parkId,
                    $date,
                    $numerosYaAsignados,
                    $assignment,
                    $currentAssignments // Agregar este parámetro
                );

                if ($numeroAlternativo !== null) {
                    $equipoAsignado[$categoria] = $numeroAlternativo;

                    // Marcar este equipo como asignado en la base de datos
                    $this->markEquipmentAsAssigned(
                        $categoria,
                        $numeroAlternativo,
                        $parkId,
                        $assignment,
                        $date
                    );

                    // Añadir al conjunto de números asignados
                    $numerosYaAsignados[] = $numeroAlternativo;

                    Log::info("Asignado número alternativo para $categoria: $numeroAlternativo");
                } else {
                    Log::warning("No se encontró alternativa para $categoria");

                    // Intentar cualquier número como último recurso
                    $numeroFueraDeRango = $this->findAnyAvailableNumber(
                        $categoria,
                        $parkId,
                        $date,
                        $numerosYaAsignados
                    );

                    if ($numeroFueraDeRango !== null) {
                        $equipoAsignado[$categoria] = $numeroFueraDeRango;

                        $this->markEquipmentAsAssigned(
                            $categoria,
                            $numeroFueraDeRango,
                            $parkId,
                            $assignment,
                            $date
                        );

                        $numerosYaAsignados[] = $numeroFueraDeRango;

                        Log::info("Asignado número (último recurso) para $categoria: $numeroFueraDeRango");
                    } else {
                        Log::warning("No se encontró NINGÚN número disponible para $categoria");
                    }
                }
            }
        }

        // Generar nombres completos de equipos para facilitar la visualización
        $equiposCompletos = [];
        foreach ($equipoAsignado as $categoria => $numero) {
            // Determinar el nombre completo según la categoría
            $nombreCompleto = ($categoria === 'Micro') ? "Micro $numero" : "$categoria $numero";

            $equiposCompletos[] = [
                'categoria' => $categoria,
                'numero' => $numero,
                'nombre_completo' => $nombreCompleto
            ];
        }

        $response = [
            'assignment' => $assignment,
            'initial_number' => isset($numeroReservado) ? $numeroReservado : 0,
            'equipment_assigned' => $equipoAsignado,
            'equipment_details' => $equiposCompletos,
            'unavailable_equipment' => $equiposNoDisponibles,
            'nonexistent_equipment' => $equiposNoExistentes
        ];

        Log::info("Respuesta final para $assignment: " . json_encode($response));

        return response()->json($response);
    }

    private function getReservedNumbersForCategory($categoria, $parque, array $currentAssignments)
{
    $reservados = [];
    $esPar = ($parque == 2);
    
    foreach ($this->reservedNumbers as $asignacion => $equipos) {
        // Solo considerar la asignación si está en las asignaciones reales del día
        if (!in_array($asignacion, $currentAssignments)) {
            continue;
        }
        
        // Si estamos en Sur y la asignación no termina en 'S' (o viceversa), saltar según la lógica actual
        if (
            ($esPar && strpos($asignacion, 'S') === false && in_array(substr($asignacion, 0, 1), ['B', 'C'])) ||
            (!$esPar && strpos($asignacion, 'S') !== false)
        ) {
            continue;
        }
        
        if (isset($equipos[$categoria])) {
            $numero = $equipos[$categoria];
            // Ajustar números para parque Sur si es necesario
            if ($esPar && in_array(substr($asignacion, 0, 1), ['B', 'C']) && $numero % 2 == 1) {
                $numero += 1;
            }
            
            // Extraer la asignación base (sin la 'S' final, si corresponde)
            $baseAssignment = preg_replace('/S$/', '', $asignacion);
            $reservados[$baseAssignment] = $numero;
        }
    }
    
    return $reservados;
}


    /**
     * Calcular el rango de búsqueda para números alternativos según el rol y parque
     */
    private function calcularRangoBusqueda($role, $parque)
    {
        $min = 1;
        $max = 100;

        // Ajustar rangos según el tipo de rol
        switch ($role) {
            case 'B': // Bomberos
                if ($parque == 1) { // Norte (impares)
                    $min = 15;
                    $max = 39;
                } else { // Sur (pares)
                    $min = 16;
                    $max = 40;
                }
                break;

            case 'C': // Conductores
                if ($parque == 1) { // Norte (impares)
                    $min = 7;
                    $max = 15;
                } else { // Sur (pares)
                    $min = 8;
                    $max = 16;
                }
                break;

            case 'N': // Mandos Norte
                $min = 1;
                $max = 9;
                break;

            case 'S': // Mandos Sur
                $min = 2;
                $max = 10;
                break;

            case 'J': // Jefe de Guardia
                $min = 1;
                $max = 5;
                break;
        }

        return ['min' => $min, 'max' => $max];
    }

    /**
     * Obtener todos los números ya asignados para una fecha y parque
     */
    private function getAssignedNumbersByDate($parque, $fecha)
    {
        $asignaciones = EquipmentAssignment::where('parque', $parque)
            ->where('fecha', $fecha)
            ->where('activo', true)
            ->get();

        // Extraer solo los números asignados
        $numeros = $asignaciones->pluck('numero')->unique()->toArray();

        return $numeros;
    }



    /**
     * Buscar un número disponible dentro de un rango específico
     */
    private function findAvailableInRange($categoria, $numeroInicial, $min, $max, $parque, $fecha, $numerosYaAsignados, $assignment, array $currentAssignments)
    {
    // Verificar paridad según parque
    $esPar = $parque == 2; // Sur: Pares, Norte: Impares
    $incremento = 2; // Siempre saltamos de 2 en 2 para mantener paridad

    // Ajustar el mínimo y máximo según paridad
    if ($esPar) {
        $min = ($min % 2 == 0) ? $min : $min + 1; // Asegurar que min sea par
    } else {
        $min = ($min % 2 == 1) ? $min : $min + 1; // Asegurar que min sea impar
    }

    // Crear una lista de todos los números posibles dentro del rango respetando paridad
    $posiblesNumeros = [];
    for ($i = $min; $i <= $max; $i += $incremento) {
        $posiblesNumeros[] = $i;
    }

    // Filtrar números ya asignados
    $numerosDisponibles = array_diff($posiblesNumeros, $numerosYaAsignados);

    // Obtener números reservados para otras asignaciones
    $numerosReservados = $this->getReservedNumbersForCategory($categoria, $parque, $currentAssignments);
    
    // Extraer la asignación base (B1, B2, etc.) sin información adicional
    $baseAssignment = preg_replace('/[^A-Z0-9]/', '', $assignment);
    
    // Filtrar números reservados excepto el propio de la asignación actual
    $numerosAFiltrar = [];
    foreach ($numerosReservados as $asign => $numero) {
        // Si no es la asignación actual y el número está disponible
        // (es decir, no ha sido asignado todavía porque no está en $numerosYaAsignados)
        if ($asign !== $baseAssignment && !in_array($numero, $numerosYaAsignados)) {
            $numerosAFiltrar[] = $numero;
        }
    }
    
    // Filtrar números reservados para otras asignaciones
    $numerosDisponibles = array_diff($numerosDisponibles, $numerosAFiltrar);

    if (empty($numerosDisponibles)) {
        Log::info("No hay números disponibles dentro del rango ($min-$max) respetando paridad y reservas");
        return null;
    }

    // Ordenar números disponibles por cercanía al número inicial
    usort($numerosDisponibles, function ($a, $b) use ($numeroInicial) {
        return abs($a - $numeroInicial) - abs($b - $numeroInicial);
    });

    Log::info("Números disponibles ordenados por cercanía: " . implode(", ", $numerosDisponibles));

    // Verificar cada número (del más cercano al más lejano)
    foreach ($numerosDisponibles as $numero) {
        // Comprobar si el equipo existe
        $existe = $this->checkEquipmentExists($categoria, $numero);
        if (!$existe) {
            Log::info("Equipo $categoria $numero no existe, intentando siguiente");
            continue;
        }

        // Verificar si ya ha sido asignado específicamente para esta categoría
        $yaAsignado = $this->isEquipmentAlreadyAssigned($categoria, $numero, $parque, $fecha);
        if ($yaAsignado) {
            Log::info("Equipo $categoria $numero ya asignado específicamente, intentando siguiente");
            continue;
        }

        // Verificar disponibilidad general
        $disponible = $this->isEquipmentAvailable($categoria, $numero);
        if ($disponible) {
            Log::info("Encontrado número disponible para $categoria: $numero (dentro del rango)");
            return $numero;
        }
    }

    Log::warning("No se encontró ningún número disponible para $categoria dentro del rango");
    return null;
}

    /**
     * Buscar cualquier número disponible sin restricciones de rango
     * (último recurso cuando no se encuentra nada dentro del rango normal)
     */
    private function findAnyAvailableNumber($categoria, $parque, $fecha, $numerosYaAsignados)
    {
        // Verificar paridad según parque
        $esPar = $parque == 2; // Sur: Pares, Norte: Impares

        // Obtener todos los equipos disponibles de esta categoría
        $query = PersonalEquipment::where('categoria', $categoria)
            ->where('disponible', true);

        // Filtrar por paridad (par/impar) según el parque
        if ($esPar) {
            $query->whereRaw('CAST(SUBSTRING(nombre, LOCATE(" ", nombre) + 1) AS UNSIGNED) % 2 = 0');
        } else {
            $query->whereRaw('CAST(SUBSTRING(nombre, LOCATE(" ", nombre) + 1) AS UNSIGNED) % 2 = 1');
        }

        $equiposDisponibles = $query->get();

        if ($equiposDisponibles->isEmpty()) {
            Log::warning("No hay equipos disponibles de $categoria con la paridad correcta");
            return null;
        }

        // Extraer los números de los equipos disponibles
        $numerosDisponibles = [];
        foreach ($equiposDisponibles as $equipo) {
            $nombrePartes = explode(' ', $equipo->nombre);
            $numero = end($nombrePartes);

            if (is_numeric($numero)) {
                $numerosDisponibles[] = (int) $numero;
            }
        }

        // Filtrar números ya asignados
        $numerosDisponibles = array_diff($numerosDisponibles, $numerosYaAsignados);

        if (empty($numerosDisponibles)) {
            Log::warning("Todos los equipos disponibles ya están asignados");
            return null;
        }

        // Ordenar de menor a mayor
        sort($numerosDisponibles);

        // Verificar si cada número está realmente disponible
        foreach ($numerosDisponibles as $numero) {
            $yaAsignado = $this->isEquipmentAlreadyAssigned($categoria, $numero, $parque, $fecha);
            if (!$yaAsignado) {
                Log::info("Encontrado número EMERGENCIA para $categoria: $numero (fuera del rango normal)");
                return $numero;
            }
        }

        Log::warning("No se encontró NINGÚN número disponible para $categoria");
        return null;
    }

    /**
     * Comprobar si un equipo existe en la base de datos
     */
    private function checkEquipmentExists($categoria, $numero)
    {
        // Caso especial para Micro que tienen nombre "Micro X" en la base de datos
        if ($categoria === 'Micro') {
            $equipo = PersonalEquipment::where('nombre', "Micro $numero")
                ->exists();
        } else {
            // Para el resto de categorías, se mantiene el formato original
            $equipo = PersonalEquipment::where('nombre', "$categoria $numero")->exists();
        }
        return $equipo;
    }

    private function isEquipmentAvailable($categoria, $numero)
    {
        // Caso especial para Micro que tienen nombre "Micro X" en la base de datos
        if ($categoria === 'Micro') {
            $equipo = PersonalEquipment::where('nombre', "Micro $numero")
                ->first();
        } else {
            // Para el resto de categorías, se mantiene el formato original
            $equipo = PersonalEquipment::where('nombre', "$categoria $numero")
                ->first();
        }

        // Si el equipo no existe o está disponible
        $disponible = !$equipo || $equipo->disponible;
        Log::info("Verificando disponibilidad de $categoria $numero: " . ($disponible ? "Disponible" : "No disponible"));
        return $disponible;
    }

    /**
     * Obtener las categorías de equipo según el rol
     */
    private function getCategoriasForRole($role)
    {
        switch ($role) {
            case 'N':
            case 'S':
            case 'J':
                // Mandos (N, S, Jefe de Guardia)
                return [
                    'Portátil',
                    'Micro',
                    'PTT',
                    'Linterna casco',
                    'Linterna pecho'
                ];
            case 'C':
                // Conductores
                return [
                    'Portátil',
                    'Micro',
                    'Linterna casco',
                    'Linterna pecho'
                ];
            case 'B':
            default:
                // Bomberos
                return [
                    'Portátil',
                    'PTT',
                    'Linterna casco',
                    'Linterna pecho'
                ];
        }
    }

    /**
     * Obtener el número de equipo inicial basado en el rol, número y parque
     * Método mantenido para compatibilidad con código anterior
     */
    private function getInitialEquipmentNumber($role, $number, $parkId)
    {
        $numberInt = (int)$number;
        $result = 0;

        switch ($role) {
            case 'N':
                // Parque Norte - Mandos N
                if ($numberInt == 1) $result = 1;
                elseif ($numberInt == 2) $result = 3;
                elseif ($numberInt >= 3) $result = 5 + (($numberInt - 3) * 2);
                break;

            case 'S':
                // Parque Sur - Mandos S
                if ($numberInt == 1) $result = 2;
                elseif ($numberInt == 2) $result = 4;
                elseif ($numberInt >= 3) $result = 6 + (($numberInt - 3) * 2);
                break;

            case 'C':
                // Conductores
                if ($parkId == 1) { // Norte
                    $result = 7 + (($numberInt - 1) * 2);
                } else { // Sur
                    $result = 8 + (($numberInt - 1) * 2);
                }
                break;

            case 'B':
                // Bomberos
                if ($parkId == 1) { // Norte
                    $result = 15 + (($numberInt - 1) * 2);
                } else { // Sur
                    $result = 16 + (($numberInt - 1) * 2);
                }
                break;

            case 'J':
                // Jefe de Guardia
                $result = 1;
                break;
        }

        Log::info("Calculado número inicial para $role$number en parque $parkId: $result");
        return $result;
    }

    /**
     * Método original para verificar disponibilidad (mantenido por compatibilidad)
     */
    public function checkAvailability($equipmentNumber)
    {
        // Lista de categorías de equipos a verificar
        $categoriasAVerificar = [
            'Portátil',
            'PTT',
            'Linterna casco',
            'Linterna pecho'
        ];

        // Verificar cada categoría de equipo con el número proporcionado
        $disponible = true;
        $equiposNoDisponibles = [];

        foreach ($categoriasAVerificar as $categoria) {
            $nombreEquipo = "$categoria $equipmentNumber";
            $equipo = PersonalEquipment::where('nombre', 'LIKE', $nombreEquipo)
                ->first();

            // Si el equipo existe pero no está disponible
            if ($equipo && !$equipo->disponible) {
                $disponible = false;
                $equiposNoDisponibles[] = $nombreEquipo;
            }
        }

        return response()->json([
            'available' => $disponible,
            'equipment_number' => $equipmentNumber,
            'unavailable_equipment' => $equiposNoDisponibles
        ]);
    }
}