<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Validator;

class VehicleController extends Controller
{
    /**
     * Muestra todos los vehículos.
     */
    public function index()
    {
        $vehicles = Vehicle::all();
        return response()->json($vehicles);
    }

    /**
     * Almacena un nuevo vehículo.
     */
    public function store(Request $request)
    {
        $rules = [
            'matricula' => 'required|unique:vehicles,matricula',
            'id_parque' => 'required',
            'año'       => 'required',
            'tipo'      => 'required',
        ];

        $validator = Validator::make($request->all(), $rules);
        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $vehicle = Vehicle::create($request->all());
        return response()->json($vehicle, 201);
    }

    /**
     * Muestra un vehículo específico.
     */
    public function show($matricula)
    {
        $vehicle = Vehicle::find($matricula);
        if (!$vehicle) {
            return response()->json(['error' => 'Vehículo no encontrado'], 404);
        }
        return response()->json($vehicle);
    }

    /**
     * Actualiza un vehículo existente.
     */
    public function update(Request $request, $matricula)
    {
        $vehicle = Vehicle::find($matricula);
        if (!$vehicle) {
            return response()->json(['error' => 'Vehículo no encontrado'], 404);
        }

        // Permite que la validación reconozca el valor actual de matricula
        $rules = [
            'matricula' => 'required|unique:vehicles,matricula,'.$vehicle->matricula.',matricula',
            'id_parque' => 'required',
            'año'       => 'required',
            'tipo'      => 'required',
        ];

        $validator = Validator::make($request->all(), $rules);
        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $vehicle->update($request->all());
        return response()->json($vehicle, 200);
    }

    /**
     * Elimina un vehículo.
     */
    public function destroy($matricula)
    {
        $vehicle = Vehicle::find($matricula);
        if (!$vehicle) {
            return response()->json(['error' => 'Vehículo no encontrado'], 404);
        }
        $vehicle->delete();
        return response()->json(null, 204);
    }
}
