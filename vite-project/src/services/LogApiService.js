const API_URL = import.meta.env.VITE_API_BASE_URL;

import BaseApiService from './BaseApiService';

class UsuariosApiService {
    async loginUser(user) { 
        return await BaseApiService.post(API_URL + '/login', user);
    }
    async logoutUser(user) {
        return await BaseApiService.post(API_URL + '/logout', user);
    }
};

export default new UsuariosApiService();