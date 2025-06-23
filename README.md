# Sistema de Gestión de Bomberos 🚒

Sistema integral de gestión para el Cuerpo de Bomberos de Granada desarrollado en Laravel. Esta aplicación permite la administración completa de recursos humanos, equipos, guardias, vehículos e incidencias del cuerpo de bomberos, proporcionando una solución tecnológica moderna y eficiente para la gestión operativa diaria.

## 📋 Características Principales

### 👥 Gestión Completa de Personal
- **Sistema de Usuarios y Autenticación**: Control de acceso con roles jerárquicos (Jefe, Mando, Bombero, Empleado, Operador)
- **Perfiles Detallados de Empleados**: Gestión completa de datos personales, contacto, DNI, teléfonos y emails secundarios
- **Puestos y Especialidades**: Clasificación por puestos (Subinspector, Sargento, Cabo, Bombero, Conductor, Operador)
- **Mandos Especiales**: Sistema de flags para mandos con permisos administrativos extendidos
- **Control de Disponibilidad**: Gestión de días de vacaciones, módulos, asuntos propios y compensaciones
- **Sistema de Prácticas**: Control de horas de prácticas por brigada para cada bombero
- **Traslados**: Registro y seguimiento de traslados entre diferentes destinos

### 🔄 Sistema Avanzado de Asignaciones
- **Asignaciones de Bomberos**: Control completo de asignaciones a brigadas con turnos específicos (Mañana, Tarde, Noche)
- **Asignaciones Definidas**: Asignaciones temporales con fechas de inicio y retorno automático
- **Asignaciones por Requerimiento**: Sistema para requerir bomberos específicos con turnos personalizados
- **Asignaciones de Prácticas**: Gestión de asignaciones de ida por la mañana y vuelta por la tarde el mismo día
- **Asignaciones RT (Retén)**: Sistema de retén con asignación de ida por la mañana y vuelta al día siguiente
- **Cambios de Guardia**: Sistema completo de solicitud, aceptación y aprobación de cambios entre bomberos
- **Cambios Espejo**: Intercambios de guardia entre dos fechas diferentes
- **Reversión Automática**: Sistema automático de reversión de asignaciones al cumplir fechas establecidas

### 🏢 Organización Estructural
- **Gestión de Parques**: Administración de Parque Norte (ID: 1) y Parque Sur (ID: 2)
- **Brigadas por Parque**: Control de brigadas operativas y especiales por cada parque
- **Brigadas Especiales**: Gestión de brigadas como Vacaciones, Bajas, Módulo, Asuntos Propios, Licencias
- **Programmación de Guardias**: Sistema completo de guardias diarias con brigadas asignadas
- **Asignaciones de Guardia**: Control detallado de personal asignado por turno en cada guardia
- **Registro de Intervenciones**: Documentación completa de intervenciones durante las guardias
- **Actividades Diarias**: Control de actividades como limpieza, ejercicios, callejero, repostaje

### 📝 Sistema Integral de Solicitudes
- **Solicitudes de Vacaciones**: Gestión completa con fechas de inicio y fin, descuento automático de días disponibles
- **Asuntos Propios**: Sistema por jornadas con turnos específicos (Mañana, Tarde, Noche, Día Completo, combinados)
- **Módulos**: Control de días de módulo con gestión de fechas múltiples
- **Licencias por Jornadas**: Sistema de licencias con control de turnos y jornadas
- **Licencias por Días**: Gestión de licencias por días completos
- **Compensación Grupos Especiales**: Sistema de compensación con control de jornadas disponibles
- **Horas Sindicales**: Gestión de horas sindicales con control de disponibilidad
- **Salidas Personales**: Control de horas de salidas personales
- **Vestuario**: Solicitudes de vestuario con items específicos
- **Estados de Solicitud**: Control completo (Pendiente, Confirmada, Cancelada) con notificaciones automáticas
- **Adjuntos en Solicitudes**: Sistema de carga de documentos de apoyo (PDF, imágenes)

