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
        
        // Obtener el número estático inicial basado en el rol, número y parque
        $numeroInicial = $this->getInitialEquipmentNumber($role, substr($assignment, 1), $parkId);
        Log::info("Número inicial asignado: $numeroInicial");
        
        // Calcular un rango de búsqueda para números alternativos basado en la asignación
        $rangoBusqueda = $this->calcularRangoBusqueda($role, $parkId);
        Log::info("Rango de búsqueda para alternativas: " . json_encode($rangoBusqueda));
        
        // Asignar equipos individualmente
        $equipoAsignado = [];
        $equiposNoDisponibles = [];
        $equiposNoExistentes = [];
        
        // Mantener un conjunto de números ya asignados para esta fecha y parque
        $numerosYaAsignados = $this->getAssignedNumbersByDate($parkId, $date);
        Log::info("Números ya asignados para esta fecha: " . implode(", ", $numerosYaAsignados));
        
        foreach ($categoriasAVerificar as $categoria) {
            Log::info("Verificando categoría: $categoria para asignación $assignment");
            
            // PASO 1: Intentar asignar primero el número que corresponde a la regla
            // Primero intentamos siempre con el número inicial según la regla
            $asignacionCompletada = false;
            
            // Comprobar si el equipo con el número inicial existe
            $equipoExiste = $this->checkEquipmentExists($categoria, $numeroInicial);
            
            if ($equipoExiste) {
                // Verificar si el número ya ha sido asignado para esta categoría en esta fecha
                $yaAsignado = $this->isEquipmentAlreadyAssigned($categoria, $numeroInicial, $parkId, $date);
                
                if (!$yaAsignado) {
                    // Comprobar si el equipo está disponible en general
                    $disponible = $this->isEquipmentAvailable($categoria, $numeroInicial);
                    
                    if ($disponible) {
                        $equipoAsignado[$categoria] = $numeroInicial;
                        
                        // Marcar este equipo como asignado en la base de datos
                        $this->markEquipmentAsAssigned(
                            $categoria, 
                            $numeroInicial, 
                            $parkId, 
                            $assignment,
                            $date
                        );
                        
                        // Añadir al conjunto de números asignados
                        $numerosYaAsignados[] = $numeroInicial;
                        
                        Log::info("Asignado número inicial para $categoria: $numeroInicial - COINCIDE CON REGLA");
                        $asignacionCompletada = true;
                    } else {
                        Log::info("Equipo $categoria $numeroInicial existe pero no está disponible");
                        $equiposNoDisponibles[] = "$categoria $numeroInicial";
                    }
                } else {
                    Log::info("Equipo $categoria $numeroInicial ya asignado a otro en esta fecha");
                    $equiposNoDisponibles[] = "$categoria $numeroInicial (ya asignado)";
                }
            } else {
                Log::info("Equipo $categoria $numeroInicial no existe en el sistema");
                $equiposNoExistentes[] = "$categoria $numeroInicial";
            }
            
            // PASO 2: Si no se pudo asignar el número inicial, buscar el próximo disponible
            if (!$asignacionCompletada) {
                Log::info("Buscando número alternativo para $categoria, partiendo de $numeroInicial con rango: " . json_encode($rangoBusqueda));
                
                // Buscar el siguiente número disponible más cercano al inicial
                $numeroAlternativo = $this->findAvailableInRange(
                    $categoria,
                    $numeroInicial,
                    $rangoBusqueda['min'], 
                    $rangoBusqueda['max'],
                    $parkId,
                    $date,
                    $numerosYaAsignados
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
                    
                    Log::info("Asignado número alternativo para $categoria: $numeroAlternativo - DENTRO DEL RANGO");
                } else {
                    Log::warning("No se encontró número alternativo para $categoria dentro del rango");
                    
                    // Intentar una búsqueda más amplia fuera del rango normal
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
                        
                        Log::info("Asignado número alternativo para $categoria: $numeroFueraDeRango - FUERA DE RANGO");
                    } else {
                        Log::warning("No se encontró ningún número disponible para $categoria");
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
            'initial_number' => $numeroInicial,
            'equipment_assigned' => $equipoAsignado,
            'equipment_details' => $equiposCompletos,
            'unavailable_equipment' => $equiposNoDisponibles,
            'nonexistent_equipment' => $equiposNoExistentes
        ];
        
        Log::info("Respuesta final para $assignment: " . json_encode($response));
        
        return response()->json($response);
    }

    /**
     * Calcular el rango de búsqueda para números alternativos según el rol y parque
     * 
     * @param string $role Rol (B, C, N, S, J)
     * @param int $parque ID del parque (1: Norte, 2: Sur)
     * @return array Array con min y max para el rango
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
     * 
     * @param int $parque ID del parque
     * @param string $fecha Fecha de las asignaciones (formato Y-m-d)
     * @return array Lista de números ya asignados
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
     * 
     * @param string $categoria Categoría del equipo
     * @param int $numeroInicial Número inicial para calcular cercanía
     * @param int $min Valor mínimo del rango
     * @param int $max Valor máximo del rango
     * @param int $parque ID del parque
     * @param string $fecha Fecha para la asignación
     * @param array $numerosYaAsignados Conjunto de números ya asignados
     * @return int|null Número encontrado o null si no se encuentra ninguno
     */
    private function findAvailableInRange($categoria, $numeroInicial, $min, $max, $parque, $fecha, $numerosYaAsignados)
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
        
        if (empty($numerosDisponibles)) {
            Log::info("No hay números disponibles dentro del rango ($min-$max) respetando paridad");
            return null;
        }
        
        // Ordenar números disponibles por cercanía al número inicial
        usort($numerosDisponibles, function($a, $b) use ($numeroInicial) {
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
    
    /**
     * Verificar si un equipo específico está disponible
     */
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