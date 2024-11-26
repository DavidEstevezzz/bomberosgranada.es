<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Validator;

class VehicleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $vehicles = Vehicle::all();

        return response()->json($vehicles);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $rules = [
            'matricula' => 'required',
            'id_parque' => 'required',
            'año' => 'required',
            'tipo' => 'required',
        ];

        $validator = Validator::make($request->input(), $rules);
        
        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $vehicle = Vehicle::create($request->all());
        $vehicle->save(); 
        return response()->json($vehicle, 201);

    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $id = Vehicle::find($id);

        return response()->json($id);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vehicle $id)
    {
        $request->validate([
            'matricula' => 'required',
            'id_parque' => 'required',
            'año' => 'required',
            'tipo' => 'required',
        ]);

        $id->update($request->all());

        return response()->json($id, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vehicle $id)
    {
        $id->delete();
    }
}
