import axios from 'axios';
class BaseApiService {
    constructor() {
    this.axiosInstance = axios.create();
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
    
        // Elimina el encabezado 'Content-Type' si se envía FormData
        if (headers['Content-Type'] === 'multipart/form-data') {
            delete headers['Content-Type']; // Axios configurará esto automáticamente para FormData
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
                clearTimeout(this.debounceTimeout); // Limpiar el timeout anterior
            }

            // Establecer un nuevo timeout
            this.debounceTimeout = setTimeout(() => {
                this.get(url, queryParams, headers, responseType)
                    .then(response => resolve(response))
                    .catch(error => reject(error));
            }, delay);
        });
    }

}

export default new BaseApiService;