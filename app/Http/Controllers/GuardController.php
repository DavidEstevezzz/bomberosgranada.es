<?php

// App\Http\Controllers\GuardController.php

namespace App\Http\Controllers;

use App\Models\Guard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Models\Firefighters_assignment;
use App\Models\User;

class GuardController extends Controller
{
    public function index()
    {
        $guards = Guard::all();
        return response()->json($guards);
    }

    public function store(Request $request)
    {
        $rules = [
            'date'       => 'required|date',
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'id_salario' => 'exists:salaries,id_salario',
            'tipo'       => 'required|string',
            // Nuevos campos opcionales:
            'revision'              => 'sometimes|nullable|string',
            'practica'              => 'sometimes|nullable|string',
            'basura'                => 'sometimes|nullable|string',
            'anotaciones'           => 'sometimes|nullable|string',
            'incidencias_de_trafico'=> 'sometimes|nullable|string',
            'mando'                 => 'sometimes|nullable|string',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $guard = Guard::create($request->all());
        return response()->json($guard, 201);
    }

    public function show($id)
    {
        $guard = Guard::findOrFail($id);
        return response()->json($guard);
    }

    public function update(Request $request, $id)
    {
        $guard = Guard::findOrFail($id);
        $rules = [
            'date'       => 'sometimes|date',
            'id_brigada' => 'sometimes|exists:brigades,id_brigada',
            'id_salario' => 'sometimes|exists:salaries,id_salario',
            'tipo'       => 'sometimes|string',
            // Nuevos campos opcionales:
            'revision'              => 'sometimes|nullable|string',
            'practica'              => 'sometimes|nullable|string',
            'basura'                => 'sometimes|nullable|string',
            'anotaciones'           => 'sometimes|nullable|string',
            'incidencias_de_trafico'=> 'sometimes|nullable|string',
            'mando'                 => 'sometimes|nullable|string',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $guard->update($request->all());
        return response()->json($guard, 200);
    }
    

    public function destroy($id)
    {
        $guard = Guard::findOrFail($id);
        $guard->delete();
        return response()->json(null, 204);
    }

    public function getGuardsByBrigades(Request $request)
    {
        $brigades = $request->input('brigades');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Verificar si los parámetros están presentes
        if (!$brigades || !$startDate || !$endDate) {
            return response()->json(['error' => 'Missing parameters'], 400);
        }

        $brigadesArray = explode(',', $brigades);

        $guards = Guard::whereIn('id_brigada', $brigadesArray)
        ->whereBetween('date', [$startDate, $endDate])
        ->with('brigade:id_brigada,nombre') // Incluir la relación con la brigada para obtener el nombre
        ->with('salary') // Incluir datos del salario si es necesario
        ->get();

        return response()->json($guards);
    }

    public function getGuardsByDate(Request $request)
{
    // Validar que la fecha se haya enviado y sea una fecha válida
    $request->validate([
        'date' => 'required|date'
    ]);

    $date = $request->date;

    // Recuperar todas las guardias que coinciden con la fecha especificada
    $guards = Guard::where('date', $date)->with('brigade')->get();

    // Enviar respuesta con los datos de las guardias
    return response()->json($guards);
}

public function updateComments(Request $request)
{
    // Validar la entrada
    $request->validate([
        'id_brigada' => 'required|exists:guards,id_brigada',
        'date' => 'required|date',
        'comentarios' => 'required|string',
    ]);

    // Buscar la guardia por fecha y brigada
    $guard = Guard::where('id_brigada', $request->id_brigada)
                  ->where('date', $request->date)
                  ->first();

    if (!$guard) {
        return response()->json(['message' => 'Guardia no encontrada'], 404);
    }

    // Actualizar comentarios
    $guard->comentarios = $request->comentarios;
    $guard->save();

    return response()->json([
        'message' => 'Comentarios actualizados con éxito',
        'comentarios' => $guard->comentarios
    ], 200);
}


public function getGuardByBrigadeAndDate(Request $request)
{
    // Validar los parámetros
    $request->validate([
        'id_brigada' => 'required|exists:guards,id_brigada',
        'date' => 'required|date',
    ]);

    // Buscar la guardia por id_brigada y fecha
    $guard = Guard::where('id_brigada', $request->id_brigada)
                  ->where('date', $request->date)
                  ->first();

    if (!$guard) {
        return response()->json(['message' => 'Guardia no encontrada'], 404);
    }

    return response()->json([
        'comentarios' => $guard->comentarios,
        'guard' => $guard
    ], 200);
}

public function availableFirefighters(Request $request)
{
    return response()->json(['message' => 'Route accessed successfully']);
}

}

