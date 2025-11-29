package com.example.bomberosgranada.data.repository

import android.util.Log
import com.example.bomberosgranada.data.api.ApiClient
import com.example.bomberosgranada.data.api.services.CountResponseIncident
import com.example.bomberosgranada.data.api.services.CreateIncidentRequest
import com.example.bomberosgranada.data.api.services.Incident
import com.example.bomberosgranada.data.api.services.ResolveIncidentRequest
import com.example.bomberosgranada.data.api.services.UpdateIncidentRequest

class IncidentsRepository {
    private val TAG = "IncidentsRepository"
    private val incidentsService = ApiClient.incidents

    suspend fun getIncidents(): Result<List<Incident>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO INCIDENCIAS ===")
            val response = incidentsService.getIncidents()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} incidencias obtenidas")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun getIncident(id: Int): Result<Incident> {
        return try {
            Log.d(TAG, "=== OBTENIENDO INCIDENCIA $id ===")
            val response = incidentsService.getIncident(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Incidencia obtenida")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun createIncident(incident: CreateIncidentRequest): Result<Incident> {
        return try {
            Log.d(TAG, "=== CREANDO INCIDENCIA ===")
            Log.d(TAG, "Tipo: ${incident.tipo}, Prioridad: ${incident.prioridad}")
            val response = incidentsService.createIncident(incident)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Incidencia creada")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun updateIncident(id: Int, incident: UpdateIncidentRequest): Result<Incident> {
        return try {
            Log.d(TAG, "=== ACTUALIZANDO INCIDENCIA $id ===")
            val response = incidentsService.updateIncident(id, incident)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Incidencia actualizada")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun deleteIncident(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO INCIDENCIA $id ===")
            val response = incidentsService.deleteIncident(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Incidencia eliminada")
                Result.success(Unit)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun markAsRead(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== MARCANDO INCIDENCIA $id COMO LEÍDA ===")
            val response = incidentsService.markAsRead(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Incidencia marcada como leída")
                Result.success(Unit)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun resolveIncident(id: Int, resolution: ResolveIncidentRequest): Result<Incident> {
        return try {
            Log.d(TAG, "=== RESOLVIENDO INCIDENCIA $id ===")
            val response = incidentsService.resolveIncident(id, resolution)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Incidencia resuelta")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }

    suspend fun countPending(): Result<CountResponseIncident> {
        return try {
            Log.d(TAG, "=== CONTANDO INCIDENCIAS PENDIENTES ===")
            val response = incidentsService.countPending()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.count} incidencias pendientes")
                Result.success(response.body()!!)
            } else {
                val errorMsg = "Error: ${response.code()}"
                Log.e(TAG, "❌ $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ EXCEPCIÓN: ${e.message}", e)
            Result.failure(e)
        }
    }
}