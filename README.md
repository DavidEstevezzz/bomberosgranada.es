Sistema de Gestión de Bomberos 🚒
Sistema integral de gestión para el Cuerpo de Bomberos de Granada desarrollado en Laravel. Esta aplicación permite la administración completa de recursos humanos, equipos, guardias, vehículos e incidencias del cuerpo de bomberos, proporcionando una solución tecnológica moderna y eficiente para la gestión operativa diaria.
📋 Características Principales
👥 Gestión Completa de Personal

Sistema de Usuarios y Autenticación: Control de acceso con roles jerárquicos (Jefe, Mando, Bombero, Empleado, Operador)
Perfiles Detallados de Empleados: Gestión completa de datos personales, contacto, DNI, teléfonos y emails secundarios
Puestos y Especialidades: Clasificación por puestos (Subinspector, Sargento, Cabo, Bombero, Conductor, Operador)
Mandos Especiales: Sistema de flags para mandos con permisos administrativos extendidos
Control de Disponibilidad: Gestión de días de vacaciones, módulos, asuntos propios y compensaciones
Sistema de Prácticas: Control de horas de prácticas por brigada para cada bombero
Traslados: Registro y seguimiento de traslados entre diferentes destinos

🔄 Sistema Avanzado de Asignaciones

Asignaciones de Bomberos: Control completo de asignaciones a brigadas con turnos específicos (Mañana, Tarde, Noche)
Asignaciones Definidas: Asignaciones temporales con fechas de inicio y retorno automático
Asignaciones por Requerimiento: Sistema para requerir bomberos específicos con turnos personalizados
Asignaciones de Prácticas: Gestión de asignaciones de ida por la mañana y vuelta por la tarde el mismo día
Asignaciones RT (Retén): Sistema de retén con asignación de ida por la mañana y vuelta al día siguiente
Cambios de Guardia: Sistema completo de solicitud, aceptación y aprobación de cambios entre bomberos
Cambios Espejo: Intercambios de guardia entre dos fechas diferentes
Reversión Automática: Sistema automático de reversión de asignaciones al cumplir fechas establecidas

🏢 Organización Estructural

Gestión de Parques: Administración de Parque Norte (ID: 1) y Parque Sur (ID: 2)
Brigadas por Parque: Control de brigadas operativas y especiales por cada parque
Brigadas Especiales: Gestión de brigadas como Vacaciones, Bajas, Módulo, Asuntos Propios, Licencias
Programmación de Guardias: Sistema completo de guardias diarias con brigadas asignadas
Asignaciones de Guardia: Control detallado de personal asignado por turno en cada guardia
Registro de Intervenciones: Documentación completa de intervenciones durante las guardias
Actividades Diarias: Control de actividades como limpieza, ejercicios, callejero, repostaje

📝 Sistema Integral de Solicitudes

Solicitudes de Vacaciones: Gestión completa con fechas de inicio y fin, descuento automático de días disponibles
Asuntos Propios: Sistema por jornadas con turnos específicos (Mañana, Tarde, Noche, Día Completo, combinados)
Módulos: Control de días de módulo con gestión de fechas múltiples
Licencias por Jornadas: Sistema de licencias con control de turnos y jornadas
Licencias por Días: Gestión de licencias por días completos
Compensación Grupos Especiales: Sistema de compensación con control de jornadas disponibles
Horas Sindicales: Gestión de horas sindicales con control de disponibilidad
Salidas Personales: Control de horas de salidas personales
Vestuario: Solicitudes de vestuario con items específicos
Estados de Solicitud: Control completo (Pendiente, Confirmada, Cancelada) con notificaciones automáticas
Adjuntos en Solicitudes: Sistema de carga de documentos de apoyo (PDF, imágenes)

🛠️ Gestión Avanzada de Recursos

Inventario de Vehículos: Control completo de vehículos por parque con matrículas, nombres, años y tipos
Equipos Personales: Gestión de radios portátiles, PTT, micros, linternas de casco y pecho
Sistema de Asignación Inteligente: Asignación automática por paridad (Norte: impares, Sur: pares)
Reservas por Asignación: Números reservados específicos para cada puesto (N1, S2, B3, C1, etc.)
Control de Disponibilidad: Estado de disponibilidad de cada equipo individual
Asignaciones por Fecha: Control histórico de asignaciones de equipos por fecha
Reseteo de Asignaciones: Sistema de limpieza diaria de asignaciones de equipos
Categorías de Equipos: Clasificación por categorías (Portátil, PTT, Micro, Linterna casco, Linterna pecho)
Vestuario: Gestión de prendas de vestuario disponibles

