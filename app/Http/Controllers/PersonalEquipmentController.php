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
        return view('equipos.index', compact('equipos'));
    }

    /**
     * Mostrar formulario para crear nuevo equipo
     */
    public function create()
    {
        $categorias = PersonalEquipment::getCategorias();
        return view('equipos.create', compact('categorias'));
    }

    /**
     * Almacenar un nuevo equipo
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => ['required', Rule::in(PersonalEquipment::getCategorias())]
        ]);

        PersonalEquipment::create($request->all());

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo personal creado correctamente.');
    }

    /**
     * Mostrar un equipo específico
     */
    public function show(PersonalEquipment $equipo)
    {
        return view('equipos.show', compact('equipo'));
    }

    /**
     * Mostrar formulario para editar equipo
     */
    public function edit(PersonalEquipment $equipo)
    {
        $categorias = PersonalEquipment::getCategorias();
        return view('equipos.edit', compact('equipo', 'categorias'));
    }

    /**
     * Actualizar un equipo específico
     */
    public function update(Request $request, PersonalEquipment $equipo)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => ['required', Rule::in(PersonalEquipment::getCategorias())]
        ]);

        $equipo->update($request->all());

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo personal actualizado correctamente.');
    }

    /**
     * Eliminar un equipo específico
     */
    public function destroy(PersonalEquipment $equipo)
    {
        $equipo->delete();

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo personal eliminado correctamente.');
    }
}