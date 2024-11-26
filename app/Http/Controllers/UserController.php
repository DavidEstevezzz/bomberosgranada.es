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
        'telefono' => 'required',
        'dni' => 'required',
        'role' => '|in:jefe,tropa,empleado',
        'puesto' => 'required_if:type,bombero,mando',
        'type' => 'required',
        'AP' => 'required_if:type,bombero,mando',
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

    // Inicializar reglas de validación
    $rules = [];

    // Si no se envía información para cambiar la contraseña, valida los demás campos
    if ($request->hasAny(['nombre', 'apellido', 'email', 'telefono', 'dni', 'puesto', 'type', 'AP'])) {
        $rules = [
            'nombre' => 'sometimes|required',
            'apellido' => 'sometimes|required',
            'email' => 'sometimes|required|email',
            'telefono' => 'sometimes|required',
            'dni' => 'sometimes|required',
            'puesto' => 'sometimes|required_if:type,bombero,mando',
            'type' => 'sometimes|required',
            'AP' => 'sometimes|required_if:type,bombero,mando',
        ];
    }

    // Validación específica para cambio de contraseña
    if ($request->has('current_password') || $request->has('password')) {
        $rules['current_password'] = 'required_with:password'; // La contraseña actual es obligatoria si se envía una nueva
        $rules['password'] = 'required_with:current_password|min:6|confirmed'; // Nueva contraseña debe ser confirmada
    }

    $validator = Validator::make($request->all(), $rules);

    if ($validator->fails()) {
        Log::error('Validation failed for user update', ['errors' => $validator->errors()->toArray()]);
        return response()->json($validator->errors(), 400);
    }

    try {
        $data = $request->all();

        // Si se envía una nueva contraseña, verificar la actual y actualizarla
        if ($request->has('current_password') && $request->has('password')) {
            // Registrar contraseñas para depuración (solo en desarrollo)
            Log::info('Comparando contraseñas para usuario', [
                'user_id' => $id->id_empleado,
                'current_password_input' => $request->input('current_password'),
                'hashed_password_stored' => $id->password
            ]);
        
            if (!Hash::check($request->input('current_password'), $id->password)) {
                Log::error('La contraseña actual no coincide para actualizar el usuario', [
                    'user_id' => $id->id_empleado,
                    'current_password_input' => $request->input('current_password'),
                    'hashed_password_stored' => $id->password
                ]);
                return response()->json(['error' => 'La contraseña actual no es correcta'], 403);
            }
        
        

            $data['password'] = bcrypt($request->input('password'));
        } else {
            unset($data['password']); // No actualizar contraseña si no se envía
        }

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
}