### 🛠️ Gestión Avanzada de Recursos
- **Inventario de Vehículos**: Control completo de vehículos por parque con matrículas, nombres, años y tipos
- **Equipos Personales**: Gestión de radios portátiles, PTT, micros, linternas de casco y pecho
- **Sistema de Asignación Inteligente**: Asignación automática por paridad (Norte: impares, Sur: pares)
- **Reservas por Asignación**: Números reservados específicos para cada puesto (N1, S2, B3, C1, etc.)
- **Control de Disponibilidad**: Estado de disponibilidad de cada equipo individual
- **Asignaciones por Fecha**: Control histórico de asignaciones de equipos por fecha
- **Reseteo de Asignaciones**: Sistema de limpieza diaria de asignaciones de equipos
- **Categorías de Equipos**: Clasificación por categorías (Portátil, PTT, Micro, Linterna casco, Linterna pecho)
- **Vestuario**: Gestión de prendas de vestuario disponibles

### 📊 Sistema de Incidencias
- **Tipos de Incidencias**: Vehículos, Personal, Instalaciones, Equipos, Vestuario, Equipos Comunes
- **Estados Detallados**: Pendiente, En Proceso, Resuelto con seguimiento completo
- **Niveles de Prioridad**: Alto, Medio, Bajo para clasificación de urgencia
- **Asignación de Resolución**: Sistema de asignación de responsables para resolver incidencias
- **Seguimiento de Lectura**: Control de incidencias leídas por los responsables
- **Resolución Documentada**: Campo de resolución detallada con responsable asignado
- **Filtros por Parque**: Incidencias específicas por parque de origen
- **Notificaciones**: Sistema de conteo de incidencias pendientes

### 💰 Gestión Económica y Horas Extra
- **Registro de Horas Extra**: Control de horas diurnas y nocturnas por empleado
- **Múltiples Tarifas**: Sistema de salarios con precios diferenciados (diurno/nocturno)
- **Tipos de Salario**: Diferentes categorías de remuneración
- **Reportes Mensuales**: Agrupación automática de horas extra por mes
- **Cálculo Automático**: Cálculo automático de importes según tarifas vigentes
- **Histórico de Tarifas**: Control de fechas de vigencia de diferentes tarifas

### 📧 Sistema de Comunicación
- **Mensajería Interna**: Sistema completo de mensajes entre usuarios
- **Mensajes Masivos**: Envío a grupos específicos (toda la plantilla, solo mandos, solo bomberos)
- **Hilos de Conversación**: Sistema de respuestas anidadas para seguimiento de conversaciones
- **Adjuntos**: Soporte para archivos adjuntos (PDF, imágenes) con descarga segura
- **Control de Lectura**: Estado de lectura para mensajes individuales y masivos
- **Marcado Masivo**: Los jefes pueden marcar mensajes masivos como leídos para todos
- **Bandeja de Entrada y Salida**: Separación clara entre mensajes recibidos y enviados
- **Búsqueda de Mensajes**: Sistema de búsqueda en el contenido de mensajes
- **Eliminación Controlada**: Los jefes pueden eliminar cualquier mensaje, usuarios normales solo los propios

### 📄 Gestión de Documentación
- **Documentos PDF Oficiales**: Sistema de subida de documentos con versionado
- **Doble Documento**: Soporte para documento principal y secundario
- **Visualización Online**: Visualización directa de PDFs en el navegador
- **Descarga Controlada**: Sistema de descarga con nombres originales preservados
- **Reemplazo Automático**: Los nuevos documentos reemplazan automáticamente los anteriores
- **Control de Versiones**: Gestión de múltiples versiones de documentos oficiales

### 🔄 Cambios de Guardia Avanzados
- **Solicitudes de Cambio**: Sistema completo de solicitud entre bomberos
- **Estados de Aprobación**: Flujo completo (rechazado, aceptado por empleados, en trámite, aceptado)
- **Cambios Simples**: Intercambio de guardias en una fecha específica
- **Cambios Espejo**: Intercambio de guardias entre dos fechas diferentes
- **Turnos Específicos**: Control de turnos específicos en los cambios
- **Asignaciones Automáticas**: Creación automática de asignaciones al aprobar cambios
- **Notificaciones Email**: Notificaciones automáticas a ambos bomberos sobre cambios de estado

### 🎯 Sistema de Sugerencias
- **Creación de Sugerencias**: Los usuarios pueden crear sugerencias para mejoras
- **Sistema de Votación**: Votación única por usuario con control de duplicados
- **Conteo Automático**: Conteo automático de votos por sugerencia
- **Estados de Sugerencia**: Control de estados (pendiente, en revisión, implementada, rechazada)
- **Seguimiento**: Historial completo de votos y cambios de estado

