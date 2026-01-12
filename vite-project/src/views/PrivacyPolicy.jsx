import React from 'react';

const PrivacyPolicy = () => {
  const currentDate = new Date().toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Card principal */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
          
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-red-600 to-orange-500 px-8 py-10 text-white">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-center">
              Política de Privacidad
            </h1>
            <p className="text-center mt-2 text-red-100">
              Bomberos Granada - Aplicación de Gestión
            </p>
            <p className="text-center mt-4 text-sm text-red-200">
              Última actualización: {currentDate}
            </p>
          </div>

          {/* Contenido */}
          <div className="px-8 py-10 space-y-8">
            
            {/* Sección 1 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                Información General
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11">
                La aplicación <strong className="text-gray-800 dark:text-white">Bomberos Granada</strong> es una herramienta interna de gestión 
                desarrollada exclusivamente para el personal del Cuerpo de Bomberos de Granada. 
                Esta política describe cómo recopilamos, usamos y protegemos la información de 
                nuestros usuarios.
              </p>
            </section>

            {/* Sección 2 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                Responsable del Tratamiento
              </h2>
              <div className="pl-11 space-y-1">
                <p className="text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-800 dark:text-white">Organización:</strong> Cuerpo de Bomberos de Granada
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-800 dark:text-white">Ubicación:</strong> Granada, España
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-800 dark:text-white">Contacto:</strong> app@bomberosgranada.es
                </p>
              </div>
            </section>

            {/* Sección 3 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                Datos que Recopilamos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11 mb-3">
                Recopilamos únicamente los datos necesarios para la gestión operativa del servicio:
              </p>
              <ul className="pl-11 space-y-2">
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong className="text-gray-800 dark:text-white">Datos de identificación:</strong> Nombre, apellidos, DNI, número de empleado</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong className="text-gray-800 dark:text-white">Datos de contacto:</strong> Email institucional, email secundario, teléfono</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong className="text-gray-800 dark:text-white">Datos profesionales:</strong> Puesto, brigada asignada, parque de destino</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong className="text-gray-800 dark:text-white">Datos de gestión:</strong> Guardias, turnos, vacaciones, asuntos propios, horas sindicales</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong className="text-gray-800 dark:text-white">Comunicaciones internas:</strong> Mensajes y notificaciones dentro de la plataforma</span>
                </li>
              </ul>
            </section>

            {/* Sección 4 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                Finalidad del Tratamiento
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11 mb-3">
                Los datos recopilados se utilizan exclusivamente para:
              </p>
              <ul className="pl-11 space-y-2">
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Gestión de guardias y turnos de trabajo</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Administración de solicitudes de permisos y vacaciones</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Coordinación de cambios de guardia entre compañeros</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Comunicación interna entre el personal</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Gestión de requerimientos y asignaciones especiales</span>
                </li>
              </ul>
            </section>

            {/* Sección 5 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">5</span>
                Base Legal
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11">
                El tratamiento de datos se realiza en base a la relación laboral existente entre 
                el usuario y el Cuerpo de Bomberos de Granada, siendo necesario para el cumplimiento 
                de las obligaciones derivadas del contrato de trabajo y la gestión de recursos humanos.
              </p>
            </section>

            {/* Sección 6 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">6</span>
                Compartición de Datos
              </h2>
              <div className="pl-11 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-300 font-medium">
                  ✓ No compartimos datos personales con terceros.
                </p>
                <p className="text-green-700 dark:text-green-400 text-sm mt-2">
                  La información permanece exclusivamente dentro del sistema interno del Cuerpo de Bomberos 
                  de Granada y solo es accesible por personal autorizado según su nivel de permisos.
                </p>
              </div>
            </section>

            {/* Sección 7 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">7</span>
                Seguridad de los Datos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11 mb-3">
                Implementamos medidas técnicas y organizativas para proteger sus datos:
              </p>
              <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Autenticación segura (Sanctum)</span>
                </div>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Comunicaciones HTTPS</span>
                </div>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Contraseñas con bcrypt</span>
                </div>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Control de acceso por roles</span>
                </div>
              </div>
            </section>

            {/* Sección 8 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">8</span>
                Conservación de Datos
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11">
                Los datos se conservarán mientras dure la relación laboral con el Cuerpo de Bomberos 
                de Granada y, posteriormente, durante los plazos legalmente establecidos para el 
                cumplimiento de obligaciones legales.
              </p>
            </section>

            {/* Sección 9 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">9</span>
                Derechos del Usuario (RGPD)
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11 mb-3">
                De acuerdo con el Reglamento General de Protección de Datos, usted tiene derecho a:
              </p>
              <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="font-medium text-purple-800 dark:text-purple-300">Acceso</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Conocer qué datos tenemos sobre usted</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="font-medium text-purple-800 dark:text-purple-300">Rectificación</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Corregir datos inexactos</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="font-medium text-purple-800 dark:text-purple-300">Supresión</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Solicitar eliminación cuando proceda</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="font-medium text-purple-800 dark:text-purple-300">Portabilidad</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Recibir sus datos en formato estructurado</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 pl-11 mt-4">
                Para ejercer estos derechos, contacte con: <strong className="text-red-600">app@bomberosgranada.es</strong>
              </p>
            </section>

            {/* Sección 10 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">10</span>
                Aplicación Móvil
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11 mb-3">
                La aplicación móvil para Android:
              </p>
              <ul className="pl-11 space-y-2">
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Almacena el token de autenticación de forma segura en el dispositivo</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong>No accede</strong> a ubicación, cámara, micrófono ni otros sensores</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span><strong>No recopila</strong> datos de uso ni analíticas de terceros</span>
                </li>
                <li className="flex items-start text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Requiere conexión a internet únicamente para sincronizar con el servidor</span>
                </li>
              </ul>
            </section>

            {/* Sección 11 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">11</span>
                Cambios en la Política
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-11">
                Nos reservamos el derecho de modificar esta política de privacidad. Cualquier cambio 
                será notificado a través de la aplicación y se actualizará la fecha de última 
                modificación en este documento.
              </p>
            </section>

            {/* Sección 12 - Contacto */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center">
                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">12</span>
                Contacto
              </h2>
              <div className="pl-11 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-gray-600 dark:text-gray-300">
                  Para cualquier consulta relacionada con esta política de privacidad:
                </p>
                <div className="mt-3 space-y-2">
                  <p className="flex items-center text-gray-700 dark:text-gray-200">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <strong>Email:</strong>&nbsp;app@bomberosgranada.es
                  </p>
                  <p className="flex items-center text-gray-700 dark:text-gray-200">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                    </svg>
                    <strong>Organización:</strong>&nbsp;Cuerpo de Bomberos de Granada
                  </p>
                </div>
              </div>
            </section>

          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Bomberos Granada. Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* Botón volver */}
        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
            Volver a la aplicación
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;