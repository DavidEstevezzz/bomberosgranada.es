<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Validator;

class VehicleController extends Controller
{
    public function index()
    {
        $vehicles = Vehicle::with('park')->get(); // Cargar relación con Park
        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        $rules = [
            'matricula' => 'required|unique:vehicles,matricula',
            'nombre'    => 'required|string',
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

    public function show(string $id)
    {
        $vehicle = Vehicle::with('park')->find($id);
        if (!$vehicle) {
            return response()->json(['error' => 'Vehículo no encontrado'], 404);
        }
        return response()->json($vehicle);
    }

    public function update(Request $request, string $matricula)
    {
        $vehicle = Vehicle::find($matricula);
        if (!$vehicle) {
            return response()->json(['error' => 'Vehículo no encontrado'], 404);
        }

        $rules = [
            'matricula' => 'required|unique:vehicles,matricula,'.$vehicle->matricula.',matricula',
            'nombre'    => 'required|string',
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

    public function destroy(string $matricula)
    {
        $vehicle = Vehicle::find($matricula);
        if (!$vehicle) {
            return response()->json(['error' => 'Vehículo no encontrado'], 404);
        }
        $vehicle->delete();
        return response()->json(null, 204);
    }
}
