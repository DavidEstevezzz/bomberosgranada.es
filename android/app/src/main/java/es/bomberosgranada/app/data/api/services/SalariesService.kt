package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface SalariesService {

    /**
     * GET /salaries
     * Laravel devuelve: List<Salary>
     */
    @GET("salaries")
    suspend fun getSalaries(): Response<List<Salary>>

    /**
     * GET /salaries/{id}
     * Laravel devuelve: Salary
     */
    @GET("salaries/{id}")
    suspend fun getSalary(@Path("id") id: Int): Response<Salary>

    /**
     * POST /salaries
     * Laravel espera: { tipo, fecha_ini, precio_diurno, precio_nocturno, horas_diurnas, horas_nocturnas }
     * Laravel devuelve: Salary
     */
    @POST("salaries")
    suspend fun createSalary(@Body salary: CreateSalaryRequest): Response<Salary>

    /**
     * PUT /salaries/{id}
     * Laravel espera: { tipo, fecha_ini, precio_diurno, precio_nocturno, horas_diurnas, horas_nocturnas }
     * NOTA: Laravel requiere TODOS los campos en update (no son opcionales)
     * Laravel devuelve: Salary
     */
    @PUT("salaries/{id}")
    suspend fun updateSalary(
        @Path("id") id: Int,
        @Body salary: UpdateSalaryRequest
    ): Response<Salary>

    /**
     * DELETE /salaries/{id}
     * Laravel devuelve: 204 No Content
     */
    @DELETE("salaries/{id}")
    suspend fun deleteSalary(@Path("id") id: Int): Response<Unit>
}