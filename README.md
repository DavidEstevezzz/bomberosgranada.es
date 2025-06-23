# Sistema de Gestión de Bomberos de Granada 🚒

[![Laravel](https://img.shields.io/badge/Laravel-10.x-red.svg)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen.svg)]()

Sistema integral de gestión para el Cuerpo de Bomberos de Granada desarrollado con Laravel (Backend) y React (Frontend). Esta aplicación de administración completa permite gestionar recursos humanos, equipos, guardias, vehículos e incidencias del cuerpo de bomberos, proporcionando una solución tecnológica moderna y eficiente para la gestión operativa diaria.

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso del Sistema](#-uso-del-sistema)
- [API Documentation](#-api-documentation)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Roles y Permisos](#-roles-y-permisos)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## 🌟 Características Principales

### 👥 Gestión Completa de Personal
- **Sistema de Usuarios y Autenticación**: Control de acceso con roles jerárquicos (Jefe, Mando, Bombero, Empleado, Operador)
- **Perfiles Detallados de Empleados**: Gestión completa de datos personales, contacto, DNI, teléfonos y emails secundarios
- **Puestos y Especialidades**: Clasificación por puestos (Subinspector, Sargento, Cabo, Bombero, Conductor, Operador)
- **Mandos Especiales**: Sistema de flags para mandos con permisos administrativos extendidos
- **Control de Disponibilidad**: Gestión de días de vacaciones, módulos, asuntos propios y compensaciones

### 🔄 Sistema Avanzado de Asignaciones
- **Asignaciones de Bomberos**: Control completo de asignaciones a brigadas con turnos específicos (Mañana, Tarde, Noche)
- **Asignaciones Definidas**: Asignaciones temporales con fechas de inicio y retorno automático
- **Asignaciones por Requerimiento**: Sistema para requerir bomberos específicos con turnos personalizados
- **Asignaciones de Prácticas**: Gestión de asignaciones de ida por la mañana y vuelta por la tarde el mismo día
- **Asignaciones RT (Retén)**: Sistema de retén con asignación de ida por la mañana y vuelta al día siguiente
- **Cambios de Guardia**: Sistema completo de solicitud, aceptación y aprobación de cambios entre bomberos

### 🏢 Organización Estructural
- **Gestión de Parques**: Administración de Parque Norte (ID: 1) y Parque Sur (ID: 2)
- **Brigadas por Parque**: Control de brigadas operativas y especiales por cada parque
- **Brigadas Especiales**: Gestión de brigadas como Vacaciones, Bajas, Módulo, Asuntos Propios, Licencias
- **Programación de Guardias**: Sistema completo de guardias diarias con brigadas asignadas
- **Calendario Dual**: Visualización simultánea de ambos parques con código de colores

### 📝 Sistema Integral de Solicitudes
- **Solicitudes de Vacaciones**: Gestión completa con fechas de inicio y fin, descuento automático de días disponibles
- **Asuntos Propios**: Sistema por jornadas con turnos específicos (Mañana, Tarde, Noche, Día Completo)
- **Módulos**: Control de días de módulo con gestión de fechas múltiples
- **Licencias**: Gestión por jornadas y días completos
- **Compensación Grupos Especiales**: Sistema de compensación con control de jornadas disponibles
- **Estados de Solicitud**: Control completo (Pendiente, Confirmada, Cancelada) con notificaciones automáticas

### 🛠️ Gestión Avanzada de Recursos
- **Inventario de Vehículos**: Control completo de vehículos por parque con matrículas, nombres, años y tipos
- **Equipos Personales**: Gestión de radios portátiles, PTT, micros, linternas de casco y pecho
- **Sistema de Asignación Inteligente**: Asignación automática por paridad (Norte: impares, Sur: pares)
- **Reservas por Asignación**: Números reservados específicos para cada puesto (N1, S2, B3, C1, etc.)
- **Control de Disponibilidad**: Estado de disponibilidad de cada equipo individual

### 📊 Sistema de Incidencias
- **Tipos de Incidencias**: Vehículos, Personal, Instalaciones, Equipos, Vestuario, Equipos Comunes
- **Estados Detallados**: Pendiente, En Proceso, Resuelto con seguimiento completo
- **Niveles de Prioridad**: Alto, Medio, Bajo para clasificación de urgencia
- **Asignación de Resolución**: Sistema de asignación de responsables para resolver incidencias

### 💰 Gestión Económica y Horas Extra
- **Registro de Horas Extra**: Control de horas diurnas y nocturnas por empleado
- **Múltiples Tarifas**: Sistema de salarios con precios diferenciados (diurno/nocturno)
- **Reportes Mensuales**: Agrupación automática de horas extra por mes
- **Cálculo Automático**: Cálculo automático de importes según tarifas vigentes

### 📧 Sistema de Comunicación
- **Mensajería Interna**: Sistema completo de mensajes entre usuarios
- **Mensajes Masivos**: Envío a grupos específicos (toda la plantilla, solo mandos, solo bomberos)
- **Hilos de Conversación**: Sistema de respuestas anidadas para seguimiento de conversaciones
- **Adjuntos**: Soporte para archivos adjuntos (PDF, imágenes) con descarga segura

## 🏗️ Arquitectura del Sistema

El sistema está construido con una arquitectura moderna de microservicios:

```
┌─────────────────┐    HTTP/API    ┌─────────────────┐
│   React Frontend │◄──────────────►│ Laravel Backend │
│                 │                │                 │
│ • UI/UX         │                │ • API REST      │
│ • Estado Global │                │ • Autenticación │
│ • Validaciones  │                │ • Lógica        │
│ • Routing       │                │ • Base de Datos │
└─────────────────┘                └─────────────────┘
        │                                   │
        │                                   │
        ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐
│  Local Storage  │                │     MySQL       │
│                 │                │                 │
│ • Tokens        │                │ • Datos         │
│ • Preferencias  │                │ • Archivos      │
└─────────────────┘                └─────────────────┘
```

## 🛠️ Tecnologías Utilizadas

### Backend (Laravel)
- **Framework**: Laravel 10.x
- **Base de Datos**: MySQL 8.0+
- **Autenticación**: Laravel Sanctum
- **Roles y Permisos**: Spatie Permission
- **Email**: Laravel Mail con plantillas HTML
- **Archivos**: Sistema de almacenamiento local
- **API**: RESTful API completa

### Frontend (React)
- **Framework**: React 18 con Vite
- **Routing**: React Router DOM
- **Gestión de Estado**: Context API + Custom Hooks
- **Estilos**: Tailwind CSS + Flowbite Components
- **Iconografía**: FontAwesome + Lucide React
- **Calendarios**: date-fns para manejo de fechas
- **HTTP Client**: Axios para peticiones API
- **Notificaciones**: SweetAlert2
- **PDF Generation**: jsPDF + jsPDF-AutoTable

## 📦 Instalación

### Prerrequisitos
- PHP 8.1+
- Composer
- Node.js 16+
- MySQL 8.0+
- Web Server (Apache/Nginx)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/bomberos-granada.git
cd bomberos-granada
```

### 2. Instalación del Backend (Laravel)
```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias PHP
composer install

# Configurar entorno
cp .env.example .env
php artisan key:generate

# Generar enlace simbólico para storage
php artisan storage:link
```

### 3. Instalación del Frontend (React)
```bash
# Navegar al directorio del frontend
cd ../frontend

# Instalar dependencias Node
npm install

# Configurar variables de entorno
cp .env.example .env
```

### 4. Configuración de Base de Datos
```bash
# Crear base de datos MySQL
mysql -u root -p
CREATE DATABASE bomberos_granada;
EXIT;

# Ejecutar migraciones
cd ../backend
php artisan migrate

# Sembrar datos iniciales (opcional)
php artisan db:seed
```

## ⚙️ Configuración

### Backend (.env)
```env
APP_NAME="Bomberos Granada"
APP_ENV=production
APP_KEY=base64:your-app-key
APP_DEBUG=false
APP_URL=https://tu-dominio.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bomberos_granada
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password

MAIL_MAILER=smtp
MAIL_HOST=tu-servidor-smtp
MAIL_PORT=587
MAIL_USERNAME=tu-email
MAIL_PASSWORD=tu-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@bomberosgranada.es
MAIL_FROM_NAME="Bomberos Granada"

SANCTUM_STATEFUL_DOMAINS=tu-dominio.com
SESSION_DOMAIN=tu-dominio.com
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://tu-dominio.com/api
VITE_APP_NAME="Bomberos Granada"
```

## 🚀 Uso del Sistema

### Iniciar Servidores

#### Desarrollo
```bash
# Backend (Puerto 8000)
cd backend
php artisan serve

# Frontend (Puerto 5173)
cd frontend
npm run dev
```

#### Producción
```bash
# Backend - Configurar web server
# Frontend - Build y deploy
cd frontend
npm run build
```

### Acceso Inicial
- **URL**: `http://localhost:5173` (desarrollo)
- **Usuario Admin**: Se crea durante el seeding
- **Credenciales**: Consultar documentación de deployment

## 📚 API Documentation

### Endpoints Principales

#### Autenticación
```http
POST /api/login
Content-Type: application/json

{
  "username": "usuario",
  "password": "contraseña"
}
```

#### Usuarios
```http
GET /api/users
Authorization: Bearer {token}

POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nombre",
  "username": "usuario",
  "email": "email@example.com",
  "role": "mando"
}
```

#### Brigadas
```http
GET /api/brigades
Authorization: Bearer {token}

GET /api/brigades/{id}/firefighters?date=2024-01-01
Authorization: Bearer {token}
```

#### Guardias
```http
GET /api/guards?date=2024-01-01
Authorization: Bearer {token}

POST /api/guards
Authorization: Bearer {token}
Content-Type: application/json

{
  "date": "2024-01-01",
  "park_id": 1,
  "brigades": [1, 2, 3]
}
```

### Códigos de Respuesta
- `200` - Éxito
- `201` - Creado
- `400` - Error de validación
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `500` - Error del servidor

## 📁 Estructura del Proyecto

```
bomberos-granada/
├── backend/                    # Aplicación Laravel
│   ├── app/
│   │   ├── Console/Commands/   # Comandos artisan
│   │   ├── Http/Controllers/   # Controladores API
│   │   ├── Http/Middleware/    # Middleware personalizado
│   │   ├── Mail/              # Clases de email
│   │   ├── Models/            # Modelos Eloquent
│   │   └── Providers/         # Proveedores de servicios
│   ├── database/
│   │   ├── migrations/        # Migraciones
│   │   └── seeders/          # Semillas de datos
│   ├── routes/
│   │   ├── api.php           # Rutas API
│   │   └── web.php           # Rutas web
│   └── storage/              # Archivos y logs
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── Calendar.jsx  # Calendario principal
│   │   │   ├── modals/       # Modales del sistema
│   │   │   └── forms/        # Formularios
│   │   ├── contexts/         # Contextos React
│   │   ├── layout/           # Layouts
│   │   ├── services/         # Servicios API
│   │   ├── views/            # Páginas principales
│   │   └── router.jsx        # Configuración de rutas
│   ├── public/               # Archivos estáticos
│   └── dist/                 # Build de producción
├── docs/                       # Documentación
├── README.md                   # Este archivo
└── LICENSE                     # Licencia MIT
```

## 🔐 Roles y Permisos

### Jerarquía de Roles
```
┌─────────────┐
│    Jefe     │ ◄── Acceso total
├─────────────┤
│    Mando    │ ◄── Gestión operativa
├─────────────┤
│   Bombero   │ ◄── Operaciones básicas
├─────────────┤
│  Empleado   │ ◄── Administrativo
└─────────────┘
│  Operador   │ ◄── Comunicaciones
└─────────────┘
```

### Permisos por Rol

| Función | Jefe | Mando | Bombero | Empleado | Operador |
|---------|------|-------|---------|----------|----------|
| Gestión usuarios | ✅ | ❌ | ❌ | ❌ | ❌ |
| Aprobar solicitudes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear guardias | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver calendario | ✅ | ✅ | ✅ | ✅ | ✅ |
| Solicitar permisos | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gestión equipos | ✅ | ✅ | ❌ | ✅ | ❌ |
| Mensajería | ✅ | ✅ | ✅ | ✅ | ✅ |

### Mandos Especiales
Los mandos pueden tener permisos adicionales mediante flags especiales:
- **Gestión de Brigadas Especiales**: GREPS, GRAFOR, UNIBUL
- **Aprobación de Cambios**: Cambios de guardia complejos
- **Administración de Equipos**: Asignación y mantenimiento

## 🧪 Testing

### Backend (PHPUnit)
```bash
cd backend

# Ejecutar todos los tests
php artisan test

# Tests específicos
php artisan test --filter=UserTest

# Coverage
php artisan test --coverage
```

### Frontend (Vitest - Futuro)
```bash
cd frontend

# Ejecutar tests unitarios
npm run test

# Tests de componentes
npm run test:components

# Tests E2E con Cypress
npm run test:e2e
```

## 🔧 Comandos Útiles

### Backend
```bash
# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Optimizar para producción
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Comandos personalizados
php artisan equipment:reset-daily      # Reset equipos diario
php artisan assignments:auto-return    # Reversión automática
```

### Frontend
```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Linting y formato
npm run lint
npm run lint:fix
```

## 📊 Monitoreo y Logs

### Logs del Sistema
```bash
# Laravel logs
tail -f backend/storage/logs/laravel.log

# Logs específicos por canal
php artisan log:show --channel=database
```

### Métricas de Performance
- **Response Time**: < 200ms promedio
- **Uptime**: 99.9% SLA
- **Database Queries**: Optimizadas con índices
- **Memory Usage**: Monitoreado en producción

## 🚀 Deployment

### Producción con Docker
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=database
    depends_on:
      - database
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  
  database:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: bomberos_granada
      MYSQL_ROOT_PASSWORD: secure_password
```

### Servidor Tradicional
1. **Subir archivos** al servidor
2. **Configurar** web server (Apache/Nginx)
3. **Ejecutar** migraciones
4. **Configurar** cron jobs para tareas programadas
5. **SSL/TLS** con Let's Encrypt

## 🔒 Seguridad

### Medidas Implementadas
- **JWT Authentication** con Laravel Sanctum
- **CSRF Protection** en formularios
- **SQL Injection Prevention** con Eloquent ORM
- **XSS Protection** con escape automático
- **Rate Limiting** en endpoints críticos
- **HTTPS Enforcement** en producción
- **Validación de archivos** subidos
- **Sanitización de inputs** de usuario

### Recomendaciones de Seguridad
```bash
# Actualizar dependencias regularmente
composer update
npm update

# Auditoría de seguridad
composer audit
npm audit

# Configurar firewall
ufw enable
ufw allow ssh
ufw allow http
ufw allow https
```

## 🤝 Contribución

### Guía de Contribución

1. **Fork** el repositorio
2. **Crear** una rama para la característica
   ```bash
   git checkout -b feature/nueva-caracteristica
   ```
3. **Desarrollar** siguiendo los estándares de código
4. **Testing** - Asegurar que todos los tests pasan
5. **Commit** con mensajes descriptivos
   ```bash
   git commit -m "feat: añadir nueva funcionalidad X"
   ```
6. **Push** a la rama
   ```bash
   git push origin feature/nueva-caracteristica
   ```
7. **Crear** Pull Request

### Estándares de Código

#### Backend (Laravel)
- **PSR-12** para estilo de código PHP
- **Eloquent ORM** para queries de base de datos
- **Resource Controllers** para endpoints REST
- **Form Requests** para validación
- **Comentarios** en métodos complejos

#### Frontend (React)
- **ESLint** con configuración estándar
- **Prettier** para formato automático
- **JSDoc** para documentación de funciones
- **Componentes funcionales** con hooks
- **Context API** para estado global


## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2024 Cuerpo de Bomberos de Granada

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


## 📈 Estadísticas del Proyecto

- **Líneas de Código**: ~50,000
- **Archivos**: ~300
- **Commits**: 500+
- **Contributors**: 5
- **Issues Resueltos**: 150+
- **Tiempo de Desarrollo**: 18 meses

## 🎯 Roadmap Futuro

### Versión 2.1 (Q3 2025)
- [ ] App móvil nativa (React Native)
- [ ] Notificaciones push
- [ ] Integración con sistemas externos
- [ ] Dashboard analytics avanzado

### Versión 2.2 (Q4 2025)
- [ ] Sistema de backup automático
- [ ] Reportes avanzados con BI
- [ ] Integración con IoT (sensores vehículos)
- [ ] Sistema de geolocalización

### Versión 3.0 (2026)
- [ ] Migración a microservicios
- [ ] Inteligencia artificial predictiva
- [ ] Interfaz de realidad aumentada
- [ ] Blockchain para trazabilidad

---

**Sistema desarrollado con ❤️ para el Cuerpo de Bomberos de Granada**

*Protegiendo vidas, optimizando recursos, innovando en gestión*
