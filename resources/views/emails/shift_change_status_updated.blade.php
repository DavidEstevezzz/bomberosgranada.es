<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Actualización del Cambio de Guardia</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #2c3e50;">Actualización del Cambio de Guardia</h2>
        <p>Hola,</p>
        <p>El estado de la solicitud de cambio de guardia entre <strong>{{ $empleado1 }}</strong> y <strong>{{ $empleado2 }}</strong> ha sido actualizado a:</p>
        <p style="font-size: 18px; font-weight: bold; color: #3498db;">{{ $estado }}</p>
        <p><strong>Detalles:</strong></p>
        <ul>
            <li><strong>Fecha:</strong> {{ $fecha }}</li>
            <li><strong>Turno:</strong> {{ $turno }}</li>
        </ul>
        <p>Por favor, revisa la plataforma para más detalles.</p>
        <p>Gracias,<br> <strong>Equipo de Bomberos Granada</strong></p>
    </div>
</body>
</html>
