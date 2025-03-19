<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Mail\WelcomeMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Permission\Models\Role;



class UserController extends Controller
{
    //     public function __construct()
    // {
    //     $this->middleware('role:Jefe')->only(['index', 'store', 'show', 'update', 'destroy']);
    // }

    public function index()
    {
        $users = User::with('roles')->get();
        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */

    public function store(Request $request)
    {
        Log::info('Request received for user creation', ['request_data' => $request->all()]);

        $rules = [
            'nombre' => 'required',
            'apellido' => 'required',
            'email' => 'required|email|unique:users,email',
            'email2' => 'nullable|email|max:64',
            'telefono' => 'required',
            'dni' => 'required',
            'role' => '|in:jefe,tropa,empleado',
            'puesto' => 'required_if:type,bombero,mando',
            'type' => 'required',
            'AP' => 'required_if:type,bombero,mando',
            'vacaciones' => 'required',
            'modulo' => 'required',

        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            Log::error('Validation failed for user creation', ['errors' => $validator->errors()->toArray()]);
            return response()->json($validator->errors(), 400);
        }

        try {
            $data = $request->all();

            // Generar una contraseña aleatoria
            $plainPassword = Str::random(10);

            // Encriptar la contraseña para almacenarla
            $data['password'] = bcrypt($plainPassword);

            Log::info('Creating user with data', ['data' => $data]);

            $user = User::create($data);

            if ($user) {

                Log::info('User created successfully', ['user_id' => $user->id_empleado]);

                $role = $request->input('type') === 'bombero' ? 'tropa' : $request->input('type');
                $user->assignRole($role);

                // Enviar el correo con la contraseña aleatoria
                Mail::to($user->email)->send(new WelcomeMail($user, $plainPassword));

                return response()->json($user, 201);
            } else {
                throw new \Exception('User creation failed');
            }
        } catch (\Exception $e) {
            Log::error('Error creating user', ['message' => $e->getMessage(), 'stack' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $id)
    {
        Log::info('Request received for user update', ['request_data' => $request->all()]);

        $user = Auth::user(); // Usuario autenticado

        // Permitir que cualquier usuario cambie su contraseña
        if ($request->has('current_password') || $request->has('password')) {
            // Validación específica para cambio de contraseña
            $rules = [
                'current_password' => 'required_with:password', // La contraseña actual es obligatoria si se envía una nueva
                'password' => 'required_with:current_password|min:6|confirmed', // Nueva contraseña debe ser confirmada
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                Log::error('Validation failed for password update', ['errors' => $validator->errors()->toArray()]);
                return response()->json($validator->errors(), 400);
            }

            if (!Hash::check($request->input('current_password'), $id->password)) {
                Log::error('La contraseña actual no coincide para actualizar el usuario', [
                    'user_id' => $id->id_empleado,
                    'current_password_input' => $request->input('current_password'),
                    'hashed_password_stored' => $id->password
                ]);
                return response()->json(['error' => 'La contraseña actual no es correcta'], 403);
            }

            // Actualizar la contraseña
            $id->update(['password' => bcrypt($request->input('password'))]);

            Log::info('Password updated successfully', ['user_id' => $id->id_empleado]);
            return response()->json(['message' => 'Contraseña actualizada con éxito'], 200);
        }

        // Verificar que el usuario autenticado sea un jefe
        if (!$user->hasRole('Jefe')) {
            Log::error('Acceso denegado para actualizar información', [
                'auth_user_id' => $user->id_empleado,
                'target_user_id' => $id->id_empleado,
            ]);
            return response()->json(['error' => 'No tienes permisos para editar esta información'], 403);
        }

        // Validaciones para otros campos
        $rules = [
            'nombre' => 'sometimes|required',
            'apellido' => 'sometimes|required',
            'email' => 'sometimes|required|email',
            'email2' => 'nullable|email|max:64',
            'telefono' => 'sometimes|required',
            'dni' => 'sometimes|required',
            'puesto' => 'sometimes|required_if:type,bombero,mando',
            'type' => 'sometimes|required',
            'AP' => 'sometimes|required_if:type,bombero,mando',
            'vacaciones' => 'sometimes|required',
            'modulo' => 'sometimes|required',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            Log::error('Validation failed for user update', ['errors' => $validator->errors()->toArray()]);
            return response()->json($validator->errors(), 400);
        }

        try {
            $data = $request->all();

            Log::info('Updating user', ['user_id' => $id->id_empleado, 'data' => $data]);

            // Actualizar datos del usuario
            $id->update($data);

            // Actualizar roles solo si el campo "type" está presente en la solicitud
            if ($request->has('type')) {
                $role = $request->input('type') === 'bombero' ? 'tropa' : $request->input('type');
                $id->syncRoles([$role]);
                Log::info('Role assigned to user', ['user_id' => $id->id_empleado, 'role' => $role]);
            }

            return response()->json($id, 200);
        } catch (\Exception $e) {
            Log::error('Error updating user', ['message' => $e->getMessage(), 'stack' => $e->getTraceAsString()]);
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }


    public function getUsersByPuesto(Request $request)
    {
        $puesto = $request->query('puesto'); // Obtener el puesto desde la query string

        if (!$puesto) {
            return response()->json(['error' => 'El parámetro puesto es obligatorio.'], 400);
        }

        $users = User::where('puesto', $puesto)->get();

        return response()->json($users);
    }


    public function updateAP(Request $request, $id)
    {
        $validatedData = $request->validate([
            'AP' => 'required|integer|min:0',
        ]);

        $user = User::findOrFail($id);
        $user->AP = $validatedData['AP'];
        $user->save();

        return response()->json($user, 200);
    }



    public function updateUserField(Request $request, $id, $field)
    {
        // Lista blanca de campos permitidos (excluimos 'AP' para mantener la función updateAP)
        $allowedFields = [
            'nombre',
            'email',
            'apellido',
            'dni',
            'telefono',
            'password',
            'type',
            'puesto',
            'email2',
            'vacaciones',
            'modulo',
            'compensacion_grupos',
            'horas_sindicales',
        ];

        if (!in_array($field, $allowedFields)) {
            return response()->json(['error' => 'Campo no permitido.'], 400);
        }

        // Reglas de validación específicas para cada campo
        $rules = [
            'nombre'               => 'required|string|max:255',
            'email'                => 'required|email|max:255',
            'apellido'             => 'required|string|max:255',
            'dni'                  => 'required|string|max:255',
            'telefono'             => 'required|string|max:255',
            'password'             => 'required|string|min:6',
            'type'                 => 'required|string',
            'puesto'               => 'required|string',
            'email2'               => 'nullable|email|max:64',
            'vacaciones'           => 'required|integer|min:0',
            'modulo'               => 'required|string|max:255',
            'compensacion_grupos'  => 'required|integer|min:0',
        ];

        // Validamos solo el campo que se desea actualizar
        $validatedData = $request->validate([
            $field => $rules[$field],
        ]);

        $user = User::findOrFail($id);
        $user->{$field} = $validatedData[$field];
        $user->save();

        return response()->json($user, 200);
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $id)
    {
        $id->delete();

        return response()->json(null, 204);
    }

    public function getUserByToken(Request $request)
    {
        $usuario = Auth::user();
        return response()->json($usuario);
    }

    public function updateTraslado(Request $request, $id)
{
    // Validamos que se envíe el campo "traslado" como entero
    $validatedData = $request->validate([
        'traslado' => 'required|integer'
    ]);

    // Buscamos el usuario o lanzamos un error 404
    $user = User::findOrFail($id);

    // Actualizamos el campo traslado (tipo int)
    $user->traslado = $validatedData['traslado'];
    $user->save();

    return response()->json($user, 200);
}

}
