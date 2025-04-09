<?php

namespace App\Http\Controllers;

use App\Models\BrigadeUser;
use App\Models\Brigade;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BrigadeUserController extends Controller
{
    /**
     * Mostrar todas las asignaciones de brigadas a usuarios
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $brigadeUsers = BrigadeUser::all();
        return response()->json($brigadeUsers);
    }

    /**
     * Crear una nueva asignación de brigada a usuario
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $rules = [
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'id_usuario' => 'required|exists:users,id_empleado',
            'practicas' => 'sometimes|nullable|integer|min:0'
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Verificar si la asignación ya existe
        $existingAssignment = BrigadeUser::where('id_brigada', $request->id_brigada)
                                      ->where('id_usuario', $request->id_usuario)
                                      ->first();

        if ($existingAssignment) {
            return response()->json([
                'message' => 'El usuario ya está asignado a esta brigada'
            ], 409); // 409 Conflict
        }

        $brigadeUser = BrigadeUser::create($request->all());
        return response()->json($brigadeUser, 201);
    }

    /**
     * Mostrar una asignación específica
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $brigadeUser = BrigadeUser::findOrFail($id);
        return response()->json($brigadeUser);
    }

    /**
     * Actualizar una asignación existente
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $rules = [
            'id_brigada' => 'sometimes|exists:brigades,id_brigada',
            'id_usuario' => 'sometimes|exists:users,id_empleado',
            'practicas' => 'sometimes|nullable|integer|min:0'
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $brigadeUser = BrigadeUser::findOrFail($id);
        $brigadeUser->update($request->all());

        return response()->json([
            'message' => 'Asignación actualizada',
            'brigadeUser' => $brigadeUser
        ]);
    }

    /**
     * Eliminar una asignación
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $brigadeUser = BrigadeUser::findOrFail($id);
        $brigadeUser->delete();
        return response()->json(null, 204);
    }

    /**
     * Obtener todos los usuarios asignados a una brigada específica
     *
     * @param  int  $brigadeId
     * @return \Illuminate\Http\Response
     */
    public function getUsersByBrigade($brigadeId)
    {
        // Verificar que la brigada existe
        $brigade = Brigade::find($brigadeId);
        if (!$brigade) {
            return response()->json(['message' => 'Brigada no encontrada'], 404);
        }

        // Obtener todos los usuarios relacionados con esta brigada
        $users = User::whereHas('brigadeUsers', function($query) use ($brigadeId) {
            $query->where('id_brigada', $brigadeId);
        })->get();

        // Alternativamente, podemos obtener los registros de la tabla pivot con información adicional
        $brigadeUsers = BrigadeUser::where('id_brigada', $brigadeId)
                                 ->with('user')
                                 ->get();

        return response()->json([
            'brigade' => $brigade->nombre,
            'users' => $users,
            'brigadeUsers' => $brigadeUsers
        ]);
    }

    /**
     * Obtener el número de prácticas para un empleado específico en relación a las brigadas
     *
     * @param  int  $employeeId
     * @return \Illuminate\Http\Response
     */
    public function getUserPracticas($employeeId)
    {
        // Verificar que el usuario existe
        $user = User::find($employeeId);
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // Obtener todas las asignaciones de brigada para este usuario con el valor de prácticas
        $brigadeUsers = BrigadeUser::where('id_usuario', $employeeId)
                                 ->with('brigade:id_brigada,nombre')
                                 ->get(['id_brigada', 'practicas']);

        // Calcular el total de prácticas
        $totalPracticas = $brigadeUsers->sum('practicas');

        return response()->json([
            'empleado' => [
                'id_empleado' => $user->id_empleado,
                'nombre' => $user->nombre,
                'apellido' => $user->apellido
            ],
            'brigadas' => $brigadeUsers,
            'total_practicas' => $totalPracticas
        ]);
    }

    /**
     * Actualizar el número de prácticas para una asignación específica
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updatePracticas(Request $request)
    {
        // Validar la entrada
        $request->validate([
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'id_usuario' => 'required|exists:users,id_empleado',
            'practicas' => 'required|integer|min:0'
        ]);

        // Buscar la asignación
        $brigadeUser = BrigadeUser::where('id_brigada', $request->id_brigada)
                                ->where('id_usuario', $request->id_usuario)
                                ->first();

        if (!$brigadeUser) {
            return response()->json(['message' => 'Asignación no encontrada'], 404);
        }

        // Actualizar el valor de prácticas
        $brigadeUser->practicas = $request->practicas;
        $brigadeUser->save();

        return response()->json([
            'message' => 'Prácticas actualizadas con éxito',
            'practicas' => $brigadeUser->practicas
        ], 200);
    }

    /**
     * Incrementar el contador de prácticas para una asignación específica
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function incrementPracticas(Request $request)
    {
        // Validar la entrada
        $request->validate([
            'id_brigada' => 'required|exists:brigades,id_brigada',
            'id_usuario' => 'required|exists:users,id_empleado',
            'increment' => 'required|integer|min:1'
        ]);

        // Buscar la asignación
        $brigadeUser = BrigadeUser::where('id_brigada', $request->id_brigada)
                                ->where('id_usuario', $request->id_usuario)
                                ->first();

        if (!$brigadeUser) {
            return response()->json(['message' => 'Asignación no encontrada'], 404);
        }

        // Incrementar el valor de prácticas
        $brigadeUser->practicas += $request->increment;
        $brigadeUser->save();

        return response()->json([
            'message' => 'Prácticas incrementadas con éxito',
            'practicas' => $brigadeUser->practicas
        ], 200);
    }
}