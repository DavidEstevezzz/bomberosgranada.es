<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Extra_hour;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;  // Importar Rule para las validaciones avanzadas
use Illuminate\Support\Facades\Log;
use App\Models\Guard;

class Extra_hourController extends Controller
{
    // Obtener todos los registros
    public function index()
    {
        $extra_hours = Extra_hour::with('user', 'salarie')->get();
        return response()->json($extra_hours);
    }

    // Obtener un registro por id
    public function show($id)
    {
        $extra_hour = Extra_hour::find($id);

        if (!$extra_hour) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($extra_hour);
    }

    // Crear un nuevo registro
    public function store(Request $request)
    {
        // Log para registrar la solicitud recibida
        Log::info('Solicitud recibida para crear horas extra', [
            'data' => $request->all(),
        ]);

        // Definir las reglas de validación
        $rules = [
            'id_empleado' => 'required',
            'date' => 'required|date',
            'id_salario' => 'required|exists:salaries,id_salario',
            'horas_diurnas' => 'required|numeric',
            'horas_nocturnas' => 'required|numeric',
        ];

        // Ejecutar la validación y registrar el resultado
        Log::info('Iniciando la validación de los datos.');
        $validator = Validator::make($request->all(), $rules);

        // Si la validación falla, registrar el error y devolver la respuesta
        if ($validator->fails()) {
            Log::error('Error en la validación de los datos', [
                'errores' => $validator->errors(),
            ]);
            return response()->json($validator->errors(), 400);
        }

        // Log para confirmar que la validación ha sido exitosa
        Log::info('Validación exitosa. Creando registro en la base de datos.');

        // Crear el registro de horas extra
        $extra_hour = Extra_hour::create($request->all());

        // Log para verificar el registro creado
        Log::info('Registro creado exitosamente', [
            'extra_hour' => $extra_hour,
        ]);

        // Retornar la respuesta exitosa
        return response()->json($extra_hour, 201);
    }

    // Actualizar un registro
    public function update(Request $request, $id)
    {
        $rules = [
            'id_empleado'     => 'required|exists:users,id_empleado', // o la tabla que corresponda
            'date'            => 'required|date',
            'horas_diurnas'   => 'required|numeric',
            'horas_nocturnas' => 'required|numeric',
            'id_salario'      => 'required|exists:salaries,id_salario',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $extra_hour = Extra_hour::findOrFail($id);
        $extra_hour->update($request->all());
        return response()->json($extra_hour, 200);
    }

    // Eliminar un registro
    public function destroy($id)
    {
        $extra_hour = Extra_hour::find($id);

        if (!$extra_hour) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        $extra_hour->delete();
        return response()->json(null, 204);
    }

    // Obtener horas extras filtradas por mes y agrupadas por empleado
public function getExtraHoursByMonth(Request $request)
{
    // Se espera que el mes se reciba como query parameter, por ejemplo: /extra-hours-by-month?month=2025-03
    $month = $request->query('month');
    if (!$month) {
        return response()->json(['message' => 'El parámetro "month" es requerido. Formato esperado: YYYY-MM'], 400);
    }
    // Validar que el formato sea YYYY-MM
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        return response()->json(['message' => 'Formato de mes inválido. Se espera YYYY-MM.'], 400);
    }

    // Extraer año y mes
    $year = substr($month, 0, 4);
    $mon = substr($month, 5, 2);

    // Consultar las horas extras del mes indicado
    $extraHours = Extra_hour::with('user', 'salarie')
        ->whereYear('date', $year)
        ->whereMonth('date', $mon)
        ->get();

    // Agrupar y sumar las horas extras por empleado
    $grouped = [];
    foreach ($extraHours as $extra) {
        $employeeId = $extra->id_empleado;
        if (!isset($grouped[$employeeId])) {
            $grouped[$employeeId] = [
                'id_empleado'    => $employeeId,
                'nombre'         => $extra->user->nombre,
                'apellido'       => $extra->user->apellido,
                'horas_diurnas'  => $extra->horas_diurnas,
                'horas_nocturnas'=> $extra->horas_nocturnas,
                'total_salary'   => $extra->horas_diurnas * $extra->salarie->precio_diurno 
                                    + $extra->horas_nocturnas * $extra->salarie->precio_nocturno,
            ];
        } else {
            $grouped[$employeeId]['horas_diurnas'] += $extra->horas_diurnas;
            $grouped[$employeeId]['horas_nocturnas'] += $extra->horas_nocturnas;
            $grouped[$employeeId]['total_salary'] += $extra->horas_diurnas * $extra->salarie->precio_diurno 
                                                    + $extra->horas_nocturnas * $extra->salarie->precio_nocturno;
        }
    }

    return response()->json(array_values($grouped), 200);
}

}