📊 Sistema de Incidencias

Tipos de Incidencias: Vehículos, Personal, Instalaciones, Equipos, Vestuario, Equipos Comunes
Estados Detallados: Pendiente, En Proceso, Resuelto con seguimiento completo
Niveles de Prioridad: Alto, Medio, Bajo para clasificación de urgencia
Asignación de Resolución: Sistema de asignación de responsables para resolver incidencias
Seguimiento de Lectura: Control de incidencias leídas por los responsables
Resolución Documentada: Campo de resolución detallada con responsable asignado
Filtros por Parque: Incidencias específicas por parque de origen
Notificaciones: Sistema de conteo de incidencias pendientes

💰 Gestión Económica y Horas Extra

Registro de Horas Extra: Control de horas diurnas y nocturnas por empleado
Múltiples Tarifas: Sistema de salarios con precios diferenciados (diurno/nocturno)
Tipos de Salario: Diferentes categorías de remuneración
Reportes Mensuales: Agrupación automática de horas extra por mes
Cálculo Automático: Cálculo automático de importes según tarifas vigentes
Histórico de Tarifas: Control de fechas de vigencia de diferentes tarifas

📧 Sistema de Comunicación

Mensajería Interna: Sistema completo de mensajes entre usuarios
Mensajes Masivos: Envío a grupos específicos (toda la plantilla, solo mandos, solo bomberos)
Hilos de Conversación: Sistema de respuestas anidadas para seguimiento de conversaciones
Adjuntos: Soporte para archivos adjuntos (PDF, imágenes) con descarga segura
Control de Lectura: Estado de lectura para mensajes individuales y masivos
Marcado Masivo: Los jefes pueden marcar mensajes masivos como leídos para todos
Bandeja de Entrada y Salida: Separación clara entre mensajes recibidos y enviados
Búsqueda de Mensajes: Sistema de búsqueda en el contenido de mensajes
Eliminación Controlada: Los jefes pueden eliminar cualquier mensaje, usuarios normales solo los propios

📄 Gestión de Documentación

Documentos PDF Oficiales: Sistema de subida de documentos con versionado
Doble Documento: Soporte para documento principal y secundario
Visualización Online: Visualización directa de PDFs en el navegador
Descarga Controlada: Sistema de descarga con nombres originales preservados
Reemplazo Automático: Los nuevos documentos reemplazan automáticamente los anteriores
Control de Versiones: Gestión de múltiples versiones de documentos oficiales

🔄 Cambios de Guardia Avanzados

Solicitudes de Cambio: Sistema completo de solicitud entre bomberos
Estados de Aprobación: Flujo completo (rechazado, aceptado por empleados, en trámite, aceptado)
Cambios Simples: Intercambio de guardias en una fecha específica
Cambios Espejo: Intercambio de guardias entre dos fechas diferentes
Turnos Específicos: Control de turnos específicos en los cambios
Asignaciones Automáticas: Creación automática de asignaciones al aprobar cambios
Notificaciones Email: Notificaciones automáticas a ambos bomberos sobre cambios de estado

🎯 Sistema de Sugerencias

Creación de Sugerencias: Los usuarios pueden crear sugerencias para mejoras
Sistema de Votación: Votación única por usuario con control de duplicados
Conteo Automático: Conteo automático de votos por sugerencia
Estados de Sugerencia: Control de estados (pendiente, en revisión, implementada, rechazada)
Seguimiento: Historial completo de votos y cambios de estado

⚙️ Configuración y Administración

Configuraciones del Sistema: Sistema de configuraciones personalizables
Restablecimiento de Contraseñas: Sistema seguro de reset de contraseñas vía email
Logs Detallados: Sistema completo de logging para auditoría y debugging
Middleware de Seguridad: Control de acceso por roles y permisos especiales
Validaciones Extensivas: Validación completa en todas las operaciones CRUD

🛠️ Tecnologías Utilizadas

Framework: Laravel 10.x
Base de Datos: MySQL
Autenticación: Laravel Sanctum
Roles y Permisos: Spatie Permission
Email: Laravel Mail con plantillas HTML
Archivos: Sistema de almacenamiento local
API: RESTful API completa
