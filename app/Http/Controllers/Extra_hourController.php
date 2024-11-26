<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Extra_hour;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;  // Importar Rule para las validaciones avanzadas
use Illuminate\Support\Facades\log;

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
            'date' => [
                'required',
                'date',
                Rule::unique('guards')->where(function ($query) use ($request, $id) {
                    return $query->where('date', $request->date)
                                 ->where('id_brigada', $request->id_brigada)
                                 ->where('id', '<>', $id);
                }),
            ],
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'id_salario' => 'required|exists:salaries,id_salario',
            'tipo' => 'required|string',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $guard = Guard::findOrFail($id);
        $guard->update($request->all());
        return response()->json($guard, 200);
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
}
