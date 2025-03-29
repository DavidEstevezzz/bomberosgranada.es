<?php

namespace App\Http\Controllers;

use App\Models\EquipoPersonal;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EquipoPersonalController extends Controller
{
    /**
     * Mostrar listado de equipos personales
     */
    public function index()
    {
        $equipos = EquipoPersonal::all();
        return view('equipos.index', compact('equipos'));
    }

    /**
     * Mostrar formulario para crear nuevo equipo
     */
    public function create()
    {
        $categorias = EquipoPersonal::getCategorias();
        return view('equipos.create', compact('categorias'));
    }

    /**
     * Almacenar un nuevo equipo
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => ['required', Rule::in(EquipoPersonal::getCategorias())]
        ]);

        EquipoPersonal::create($request->all());

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo personal creado correctamente.');
    }

    /**
     * Mostrar un equipo específico
     */
    public function show(EquipoPersonal $equipo)
    {
        return view('equipos.show', compact('equipo'));
    }

    /**
     * Mostrar formulario para editar equipo
     */
    public function edit(EquipoPersonal $equipo)
    {
        $categorias = EquipoPersonal::getCategorias();
        return view('equipos.edit', compact('equipo', 'categorias'));
    }

    /**
     * Actualizar un equipo específico
     */
    public function update(Request $request, EquipoPersonal $equipo)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => ['required', Rule::in(EquipoPersonal::getCategorias())]
        ]);

        $equipo->update($request->all());

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo personal actualizado correctamente.');
    }

    /**
     * Eliminar un equipo específico
     */
    public function destroy(EquipoPersonal $equipo)
    {
        $equipo->delete();

        return redirect()->route('equipos.index')
            ->with('success', 'Equipo personal eliminado correctamente.');
    }
}