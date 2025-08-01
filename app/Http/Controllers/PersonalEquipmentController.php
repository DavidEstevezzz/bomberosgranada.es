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

        // Limpiar y obtener la primera letra y el número de la asignación
        $assignment = trim($assignment);
        $firstLetter = substr($assignment, 0, 1);
        $number = preg_replace('/[^0-9]/', '', $assignment); // Asegurar que sea solo números

        // Clave específica para Sur (ejemplo: B1S)
        $suAssignment = $firstLetter . $number . 'S';

        // Log adicional para diagnóstico
        Log::info("Assignment limpio: $assignment, First letter: $firstLetter, Number: $number, Sur Assignment: $suAssignment");
        Log::info("¿Existe $suAssignment en reservedNumbers? " . (isset($this->reservedNumbers[$suAssignment]) ? "Sí" : "No"));
        if (isset($this->reservedNumbers[$suAssignment])) {
            Log::info("¿Existe $categoria para $suAssignment? " . (isset($this->reservedNumbers[$suAssignment][$categoria]) ? "Sí" : "No"));
        }

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

    private function getAssignedNumbersByDateAndCategory($parque, $fecha, $categoria)
    {
        $asignaciones = EquipmentAssignment::where('parque', $parque)
            ->where('fecha', $fecha)
            ->where('categoria', $categoria)
            ->where('activo', true)
            ->get();

        // Extraer solo los números asignados para esta categoría específica
        $numeros = $asignaciones->pluck('numero')->unique()->toArray();

        return $numeros;
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
    Log::info("=== INICIO checkAndAssignEquipment ===");
    Log::info("Request completo: " . json_encode($request->all()));

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

    Log::info("Parámetros procesados:");
    Log::info("- parkId: $parkId");
    Log::info("- assignment: $assignment");
    Log::info("- maxAssignment: $maxAssignment");
    Log::info("- date: $date");

    // MANEJO SEGURO DE CURRENTASSIGNMENTS CON LOGS
    Log::info("=== OBTENIENDO ASIGNACIONES ACTUALES ===");
    $currentAssignments = null;
    $currentAssignmentsArray = [];
    
    try {
        Log::info("Llamando a getAssignmentsByDateAndParque con fecha: $date, parque: $parkId");
        $currentAssignments = \App\Models\GuardAssignment::getAssignmentsByDateAndParque($date, $parkId);
        
        Log::info("Tipo de resultado: " . gettype($currentAssignments));
        
        if ($currentAssignments === null) {
            Log::warning("getAssignmentsByDateAndParque devolvió NULL - no hay guardia para esta fecha/parque");
            $currentAssignmentsArray = [];
        } elseif ($currentAssignments instanceof \Illuminate\Support\Collection) {
            $currentAssignmentsArray = $currentAssignments->toArray();
            Log::info("✓ Collection convertida a array exitosamente");
            Log::info("Cantidad de asignaciones: " . count($currentAssignmentsArray));
        } else {
            Log::warning("Resultado inesperado, usando array vacío");
            $currentAssignmentsArray = [];
        }
        
        Log::info("Array final de asignaciones: " . json_encode($currentAssignmentsArray));
        
    } catch (\Exception $e) {
        Log::error("ERROR en getAssignmentsByDateAndParque:");
        Log::error("Mensaje: " . $e->getMessage());
        Log::error("Stack trace: " . $e->getTraceAsString());
        $currentAssignmentsArray = [];
    }

    // Agregar logs para depuración
    Log::info("=== PROCESANDO ASIGNACIÓN ===");
    Log::info("Procesando asignación: $assignment, maxAssignment: $maxAssignment, parque: $parkId, fecha: $date");

    // Determinar el rol basado en la primera letra de la asignación
    $role = substr($assignment, 0, 1);
    Log::info("Rol determinado: $role");

    // Si es operador, devolver respuesta vacía porque no necesitan equipos
    if ($role == 'O' || strpos($assignment, 'OPERADOR') !== false || $assignment === 'TELEFONISTA') {
        Log::info("Asignación de Operador o Telefonista detectada, no se asignan equipos");
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
    Log::info("Categorías a verificar: " . implode(", ", $categoriasAVerificar));

    // Asignar equipos individualmente
    $equipoAsignado = [];
    $equiposNoDisponibles = [];
    $equiposNoExistentes = [];

    Log::info("=== INICIANDO ASIGNACIÓN POR CATEGORÍAS ===");

    foreach ($categoriasAVerificar as $categoria) {
        Log::info("--- Procesando categoría: $categoria ---");

        try {
            $numerosYaAsignados = $this->getAssignedNumbersByDateAndCategory($parkId, $date, $categoria);
            Log::info("Números ya asignados para $categoria: " . json_encode($numerosYaAsignados));

            // Obtener el número reservado para esta asignación y categoría
            $numeroReservado = $this->getReservedNumber($assignment, $categoria, $parkId);
            Log::info("Número reservado para $assignment - $categoria: $numeroReservado");

            // PASO 1: Intentar asignar primero el número reservado según la tabla
            $asignacionCompletada = false;
            Log::info("PASO 1: Verificando número reservado $numeroReservado");

            // Comprobar si el equipo con el número reservado existe
            $equipoExiste = $this->checkEquipmentExists($categoria, $numeroReservado);
            Log::info("¿Existe equipo $categoria $numeroReservado? " . ($equipoExiste ? "SÍ" : "NO"));

            if ($equipoExiste) {
                // Verificar si el número ya ha sido asignado para esta categoría en esta fecha
                $yaAsignado = $this->isEquipmentAlreadyAssigned($categoria, $numeroReservado, $parkId, $date);
                Log::info("¿Ya está asignado $categoria $numeroReservado? " . ($yaAsignado ? "SÍ" : "NO"));

                if (!$yaAsignado) {
                    // Comprobar si el equipo está disponible en general
                    $disponible = $this->isEquipmentAvailable($categoria, $numeroReservado);
                    Log::info("¿Está disponible $categoria $numeroReservado? " . ($disponible ? "SÍ" : "NO"));

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

                        Log::info("✓ ÉXITO: Asignado número reservado para $categoria: $numeroReservado");
                        $asignacionCompletada = true;
                    } else {
                        Log::info("❌ Equipo $categoria $numeroReservado existe pero no está disponible");
                        $equiposNoDisponibles[] = "$categoria $numeroReservado";
                    }
                } else {
                    Log::info("❌ Equipo $categoria $numeroReservado ya asignado a otro en esta fecha");
                    $equiposNoDisponibles[] = "$categoria $numeroReservado (ya asignado)";
                }
            } else {
                Log::info("❌ Equipo $categoria $numeroReservado no existe en el sistema");
                $equiposNoExistentes[] = "$categoria $numeroReservado";
            }

            // PASO 2: Si no se pudo asignar el número reservado, buscar alternativas
            if (!$asignacionCompletada) {
                Log::info("PASO 2: Buscando alternativas para $categoria (número reservado $numeroReservado no disponible)");

                try {
                    // Obtener un rango para buscar alternativas
                    $rangoBusqueda = $this->calcularRangoBusqueda($role, $parkId);
                    Log::info("Rango de búsqueda calculado: min={$rangoBusqueda['min']}, max={$rangoBusqueda['max']}");

                    // Buscar el número más cercano disponible
                    Log::info("Llamando a findAvailableInRange...");
                    $numeroAlternativo = $this->findAvailableInRange(
                        $categoria,
                        $numeroReservado,
                        $rangoBusqueda['min'],
                        $rangoBusqueda['max'],
                        $parkId,
                        $date,
                        $numerosYaAsignados,
                        $assignment,
                        $currentAssignmentsArray
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

                        Log::info("✓ ÉXITO: Asignado número alternativo para $categoria: $numeroAlternativo");
                        $asignacionCompletada = true;
                    } else {
                        Log::warning("❌ No se encontró alternativa en rango para $categoria");

                        // PASO 3: Intentar cualquier número como último recurso
                        Log::info("PASO 3: Buscando cualquier número disponible (último recurso)");
                        
                        try {
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

                                Log::info("✓ ÉXITO: Asignado número (último recurso) para $categoria: $numeroFueraDeRango");
                            } else {
                                Log::error("❌ FALLO TOTAL: No se encontró NINGÚN número disponible para $categoria");
                            }
                        } catch (\Exception $e) {
                            Log::error("ERROR en findAnyAvailableNumber para $categoria:");
                            Log::error("Mensaje: " . $e->getMessage());
                            Log::error("Stack trace: " . $e->getTraceAsString());
                        }
                    }
                } catch (\Exception $e) {
                    Log::error("ERROR en búsqueda de alternativas para $categoria:");
                    Log::error("Mensaje: " . $e->getMessage());
                    Log::error("Stack trace: " . $e->getTraceAsString());
                }
            }

        } catch (\Exception $e) {
            Log::error("ERROR GENERAL procesando categoría $categoria:");
            Log::error("Mensaje: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
        }

        Log::info("--- Fin procesamiento categoría: $categoria ---");
    }

    Log::info("=== GENERANDO RESPUESTA FINAL ===");

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
        
        Log::info("Equipo asignado: $nombreCompleto");
    }

    $response = [
        'assignment' => $assignment,
        'initial_number' => isset($numeroReservado) ? $numeroReservado : 0,
        'equipment_assigned' => $equipoAsignado,
        'equipment_details' => $equiposCompletos,
        'unavailable_equipment' => $equiposNoDisponibles,
        'nonexistent_equipment' => $equiposNoExistentes
    ];

    Log::info("=== RESPUESTA FINAL ===");
    Log::info("Equipos asignados: " . count($equipoAsignado));
    Log::info("Equipos no disponibles: " . count($equiposNoDisponibles));
    Log::info("Equipos no existentes: " . count($equiposNoExistentes));
    Log::info("Respuesta completa: " . json_encode($response));
    Log::info("=== FIN checkAndAssignEquipment ===");

    return response()->json($response);
}

    private function getReservedNumbersForCategory($categoria, $parque, array $currentAssignments)
    {
        $reservados = [];
        $esPar = ($parque == 2);

        // Convertir currentAssignments a un conjunto de asignaciones procesadas
        $processedAssignments = [];
        foreach ($currentAssignments as $assignment) {
            $processedAssignments[] = $assignment;
            // Para el parque sur, también considerar la versión con sufijo 'S'
            if ($esPar && in_array(substr($assignment, 0, 1), ['B', 'C']) && substr($assignment, -1) !== 'S') {
                $processedAssignments[] = $assignment . 'S';
            }
        }

        foreach ($this->reservedNumbers as $asignacion => $equipos) {
            // Verificar si esta asignación está en nuestro conjunto procesado
            if (!in_array($asignacion, $processedAssignments)) {
                continue;
            }

            // Si estamos en el parque sur, para B y C solo considerar versiones con 'S'
            if ($esPar && in_array(substr($asignacion, 0, 1), ['B', 'C']) && substr($asignacion, -1) !== 'S') {
                continue;
            }

            // Si estamos en el parque norte, para B y C solo considerar versiones sin 'S'
            if (!$esPar && in_array(substr($asignacion, 0, 1), ['B', 'C']) && substr($asignacion, -1) === 'S') {
                continue;
            }

            if (isset($equipos[$categoria])) {
                $numero = $equipos[$categoria];
                // Ajustar números para parque Sur si es necesario
                if ($esPar && in_array(substr($asignacion, 0, 1), ['B', 'C']) && $numero % 2 == 1) {
                    $numero += 1;
                }

                // Quitar el sufijo 'S' para guardar la asignación base
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
    // Ampliar el rango para PTT específicamente ya que parece más escaso
    if ($categoria === 'PTT') {
        $maxOriginal = $max;
        $max = $max + 20; // Ampliar el rango máximo para PTT
        Log::info("Ampliando rango para PTT de $maxOriginal a $max");
    }
    
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

    // Filtrar números reservados para otras asignaciones - NUNCA saltamos esta parte
    $numerosDisponibles = array_diff($numerosDisponibles, $numerosAFiltrar);

    if (empty($numerosDisponibles)) {
        Log::info("No hay números disponibles dentro del rango ($min-$max) respetando paridad y reservas para $categoria");
        
        // Si es PTT y no hay números disponibles, intentar con un rango más amplio pero SIEMPRE respetando reservas
        if ($categoria === 'PTT') {
            Log::info("Ampliando rango de búsqueda para PTT, pero respetando reservas");
            $maxAmpliado = $max + 30; // Aún más amplio
            
            $posiblesNumerosAmpliados = [];
            for ($i = $max + $incremento; $i <= $maxAmpliado; $i += $incremento) {
                $posiblesNumerosAmpliados[] = $i;
            }
            
            // Filtrar números ya asignados y reservados del rango ampliado
            $numerosDisponiblesAmpliados = array_diff($posiblesNumerosAmpliados, $numerosYaAsignados, $numerosAFiltrar);
            
            if (!empty($numerosDisponiblesAmpliados)) {
                Log::info("Encontrados números en rango ampliado para PTT: " . implode(", ", $numerosDisponiblesAmpliados));
                $numerosDisponibles = $numerosDisponiblesAmpliados;
            }
        }
        
        // Si después de la ampliación sigue vacío
        if (empty($numerosDisponibles)) {
            return null;
        }
    }

    // Ordenar números disponibles por cercanía al número inicial
    usort($numerosDisponibles, function ($a, $b) use ($numeroInicial) {
        return abs($a - $numeroInicial) - abs($b - $numeroInicial);
    });

    Log::info("Números disponibles ordenados por cercanía para $categoria: " . implode(", ", $numerosDisponibles));

    // Verificar cada número (del más cercano al más lejano)
    foreach ($numerosDisponibles as $numero) {
        // Verificar explícitamente que este número NO está reservado para otra asignación
        if (in_array($numero, $numerosAFiltrar)) {
            Log::info("Saltando número $numero para $categoria porque está reservado para otra asignación");
            continue;
        }
        
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
            // VERIFICACIÓN FINAL: asegurarse que no está reservado
            if (in_array($numero, $numerosAFiltrar)) {
                Log::info("Equipo $categoria $numero está disponible pero está reservado para otra asignación - SALTANDO");
                continue;
            }
            
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
