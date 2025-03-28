<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Restablecimiento de contraseña</title>
  <style>
    body {
      background-color: #f4f4f7;
      font-family: 'Helvetica', 'Arial', sans-serif;
      color: #51545E;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 100%;
      padding: 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      max-width: 600px;
      margin: 40px auto;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    h1 {
      color: #333333;
      font-size: 24px;
      margin-bottom: 20px;
      text-align: center;
    }
    p {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background-color: #3869D4;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      text-align: center;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      font-size: 14px;
      color: #999999;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Restablecimiento de contraseña</h1>
      <p>Has recibido este correo porque se solicitó el restablecimiento de la contraseña de tu cuenta.</p>
      <p>Haz clic en el botón a continuación para restablecer tu contraseña:</p>
      <p style="text-align: center;">
        <a href="{{ $url }}" class="button">Restablecer contraseña</a>
      </p>
      <p>Este enlace expirará en 60 minutos.</p>
      <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
    </div>
    <div class="footer">
      <p>&copy; {{ date('Y') }} Bomberos GRX. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
