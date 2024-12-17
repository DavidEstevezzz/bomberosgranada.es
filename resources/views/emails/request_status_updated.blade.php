<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estado de Solicitud Actualizado</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px;">
    <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; max-width: 600px; margin: auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #2c3e50;">¡Actualización de tu solicitud!</h2>
        <p>Hola, <strong>{{ $nombreUsuario }}</strong>,</p>
        <p>El estado de tu solicitud de tipo <strong>{{ $tipo }}</strong> ha sido actualizado a:</p>
        <p style="font-size: 18px; color: #3498db; font-weight: bold;">{{ $estado }}</p>
        <p>Fechas de la solicitud:</p>
        <ul>
            <li>Inicio: {{ $fechaIni }}</li>
            <li>Fin: {{ $fechaFin }}</li>
        </ul>
        <p>Por favor, revisa tu cuenta en la plataforma para más detalles.</p>
        <p>Gracias,</p>
        <p><strong>El equipo de soporte</strong></p>
    </div>
</body>
</html>
