    <?php

    namespace App\Http\Controllers;

    use App\Models\Firefighters_assignment;
    use Illuminate\Support\Facades\Validator;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Log;
    use App\Models\User;
    use App\Models\Guard;
    use App\Models\Request as RequestModel;


    class FirefighterAssignmentController extends Controller
    {
        /**
         * Display a listing of the resource.
         */
        public function index()
        {
            $firefighter_assignments = Firefighters_assignment::with([
                'firefighter:id_empleado,nombre,apellido', // Asumiendo que tienes un campo 'nombre' en el modelo User
                'brigadeOrigin:id_brigada,nombre',
                'brigadeDestination:id_brigada,nombre'
            ])->get();

            return response()->json($firefighter_assignments);
        }

        /**
         * Store a newly created resource in storage.
         */
        public function store(Request $request)
        {
            $request->merge([
                'turno' => $request->input('turno', 'Mañana')
            ]);

            $rules = [
                'id_asignacion' => 'unique:firefighters_assignments,id_asignacion',
                'fecha_ini' => 'required|date',
                'id_empleado' => 'required|exists:users,id_empleado',
                'id_brigada_origen' => 'nullable|exists:brigades,id_brigada',
                'id_brigada_destino' => 'required|exists:brigades,id_brigada',
                'turno' => 'in:Mañana,Tarde,Noche',  // Validación del turno
                'requerimiento' => 'boolean'
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json($validator->errors(), 400);
            }

            $firefighter_assignment = Firefighters_assignment::create($request->all());
            return response()->json($firefighter_assignment, 201);
        }


        /**
         * Display the specified resource.
         */
        public function show($id_asignacion)
        {
            $firefighter_assignment = Firefighters_assignment::where('id_asignacion', $id_asignacion)->first();

            if (!$firefighter_assignment) {
                return response()->json(['message' => 'Metodo show. Firefighter assignment not found'], 404);
            }

            return response()->json($firefighter_assignment);
        }

        /**
         * Update the specified resource in storage.
         */
        public function update(Request $request, $id_asignacion)
        {
            $rules = [
                'id_asignacion' => 'unique:firefighters_assignments,id_asignacion,' . $id_asignacion . ',id_asignacion',
                'fecha_ini' => 'required|date',
                'id_empleado' => 'required|exists:users,id_empleado',
                'id_brigada_origen' => 'nullable|exists:brigades,id_brigada',
                'id_brigada_destino' => 'required|exists:brigades,id_brigada',
                'turno' => 'required|in:Mañana,Tarde,Noche',  // Validación del turno
                'requerimiento' => 'boolean' // Nuevo: para update también
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json($validator->errors(), 400);
            }

            $firefighter_assignment = Firefighters_assignment::where('id_asignacion', $id_asignacion)->first();

            if (!$firefighter_assignment) {
                return response()->json(['message' => 'Firefighter assignment not found'], 404);
            }

            $firefighter_assignment->update($request->all());
            return response()->json($firefighter_assignment, 200);
        }


        /**
         * Remove the specified resource from storage.
         */
        public function destroy($id_asignacion)
        {
            $firefighter_assignment = Firefighters_assignment::where('id_asignacion', $id_asignacion)->first();

            if (!$firefighter_assignment) {
                return response()->json(['message' => 'Firefighter assignment not found'], 404);
            }

            $firefighter_assignment->delete();
            return response()->json(null, 204);
        }

        public function availableFirefighters(Request $request)
        {
            $date = $request->query('date', date('Y-m-d'));
            Log::info("Fecha recibida en availableFirefighters:", ['date' => $date]);

            // Lista estática de exclusión
            $staticExcluded = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales'];

            // Obtenemos las brigadas que tienen guardia SOLO en el día consultado
            $guards = Guard::with('brigade')->where('date', $date)->get();
            $guardExcluded = $guards->pluck('brigade.nombre')->unique()->toArray();

            // Combinamos ambas listas
            $excludedBrigades = array_merge($staticExcluded, $guardExcluded);
            Log::info("Brigadas excluidas (estáticas y por guardia en {$date}):", ['excludedBrigades' => $excludedBrigades]);

            // Agrupamos las asignaciones de bomberos hasta $date
            $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->get()
                ->groupBy('id_empleado');

            $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades, $guards);

            $availableFirefighters = User::whereIn('type', ['bombero', 'mando'])
                ->where('puesto', '!=', 'Operador')
                ->whereNotIn('id_empleado', $unavailableFirefighterIds)
                ->get();

            return response()->json([
                'date' => $date,
                'available_firefighters' => $availableFirefighters,
            ]);
        }


        public function availableFirefightersWithoutMands(Request $request)
        {
            $date = $request->query('date', date('Y-m-d'));
            Log::info("Fecha recibida en availableFirefighters antes de procesar:", ['date' => $date]);

            $excludedBrigades = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales'];

            $guards = Guard::whereIn('date', [
                $date,
                date('Y-m-d', strtotime("$date -1 day")),
                date('Y-m-d', strtotime("$date +1 day"))
            ])->get();

            $additionalExcludedBrigades = $guards->pluck('brigade.nombre')->unique()->toArray();
            $excludedBrigades = array_merge($excludedBrigades, $additionalExcludedBrigades);

            Log::info("Brigadas excluidas con guardias recientes:", ['excludedBrigades' => $excludedBrigades]);

            $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades, $guards);

            $availableFirefighters = User::whereIn('type', ['bombero'])
                ->whereNotIn('id_empleado', $unavailableFirefighterIds)
                ->get();

            Log::info("Bomberos disponibles obtenidos:", ['available_firefighters' => $availableFirefighters]);

            return response()->json([
                'date' => $date,
                'available_firefighters' => $availableFirefighters,
            ]);
        }



        private function getFirefightersAssignedToExcludedBrigades($date, $excludedBrigades, $guards)
        {
            Log::info("Fecha y brigadas excluidas iniciales:", [
                'date' => $date,
                'excludedBrigades' => $excludedBrigades
            ]);

            // Definimos días anterior y siguiente
            $previousDay = date('Y-m-d', strtotime("$date -1 day"));
            $nextDay     = date('Y-m-d', strtotime("$date +1 day"));

            // Obtenemos las brigadas que estuvieron en guardia ayer
            $guardYesterday = Guard::with('brigade')
                ->where('date', $previousDay)
                ->get()
                ->pluck('brigade.nombre')
                ->unique()
                ->toArray();

            Log::info("Brigadas en guardia ayer:", ['guardYesterday' => $guardYesterday]);

            // Obtenemos las brigadas que estarán en guardia mañana
            $guardTomorrow = Guard::with('brigade')
                ->where('date', $nextDay)
                ->get()
                ->pluck('brigade.nombre')
                ->unique()
                ->toArray();

            Log::info("Brigadas en guardia mañana:", ['guardTomorrow' => $guardTomorrow]);



            // Obtenemos las asignaciones vigentes hasta $date, agrupadas por bombero
            $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->get()
                ->groupBy('id_empleado');

            $unavailableFirefighterIds = [];

            // Brigadas en guardia HOY
            $guardToday = Guard::with('brigade')
                ->where('date', $date)
                ->get()
                ->pluck('brigade.nombre')
                ->unique()
                ->toArray();


            // Actualizamos la lista de brigadas excluidas para incluir las de ayer y mañana
            $excludedBrigades = array_merge($excludedBrigades, $guardYesterday, $guardTomorrow);
            Log::info("Lista final de brigadas excluidas (incluyendo guardia ayer y mañana):", [
                'excludedBrigades' => $excludedBrigades
            ]);

            foreach ($assignments as $firefighterId => $firefighterAssignments) {
                // Se obtiene la protección (basada en las requests) para este bombero
                $isProtected = $this->isProtectedByRequests($firefighterId, $previousDay, $date, $nextDay);

                // Tomamos la última asignación para HOY
                $lastAssignment = $firefighterAssignments->first();
                if ($lastAssignment && $lastAssignment->brigadeDestination) {
                    $brigadeName = $lastAssignment->brigadeDestination->nombre;
                    Log::info("Bombero {$firefighterId}: Última asignación para {$date} en brigada '{$brigadeName}'.");

                    $hasGuardAssignment = false;
                    foreach ($firefighterAssignments as $assignment) {
                        // Solo consideramos asignaciones cuyo 'fecha_ini' sea igual a la fecha actual
                        if ($assignment->fecha_ini == $date && $assignment->brigadeDestination && in_array($assignment->brigadeDestination->nombre, $guardToday)) {
                            Log::info("Bombero {$firefighterId} EXCLUIDO por tener asignación en la brigada de guardia '{$assignment->brigadeDestination->nombre}' HOY.");
                            $hasGuardAssignment = true;
                            break;
                        }
                    }

                    if ($hasGuardAssignment) {
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue;
                    }

                    // Condición B: Si la brigada está en la lista estática y además no está protegido, se excluye.
                    if (in_array($brigadeName, $excludedBrigades) && !$isProtected) {
                        Log::info("Bombero {$firefighterId} EXCLUIDO por pertenecer a brigada '{$brigadeName}' (estática) y NO está protegido.");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue;
                    }
                } else {
                    Log::info("Bombero {$firefighterId} no tiene asignación previa para {$date}. EXCLUIDO.");
                    $unavailableFirefighterIds[] = $firefighterId;
                }
            }

            Log::info("IDs de bomberos no disponibles:", [
                'unavailableFirefighterIds' => $unavailableFirefighterIds
            ]);

            return $unavailableFirefighterIds;
        }





        private function isProtectedByRequests($firefighterId, $previousDay, $currentDay, $nextDay)
        {
            // Tipos que NO tienen turno,
            // pero ahora se protegerán sólo si la solicitud **termina** el día anterior.
            $typesWithoutTurno = [
                'vacaciones',
                'modulo',
                'licencias por dias'
            ];

            // Tipos que SÍ requieren comprobación de turnos.
            $typesWithTurno = [
                'asuntos propios',
                'compensacion grupos especiales',
                'licencias por jornadas'
            ];

            /******************************************************
             * 1) CHEQUEO PARA EL DÍA ANTERIOR (previousDay)
             ******************************************************/
            $dayToCheck = $previousDay;
            $dayToCheckMinus1 = date('Y-m-d', strtotime("$dayToCheck -1 day"));

            $queryPrev = \App\Models\Request::where('id_empleado', $firefighterId)
                ->where('estado', 'Confirmada')
                ->where(function ($query) use ($dayToCheck, $dayToCheckMinus1, $typesWithoutTurno, $typesWithTurno) {
                    $query->where(function ($q) use ($dayToCheckMinus1, $dayToCheck, $typesWithoutTurno) {
                        $q->whereIn('tipo', $typesWithoutTurno)
                            ->where('fecha_ini', '<=', $dayToCheck)
                            ->where('fecha_fin', '=', $dayToCheck);
                    })
                        ->orWhere(function ($q) use ($dayToCheck, $typesWithTurno) {
                            $q->whereIn('tipo', $typesWithTurno)
                                ->where('fecha_ini', '<=', $dayToCheck)
                                ->where('fecha_fin', '>=', $dayToCheck)
                                ->whereIn('turno', ['Tarde y noche', 'Día Completo']);
                        });
                });
            $protectedPrevious = $queryPrev->exists();
            Log::info("isProtectedByRequests - Bombero {$firefighterId} - Día anterior ({$previousDay}): " . ($protectedPrevious ? "Protegido" : "No protegido"));

            /******************************************************
             * 2) CHEQUEO PARA EL DÍA ACTUAL (currentDay)
             ******************************************************/
            $dayToCheck = $currentDay;
            $dayToCheckMinus1 = date('Y-m-d', strtotime("$dayToCheck -1 day"));
            $queryCurrent = \App\Models\Request::where('id_empleado', $firefighterId)
                ->where('estado', 'Confirmada')
                ->where(function ($query) use ($dayToCheck, $dayToCheckMinus1, $typesWithoutTurno, $typesWithTurno) {
                    $query->where(function ($q) use ($dayToCheckMinus1, $typesWithoutTurno) {
                        $q->whereIn('tipo', $typesWithoutTurno)
                            ->where('fecha_ini', '<=', $dayToCheckMinus1)
                            ->where('fecha_fin', '=', $dayToCheckMinus1);
                    })
                        ->orWhere(function ($q) use ($dayToCheck, $typesWithTurno) {
                            $q->whereIn('tipo', $typesWithTurno)
                                ->where('fecha_ini', '<=', $dayToCheck)
                                ->where('fecha_fin', '>=', $dayToCheck)
                                ->whereIn('turno', ['Tarde y noche', 'Día Completo', 'Mañana y tarde']);
                        });
                });
            $protectedCurrent = $queryCurrent->exists();
            Log::info("isProtectedByRequests - Bombero {$firefighterId} - Día actual ({$currentDay}): " . ($protectedCurrent ? "Protegido" : "No protegido"));

            /******************************************************
             * 3) CHEQUEO PARA EL DÍA SIGUIENTE (nextDay)
             ******************************************************/
            $dayToCheck = $nextDay;
            $dayToCheckMinus1 = date('Y-m-d', strtotime("$dayToCheck -1 day"));
            $queryNext = \App\Models\Request::where('id_empleado', $firefighterId)
                ->where('estado', 'Confirmada')
                ->where(function ($query) use ($dayToCheck, $dayToCheckMinus1, $typesWithoutTurno, $typesWithTurno) {
                    $query->where(function ($q) use ($dayToCheckMinus1, $dayToCheck, $typesWithoutTurno) {
                        $q->whereIn('tipo', $typesWithoutTurno)
                            ->where('fecha_ini', '<=', $dayToCheck)
                            ->where('fecha_fin', '>=', $dayToCheck);
                            
                    })
                        ->orWhere(function ($q) use ($dayToCheck, $typesWithTurno) {
                            $q->whereIn('tipo', $typesWithTurno)
                                ->where('fecha_ini', '<=', $dayToCheck)
                                ->where('fecha_fin', '>=', $dayToCheck)
                                ->whereIn('turno', ['Mañana y tarde', 'Día Completo']);
                        });
                });
            $protectedNext = $queryNext->exists();

            // **NUEVA VALIDACIÓN PARA EL DÍA SIGUIENTE (Condición B):**
            // Se consulta la última asignación para el día actual y, si está en un tipo sin turno,
            // se anula la protección para el día siguiente.
            $lastAssignmentCurrent = Firefighters_assignment::where('id_empleado', $firefighterId)
                ->where('fecha_ini', '<=', $currentDay)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->first();
            if ($lastAssignmentCurrent && $lastAssignmentCurrent->brigadeDestination) {
                $brigadeCurrent = strtolower($lastAssignmentCurrent->brigadeDestination->nombre);
                if (in_array($brigadeCurrent, array_map('strtolower', $typesWithoutTurno))) {
                    $protectedNext = false;
                    Log::info("isProtectedByRequests - Bombero {$firefighterId}: No se protege para el día siguiente porque la última asignación para el día actual es a '{$lastAssignmentCurrent->brigadeDestination->nombre}', que está en tipos sin turno.");
                }
            }
            Log::info("isProtectedByRequests - Bombero {$firefighterId} - Día siguiente ({$nextDay}): " . ($protectedNext ? "Protegido" : "No protegido"));

            /******************************************************
             * 4) RESULTADO FINAL
             ******************************************************/
            $result = $protectedPrevious || $protectedCurrent || $protectedNext;
            Log::info("isProtectedByRequests - Bombero {$firefighterId} - Resultado final: " . ($result ? "Protegido" : "No protegido"));

            return $result;
        }






        public function moveToTop($id, $column = 'orden')
        {
            $minOrder = User::min($column);
            $firefighter = User::find($id);

            if ($firefighter) {
                $firefighter->$column = $minOrder - 1;
                $firefighter->save();
                return response()->json(['message' => 'Moved to bottom', 'orden' => $firefighter->$column]);
            }

            return response()->json(['message' => 'Firefighter not found'], 404);
        }

        public function moveToBottom($id, $column = 'orden')
        {
            $maxOrder = User::max($column);
            $firefighter = User::find($id);

            if ($firefighter) {
                $firefighter->$column = $maxOrder + 1;
                $firefighter->save();
                return response()->json(['message' => 'Moved to top', 'orden' => $firefighter->$column]);
            }

            return response()->json(['message' => 'Firefighter not found'], 404);
        }

        public function requireFirefighter(Request $request)
        {
            Log::info("requireFirefighter - Datos recibidos:", $request->all());

            // Validar los campos recibidos
            $validator = Validator::make($request->all(), [
                'id_empleado' => 'required|exists:users,id_empleado',
                'id_brigada_destino' => 'required|exists:brigades,id_brigada',
                'fecha' => 'required|date',
                'turno' => 'required|in:Mañana,Tarde,Noche,Día Completo,Mañana y tarde,Tarde y noche',
            ]);

            if ($validator->fails()) {
                return response()->json($validator->errors(), 400);
            }

            $idEmpleado = $request->input('id_empleado');
            $idBrigadaDestino = $request->input('id_brigada_destino');
            $fecha = $request->input('fecha');
            $turnoRequest = $request->input('turno');

            // 1. Determinar la brigada original (última antes de $fecha)
            $assignmentAnterior = Firefighters_assignment::where('id_empleado', $idEmpleado)
                ->where('fecha_ini', '<=', $fecha)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->first();

            $brigadaOrigen = $assignmentAnterior ? $assignmentAnterior->id_brigada_destino : null;

            // 2. Calcular el turno de ida
            $turnoIda = match ($turnoRequest) {
                'Mañana', 'Día Completo', 'Mañana y tarde' => 'Mañana',
                'Tarde', 'Tarde y noche' => 'Tarde',
                'Noche' => 'Noche',
                default => 'Mañana',
            };

            // 3. Crear la asignación de ida (requerimiento = true)
            $asignacionIda = Firefighters_assignment::create([
                'id_empleado' => $idEmpleado,
                'id_brigada_origen' => $brigadaOrigen,
                'id_brigada_destino' => $idBrigadaDestino,
                'fecha_ini' => $fecha,
                'turno' => $turnoIda,
                'requerimiento' => true,
            ]);

            // 4. Calcular el turno de vuelta y la fecha de vuelta
            switch ($turnoRequest) {
                case 'Mañana':
                    $turnoVuelta = 'Tarde';
                    $fechaVuelta = $fecha;
                    break;
                case 'Tarde':
                case 'Mañana y tarde':
                    $turnoVuelta = 'Noche';
                    $fechaVuelta = $fecha;
                    break;
                case 'Tarde y noche':
                case 'Noche':
                    $turnoVuelta = 'Mañana';
                    $fechaVuelta = date('Y-m-d', strtotime($fecha . ' +1 day'));
                    break;
                case 'Día Completo':
                    $turnoVuelta = 'Mañana';
                    $fechaVuelta = date('Y-m-d', strtotime($fecha . ' +1 day'));
                    break;
                default:
                    $turnoVuelta = 'Tarde';
                    $fechaVuelta = $fecha;
                    break;
            }

            // 5. Crear la asignación de vuelta (requerimiento = false)
            $asignacionVuelta = Firefighters_assignment::create([
                'id_empleado' => $idEmpleado,
                'id_brigada_origen' => $idBrigadaDestino,
                'id_brigada_destino' => $brigadaOrigen,
                'fecha_ini' => $fechaVuelta,
                'turno' => $turnoVuelta,
                'requerimiento' => false,
            ]);

            return response()->json([
                'asignacion_ida' => $asignacionIda,
                'asignacion_vuelta' => $asignacionVuelta,
            ], 201);
        }


        public function availableFirefightersNoAdjacentDays(Request $request)
        {
            $date = $request->query('date', date('Y-m-d'));
            Log::info("Fecha recibida en availableFirefightersNoAdjacentDays:", ['date' => $date]);

            // Lista estática de exclusión
            $staticExcluded = ['Bajas', 'Vacaciones', 'Asuntos Propios', 'Modulo', 'Licencias por Jornadas', 'Licencias por Días', 'Compensacion grupos especiales'];

            // Obtenemos las brigadas que tienen guardia SOLO en el día consultado
            $guards = Guard::with('brigade')->where('date', $date)->get();
            $guardExcluded = $guards->pluck('brigade.nombre')->unique()->toArray();

            // Combinamos ambas listas
            $excludedBrigades = array_merge($staticExcluded, $guardExcluded);
            Log::info("Brigadas excluidas (estáticas y por guardia en {$date}):", ['excludedBrigades' => $excludedBrigades]);

            // Obtenemos IDs de bomberos **no disponibles** sin considerar ayer/mañana.
            $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigadesNoAdjacentDays($date, $excludedBrigades);

            $availableFirefighters = User::whereIn('type', ['bombero', 'mando'])
                ->whereNotIn('id_empleado', $unavailableFirefighterIds)
                ->get();

            Log::info("Bomberos disponibles (No Adjacent) obtenidos:", ['available_firefighters' => $availableFirefighters]);

            return response()->json([
                'date' => $date,
                'available_firefighters' => $availableFirefighters,
            ]);
        }


        private function getFirefightersAssignedToExcludedBrigadesNoAdjacentDays($date, $excludedBrigades)
        {
            Log::info("Fecha y brigadas excluidas (NO Adjacent):", [
                'date' => $date,
                'excludedBrigades' => $excludedBrigades
            ]);

            // Traemos todas las asignaciones vigentes a la fecha actual (como hacías antes)
            $assignments = Firefighters_assignment::where('fecha_ini', '<=', $date)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->get()
                ->groupBy('id_empleado');

            Log::info("Asignaciones agrupadas por bombero (NO Adjacent):", [
                'assignments' => $assignments
            ]);

            $unavailableFirefighterIds = [];

            foreach ($assignments as $firefighterId => $firefighterAssignments) {
                $lastAssignment = $firefighterAssignments->first();

                // Lo marcamos como no disponible si la última brigada destino está en la lista de excluidas
                if ($lastAssignment && $lastAssignment->brigadeDestination) {
                    $brigadeName = $lastAssignment->brigadeDestination->nombre;
                    if (in_array($brigadeName, $excludedBrigades)) {
                        Log::info("Bombero {$firefighterId} EXCLUIDO (NO Adjacent) por estar en brigada '{$brigadeName}' el día actual.");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue;
                    }
                } else {
                    // Si no tiene asignación previa, lo excluimos (o puedes decidir lo contrario)
                    Log::info("Bombero {$firefighterId} no tiene asignación previa para {$date}, excluyendo (NO Adjacent).");
                    $unavailableFirefighterIds[] = $firefighterId;
                }
            }

            Log::info("IDs de bomberos no disponibles:", [
                'unavailableFirefighterIds' => $unavailableFirefighterIds
            ]);

            return $unavailableFirefighterIds;
        }

        /**
         * Excluye a quienes tengan guardia HOY o MAÑANA. Devuelve sólo users con puesto = 'Operador'.
         */
        public function availableFirefightersNoTodayAndTomorrow(Request $request)
        {
            $date = $request->query('date', date('Y-m-d'));
            Log::info("Fecha recibida en availableFirefightersNoTodayAndTomorrow:", ['date' => $date]);

            // Calculamos la fecha de mañana
            $tomorrow = date('Y-m-d', strtotime("$date +1 day"));

            // Lista estática de exclusión
            $staticExcluded = [
                'Bajas',
                'Vacaciones',
                'Asuntos Propios',
                'Modulo',
                'Licencias por Jornadas',
                'Licencias por Días',
                'Compensacion grupos especiales'
            ];

            // Brigadas que tienen guardia HOY
            $guardsToday = Guard::with('brigade')->where('date', $date)->get();
            $excludedToday = $guardsToday->pluck('brigade.nombre')->unique()->toArray();

            // Brigadas que tienen guardia MAÑANA
            $guardsTomorrow = Guard::with('brigade')->where('date', $tomorrow)->get();
            $excludedTomorrow = $guardsTomorrow->pluck('brigade.nombre')->unique()->toArray();

            // Combinamos ambas listas
            $excludedBrigades = array_merge($staticExcluded, $excludedToday, $excludedTomorrow);
            Log::info("Brigadas excluidas (estáticas, hoy y mañana) en {$date}:", ['excludedBrigades' => $excludedBrigades]);

            // Obtenemos IDs de bomberos no disponibles, para HOY o MAÑANA
            $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigadesNoTodayAndTomorrow($date, $tomorrow, $excludedBrigades);

            // Aquí solo traemos users con puesto = 'Operador'
            $availableFirefighters = User::where('puesto', 'Operador')
                ->whereNotIn('id_empleado', $unavailableFirefighterIds)
                ->get();

            Log::info("Bomberos disponibles (No Today & Tomorrow) obtenidos:", ['available_firefighters' => $availableFirefighters]);

            return response()->json([
                'date' => $date,
                'available_firefighters' => $availableFirefighters,
            ]);
        }

        private function getFirefightersAssignedToExcludedBrigadesNoTodayAndTomorrow($date, $tomorrow, $excludedBrigades)
        {
            Log::info("Fecha hoy: {$date}, fecha mañana: {$tomorrow}, brigadas excluidas:", ['excludedBrigades' => $excludedBrigades]);

            $unavailableFirefighterIds = [];

            // Día anterior a HOY (por si usamos isProtectedByRequests)
            $previousDay = date('Y-m-d', strtotime("$date -1 day"));

            // Asignaciones vigentes para HOY
            $assignmentsToday = Firefighters_assignment::where('fecha_ini', '<=', $date)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->get()
                ->groupBy('id_empleado');

            // Asignaciones vigentes para MAÑANA
            $assignmentsTomorrow = Firefighters_assignment::where('fecha_ini', '<=', $tomorrow)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->get()
                ->groupBy('id_empleado');

            // Bomberos que tienen asignaciones hoy o mañana
            $allFirefighterIds = $assignmentsToday->keys()
                ->merge($assignmentsTomorrow->keys())
                ->unique();

            // Definimos los tipos sin turno (en minúsculas para comparación)
            $typesWithoutTurno = ['vacaciones', 'modulo', 'licencias por dias'];

            foreach ($allFirefighterIds as $firefighterId) {
                // Verificamos si está protegido (día anterior, hoy y mañana)
                $isProtected = $this->isProtectedByRequests($firefighterId, $previousDay, $date, $tomorrow);
                Log::info("Bombero {$firefighterId} => isProtected: " . ($isProtected ? 'SÍ' : 'NO'));

                // 1) Última asignación HOY
                $lastAssignmentToday = $assignmentsToday[$firefighterId]->first() ?? null;
                if ($lastAssignmentToday && $lastAssignmentToday->brigadeDestination) {
                    $brigadeName = $lastAssignmentToday->brigadeDestination->nombre;
                    Log::info("Bombero {$firefighterId} - Asignación HOY => brigada '{$brigadeName}'.");

                    // Si la última asignación es de un tipo sin turno, se excluye automáticamente
                    if (in_array(strtolower($brigadeName), $typesWithoutTurno)) {
                        Log::info("Bombero {$firefighterId} EXCLUIDO automáticamente por asignación a '{$brigadeName}' (tipo sin turno).");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue; // Pasamos al siguiente bombero sin evaluar protección
                    }

                    // Luego, si la brigada está en las excluidas y no está protegido, se excluye
                    if (in_array($brigadeName, $excludedBrigades)) {
                        Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeName}' HOY y NO está protegido.");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue; // Ya excluido por hoy, no chequeamos mañana
                    } else {
                        Log::info("Bombero {$firefighterId} - brigada '{$brigadeName}' HOY, pero NO se excluye (o está protegido).");
                    }
                } else {
                    // Si no tiene asignación previa para HOY, lo excluimos (o ajusta si quieres otro comportamiento)
                    Log::info("Bombero {$firefighterId} SIN asignación previa para HOY ({$date}), EXCLUYENDO (NoTodayAndTomorrow).");
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue;
                }

                // 2) Última asignación MAÑANA (solo si no se excluyó por hoy)
                $lastAssignmentTomorrow = $assignmentsTomorrow[$firefighterId]->first() ?? null;
                if ($lastAssignmentTomorrow && $lastAssignmentTomorrow->brigadeDestination) {
                    $brigadeNameTomorrow = $lastAssignmentTomorrow->brigadeDestination->nombre;
                    Log::info("Bombero {$firefighterId} - Asignación MAÑANA => brigada '{$brigadeNameTomorrow}'.");

                    if (in_array($brigadeNameTomorrow, $excludedBrigades) && !$isProtected) {
                        Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameTomorrow}' MAÑANA y NO está protegido.");
                        $unavailableFirefighterIds[] = $firefighterId;
                    } else {
                        Log::info("Bombero {$firefighterId} - brigada '{$brigadeNameTomorrow}' MAÑANA, pero NO se excluye (o está protegido).");
                    }
                }
            }

            $unavailableFirefighterIds = array_unique($unavailableFirefighterIds);
            Log::info("IDs de bomberos no disponibles (No Today & Tomorrow + isProtected):", [
                'unavailableFirefighterIds' => $unavailableFirefighterIds
            ]);

            return $unavailableFirefighterIds;
        }



        /**
         * Excluye a quienes tengan guardia HOY o AYER. Devuelve sólo users con puesto = 'Operador'.
         */
        public function availableFirefightersNoTodayAndYesterday(Request $request)
        {
            $date = $request->query('date', date('Y-m-d'));
            Log::info("Fecha recibida en availableFirefightersNoTodayAndYesterday:", ['date' => $date]);

            // Calculamos la fecha de AYER
            $yesterday = date('Y-m-d', strtotime("$date -1 day"));

            // Lista estática de exclusión
            $staticExcluded = [
                'Bajas',
                'Vacaciones',
                'Asuntos Propios',
                'Modulo',
                'Licencias por Jornadas',
                'Licencias por Días',
                'Compensacion grupos especiales'
            ];

            // Brigadas que tienen guardia HOY
            $guardsToday = Guard::with('brigade')->where('date', $date)->get();
            $excludedToday = $guardsToday->pluck('brigade.nombre')->unique()->toArray();

            // Brigadas que tienen guardia AYER
            $guardsYesterday = Guard::with('brigade')->where('date', $yesterday)->get();
            $excludedYesterday = $guardsYesterday->pluck('brigade.nombre')->unique()->toArray();

            // Combinamos ambas listas
            $excludedBrigades = array_merge($staticExcluded, $excludedToday, $excludedYesterday);
            Log::info("Brigadas excluidas (estáticas, hoy y ayer) en {$date}:", ['excludedBrigades' => $excludedBrigades]);

            // IDs no disponibles para HOY o AYER
            $unavailableFirefighterIds = $this->getFirefightersAssignedToExcludedBrigadesNoTodayAndYesterday($date, $yesterday, $excludedBrigades);

            // Aquí solo traemos users con puesto = 'Operador'
            $availableFirefighters = User::where('puesto', 'Operador')
                ->whereNotIn('id_empleado', $unavailableFirefighterIds)
                ->get();

            Log::info("Bomberos disponibles (No Today & Yesterday) obtenidos:", ['available_firefighters' => $availableFirefighters]);

            return response()->json([
                'date' => $date,
                'available_firefighters' => $availableFirefighters,
            ]);
        }

        private function getFirefightersAssignedToExcludedBrigadesNoTodayAndYesterday($date, $yesterday, $excludedBrigades)
        {
            Log::info("Fecha hoy: {$date}, fecha ayer: {$yesterday}, brigadas excluidas:", ['excludedBrigades' => $excludedBrigades]);

            $unavailableFirefighterIds = [];

            // Podemos definir un día posterior a HOY para isProtectedByRequests
            $tomorrow = date('Y-m-d', strtotime("$date +1 day"));

            // Asignaciones para HOY
            $assignmentsToday = Firefighters_assignment::where('fecha_ini', '<=', $date)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->get()
                ->groupBy('id_empleado');

            // Asignaciones para AYER
            $assignmentsYesterday = Firefighters_assignment::where('fecha_ini', '<=', $yesterday)
                ->orderBy('fecha_ini', 'desc')
                ->orderByRaw("FIELD(turno, 'Noche', 'Tarde', 'Mañana')")
                ->get()
                ->groupBy('id_empleado');

            // Bomberos que tienen asignaciones hoy o ayer
            $allFirefighterIds = $assignmentsToday->keys()
                ->merge($assignmentsYesterday->keys())
                ->unique();

            // Definimos los tipos sin turno
            $typesWithoutTurno = ['vacaciones', 'modulo', 'licencias por dias'];

            foreach ($allFirefighterIds as $firefighterId) {
                // Verificamos si está protegido (ayer, hoy y mañana)
                $isProtected = $this->isProtectedByRequests($firefighterId, $yesterday, $date, $tomorrow);
                Log::info("Bombero {$firefighterId} => isProtected: " . ($isProtected ? 'SÍ' : 'NO'));

                // 1) Última asignación HOY
                $lastAssignmentToday = $assignmentsToday[$firefighterId]->first() ?? null;
                if ($lastAssignmentToday && $lastAssignmentToday->brigadeDestination) {
                    $brigadeNameToday = $lastAssignmentToday->brigadeDestination->nombre;
                    Log::info("Bombero {$firefighterId} - Asignación HOY => brigada '{$brigadeNameToday}'.");

                    // Si la asignación es de un tipo sin turno, se excluye automáticamente
                    if (in_array(strtolower($brigadeNameToday), $typesWithoutTurno)) {
                        Log::info("Bombero {$firefighterId} EXCLUIDO automáticamente por asignación a '{$brigadeNameToday}' (tipo sin turno).");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue;
                    }

                    if (in_array($brigadeNameToday, $excludedBrigades)) {
                        Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameToday}' HOY y NO está protegido.");
                        $unavailableFirefighterIds[] = $firefighterId;
                        continue; // Excluido por hoy
                    } else {
                        Log::info("Bombero {$firefighterId} - brigada '{$brigadeNameToday}' HOY, pero NO se excluye (o está protegido).");
                    }
                } else {
                    // Sin asignación para HOY, lo excluimos
                    Log::info("Bombero {$firefighterId} SIN asignación para HOY ({$date}), EXCLUYENDO (NoTodayAndYesterday).");
                    $unavailableFirefighterIds[] = $firefighterId;
                    continue;
                }

                // 2) Última asignación AYER (solo si no se excluyó por hoy)
                $lastAssignmentYesterday = $assignmentsYesterday[$firefighterId]->first() ?? null;
                if ($lastAssignmentYesterday && $lastAssignmentYesterday->brigadeDestination) {
                    $brigadeNameYesterday = $lastAssignmentYesterday->brigadeDestination->nombre;
                    Log::info("Bombero {$firefighterId} - Asignación AYER => brigada '{$brigadeNameYesterday}'.");

                    if (in_array($brigadeNameYesterday, $excludedBrigades) && !$isProtected) {
                        Log::info("EXCLUYENDO a Bombero {$firefighterId} por brigada '{$brigadeNameYesterday}' AYER y NO está protegido.");
                        $unavailableFirefighterIds[] = $firefighterId;
                    } else {
                        Log::info("Bombero {$firefighterId} - brigada '{$brigadeNameYesterday}' AYER, pero NO se excluye (o está protegido).");
                    }
                }
                
            }

            $unavailableFirefighterIds = array_unique($unavailableFirefighterIds);
            Log::info("IDs de bomberos no disponibles (No Today & Yesterday + isProtected):", [
                'unavailableFirefighterIds' => $unavailableFirefighterIds
            ]);

            return $unavailableFirefighterIds;
        }
    }
