<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Mensaje Recibido</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }

        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header {
            background-color: #4F8CFF;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }

        .header h1 {
            margin: 0;
            font-size: 22px;
        }

        .message-body {
            padding: 20px;
        }

        .message-body p {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 15px;
        }

        .message-body strong {
            font-weight: 600;
        }

        .footer {
            background-color: #f1f1f1;
            padding: 10px;
            border-radius: 0 0 8px 8px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }

        .footer a {
            color: #4F8CFF;
            text-decoration: none;
        }

        .btn {
            display: inline-block;
            background-color: #4F8CFF;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            font-weight: bold;
            border-radius: 5px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nuevo Mensaje Recibido</h1>
        </div>
        <div class="message-body">
            <p><strong>De:</strong> {{ $sender->nombre }} ({{ $sender->email }})</p>
            <p><strong>Asunto:</strong> {{ $messageData->subject }}</p>
            <p><strong>Mensaje:</strong></p>
            <p>{{ $messageData->body }}</p>

            @if($messageData->attachment)
                <p><strong>Adjunto:</strong> 
                    <a href="{{ asset('storage/' . $messageData->attachment) }}" class="text-blue-500">Descargar Archivo</a>
                </p>
            @endif

            <a href="{{ url('/messages') }}" class="btn">Ver Mensaje</a>
        </div>
        <div class="footer">
            <p>Este es un correo automático generado por el sistema. Si tienes alguna pregunta, no dudes en ponerte en contacto con nosotros.</p>
        </div>
    </div>
</body>
</html>
