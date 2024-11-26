<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Mail\ResetPasswordLinkMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class PasswordResetController extends Controller
{
    public function sendResetPasswordLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json(['error' => 'Email no encontrado'], 404);
        }

        $token = Str::random(64);

        DB::table('password_resets')->updateOrInsert(
            ['email' => $user->email],
            ['token' => $token, 'created_at' => Carbon::now()]
        );
        $frontendUrl = 'http://localhost:3000/reset-password'; // URL de tu frontend

        $resetUrl = $frontendUrl . '/' . $token;

        Log::info('Token generado y almacenado', ['token' => $token]);
        Log::info('URL generada para restablecer contraseña', ['reset_url' => $resetUrl]);

        Mail::to($user->email)->send(new ResetPasswordLinkMail($resetUrl));

        return response()->json(['message' => 'Correo enviado con el enlace para restablecer la contraseña.']);
    }

    public function resetPassword(Request $request)
    {
        Log::info('Datos recibidos para restablecer contraseña', $request->all()); // Agrega este log para inspección

        $request->validate([
            'token' => 'required',
            'password' => 'required|min:6|confirmed',
        ]);

        $reset = DB::table('password_resets')->where('token', $request->token)->first();

        if (!$reset || Carbon::parse($reset->created_at)->addMinutes(60)->isPast()) {
            Log::error('Token inválido o expirado', ['token' => $request->token]); // Log en caso de token inválido
            return response()->json(['error' => 'El token es inválido o ha expirado'], 400);
        }

        $user = User::where('email', $reset->email)->first();
        if (!$user) {
            Log::error('Usuario no encontrado', ['email' => $reset->email]); // Log en caso de email no encontrado
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        $user->password = bcrypt($request->password);
        $user->save();

        DB::table('password_resets')->where('email', $reset->email)->delete();

        return response()->json(['message' => 'Contraseña restablecida con éxito']);
    }
}
