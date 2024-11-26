<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class apiController extends Controller
{
    public function users(Request $request)
    {
        $users = User::all();

        return response()->json($users);
    }

    public function login(Request $request)
    {
        $data = json_decode($request->getContent(), true);

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response([
                'message' => ['These credentials do not match our records.']
            ], 404);
        }

        if(!password_verify($data['password'], $user->password)) {
            return response([
                'message' => ['These password do not match our records.']
            ], 404);
        }


        $token = $user->createToken($user->email . '-' . now());

        
        $response = [
            'user' => $user,
            'role' => $user->getRoleNames()->first(),
            'token' => $token->plainTextToken,
        ];

        return response($response, 201);
    }

    public function logout(Request $request)
    {
        // Revoque todos los tokens del usuario...
        $request->user()->tokens->each(function ($token, $key) {
            $token->delete();
        });

        return response()->json(['message' => 'Logged out successfully!'], 200);
    }
}
