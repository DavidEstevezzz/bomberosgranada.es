<?php

namespace App\Http\Controllers;

use App\Models\PersonalEquipment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
 * Verificar disponibilidad de un equipo por número
 * Esta función comprueba si los equipos como Portátil, PTT, Linterna casco y 
 * Linterna pecho están disponibles para el número específico
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