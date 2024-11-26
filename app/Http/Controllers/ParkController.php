<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Park;

class ParkController extends Controller
{
    public function index()
    {
        return Park::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_parque' => 'required|string|max:25|unique:parks',
            'nombre' => 'required|string|max:255',
            'ubicacion' => 'required|string|max:255',
            'telefono' => 'required|string|max:255',
        ]);

        $park = Park::create($validated);

        return response()->json($park, 201);
    }

    public function show($id_parque)
    {
        $park = Park::findOrFail($id_parque);
        return response()->json($park);
    }

    public function update(Request $request, $id_parque)
    {
        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'ubicacion' => 'sometimes|required|string|max:255',
            'telefono' => 'sometimes|required|string|max:255',
        ]);

        $park = Park::findOrFail($id_parque);
        $park->update($validated);

        return response()->json($park);
    }

    public function destroy($id_parque)
    {
        $park = Park::findOrFail($id_parque);
        $park->delete();

        return response()->json(null, 204);
    }
}
