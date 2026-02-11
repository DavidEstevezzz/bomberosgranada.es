import axios from 'axios';

class BaseApiService {
    constructor() {
        this.axiosInstance = axios.create();
        this.setupInterceptors();
    }

    setupInterceptors() {
        // Interceptor de respuestas para manejar errores globalmente
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    const status = error.response.status;
                    
                    // Rate limit excedido - NO expulsar al usuario
                    if (status === 429) {
                        console.warn('Rate limit excedido. Esperando antes de reintentar...');
                        // Opcional: mostrar notificación al usuario
                        // No lanzamos el error para evitar que se trate como error de auth
                        return Promise.reject({
                            ...error,
                            isRateLimited: true,
                            message: 'Demasiadas solicitudes. Por favor, espera un momento.'
                        });
                    }
                    
                    // Error de autenticación real
                    if (status === 401) {
                        // Solo aquí limpiamos el token
                        const token = localStorage.getItem('token');
                        if (token) {
                            console.error('Token inválido o expirado');
                            // El ContextProvider manejará esto
                        }
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    get(url, queryParams, headers, responseType) {
        return this.axiosInstance.get(url, this.getRequestConfig(queryParams, headers, responseType));
    }

    post(url, data, queryParams, headers, responseType) {
        return this.axiosInstance.post(url, data, this.getRequestConfig(queryParams, headers, responseType));
    }

    put(url, data, queryParams, headers, responseType) {
        return this.axiosInstance.put(url, data, this.getRequestConfig(queryParams, headers, responseType));
    }

    delete(url, queryParams, headers, responseType) {
        return this.axiosInstance.delete(url, this.getRequestConfig(queryParams, headers, responseType));
    }

    patch(url, data, queryParams, headers, responseType) {
        return this.axiosInstance.patch(url, data, this.getRequestConfig(queryParams, headers, responseType));
    }

    getRequestConfig(
        queryParams = {},
        headers = {
            Accept: 'application/json, text/plain',
            'Content-Type': 'application/json, charset=utf-8',
        },
        responseType = 'json'
    ) {
        const token = localStorage.getItem('token');

        if (headers['Content-Type'] === 'multipart/form-data') {
            delete headers['Content-Type'];
        }

        let paramsHeader = {
            params: queryParams,
            headers: headers,
            responseType: responseType,
        };

        if (token) {
            paramsHeader.headers.Authorization = `Bearer ${token}`;
        }

        return paramsHeader;
    }

    getWithDebounce(url, queryParams, headers, responseType, delay = 200) {
        return new Promise((resolve, reject) => {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }

            this.debounceTimeout = setTimeout(() => {
                this.get(url, queryParams, headers, responseType)
                    .then(response => resolve(response))
                    .catch(error => reject(error));
            }, delay);
        });
    }
}

export default new BaseApiService();