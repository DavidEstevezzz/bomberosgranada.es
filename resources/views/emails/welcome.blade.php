<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a {{ config('app.name') }}</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Montserrat', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #748bab;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #f4f4f4;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            color: #2c3e50;
        }
        .content p {
            font-size: 16px;
            margin: 10px 0;
        }
        .content ul {
            list-style: none;
            padding: 0;
            margin: 10px 0;
        }
        .content ul li {
            background-color: #e9f7fe;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            font-weight: 600;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #7f8c8d;
        }
        .footer a {
            color: #3498db;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Bienvenido al equipo de bomberos de Granada!</h1>
        </div>
        <div class="content">
            <p>¡Hola, <strong>{{ $user->nombre }}</strong>!</p>
            <p>Tu cuenta ha sido creada exitosamente. Aquí están tus credenciales:</p>
            <ul>
                <li><strong>Email:</strong> {{ $user->email }}</li>
                <li><strong>Contraseña temporal:</strong> {{ $password }}</li>
            </ul>
            <p>Por favor, cambia tu contraseña en cuanto inicies sesión para proteger tu cuenta.</p>
        </div>
        <div class="footer">
            <p>Gracias,<br>El equipo de soporte</strong></p>
            <p>¿Tienes preguntas? Escríbenos a este correo</a>.</p>
        </div>
    </div>
</body>
</html>