### ⚙️ Configuración y Administración
- **Configuraciones del Sistema**: Sistema de configuraciones personalizables
- **Restablecimiento de Contraseñas**: Sistema seguro de reset de contraseñas vía email
- **Logs Detallados**: Sistema completo de logging para auditoría y debugging
- **Middleware de Seguridad**: Control de acceso por roles y permisos especiales
- **Validaciones Extensivas**: Validación completa en todas las operaciones CRUD

## 🛠️ Tecnologías Utilizadas

- **Framework**: Laravel 10.x
- **Base de Datos**: MySQL
- **Autenticación**: Laravel Sanctum
- **Roles y Permisos**: Spatie Permission
- **Email**: Laravel Mail con plantillas HTML
- **Archivos**: Sistema de almacenamiento local
- **API**: RESTful API completa

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/bomberos-granada.git
cd bomberos-granada
```

2. **Instalar dependencias**
```bash
composer install
```

3. **Configurar entorno**
```bash
cp .env.example .env
php artisan key:generate
```

4. **Configurar base de datos**
Editar `.env` con los datos de tu base de datos:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bomberos_granada
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
```

5. **Ejecutar migraciones**
```bash
php artisan migrate
```

6. **Sembrar datos iniciales**
```bash
php artisan db:seed
```

7. **Crear enlace simbólico para storage**
```bash
php artisan storage:link
```

8. **Iniciar el servidor**
```bash
php artisan serve
```

La aplicación estará disponible en `http://localhost:8000`

## 🚀 Uso



### API Endpoints Principales

#### Autenticación
- `POST /api/login` - Inicio de sesión
- `POST /api/logout` - Cerrar sesión
- `POST /api/reset-password` - Restablecer contraseña

#### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `PUT /api/users/{id}` - Actualizar usuario

#### Brigadas
- `GET /api/brigades` - Listar brigadas
- `GET /api/brigades/{id}/firefighters` - Bomberos por brigada y fecha

#### Asignaciones
- `GET /api/firefighters-assignments` - Listar asignaciones
- `POST /api/firefighters-assignments` - Crear asignación
- `POST /api/firefighters-assignments/require` - Requerir bombero

#### Guardias
- `GET /api/guards` - Listar guardias
- `POST /api/guards` - Crear guardia
- `GET /api/guards/date` - Guardias por fecha

#### Solicitudes
- `GET /api/requests` - Listar solicitudes
- `POST /api/requests` - Crear solicitud
- `PUT /api/requests/{id}` - Actualizar estado

#### Equipos
- `GET /api/personal-equipment` - Listar equipos
- `POST /api/personal-equipment/check-assign` - Verificar y asignar equipos

## 🔐 Roles y Permisos

### Roles Disponibles
- **Jefe**: Acceso completo al sistema
- **Mando**: Gestión de guardias y asignaciones
- **Tropa**: Bomberos con acceso limitado
- **Empleado**: Personal administrativo

### Permisos Especiales
- **Mando Especial**: Flag adicional para mandos con permisos extendidos

## 📧 Configuración de Email

Configurar SMTP en `.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=tu-servidor-smtp
MAIL_PORT=587
MAIL_USERNAME=tu-email
MAIL_PASSWORD=tu-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@bomberosgranada.es
MAIL_FROM_NAME="Bomberos Granada"
```

## 🔒 Seguridad

- Autenticación mediante tokens Sanctum
- Middleware de verificación de roles
- Validación exhaustiva en todas las entradas
- Protección CSRF
- Sanitización de archivos subidos

## 📁 Estructura del Proyecto

```
app/
├── Console/Commands/          # Comandos artisan personalizados
├── Http/Controllers/          # Controladores de la API
├── Http/Middleware/           # Middleware personalizado
├── Mail/                      # Clases de email
├── Models/                    # Modelos Eloquent
└── Providers/                 # Proveedores de servicios

database/
├── migrations/                # Migraciones de base de datos
└── seeders/                   # Semillas de datos

storage/
├── app/                       # Archivos de aplicación
└── shared/                    # Archivos compartidos
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para la característica (`git checkout -b feature/nueva-caracteristica`)
3. Commit los cambios (`git commit -am 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear un Pull Request


## 🙏 Agradecimientos

- Cuerpo de Bomberos de Granada
- Equipo de UGR
- Comunidad Laravel

---

**Desarrollado con ❤️ para el Cuerpo de Bomberos de Granada**
