import BaseApiService from './BaseApiService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/salaries`;

class SalariesApiService {
    async getSalaries() {
        return await BaseApiService.get(API_URL);
    }

    async getSalary(id) {
        return await BaseApiService.get(`${API_URL}/${id}`);
    }

    async createSalary(salary) {
        return await BaseApiService.post(API_URL, salary);
    }

    async updateSalary(id, salary) {
        return await BaseApiService.put(`${API_URL}/${id}`, salary);
    }

    async deleteSalary(id) {
        return await BaseApiService.delete(`${API_URL}/${id}`);
    }
}

export default new SalariesApiService();
