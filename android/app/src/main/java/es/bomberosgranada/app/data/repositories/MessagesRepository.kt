package es.bomberosgranada.app.data.repositories

import android.util.Log
import es.bomberosgranada.app.data.api.ApiClient
import es.bomberosgranada.app.data.models.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.ResponseBody
import java.io.File

class MessagesRepository {
    private val TAG = "MessagesRepository"
    private val messagesService = ApiClient.messages

    suspend fun getInboxMessages(): Result<List<Message>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO MENSAJES RECIBIDOS ===")
            val response = messagesService.getInboxMessages()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} mensajes obtenidos")
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

    suspend fun getSentMessages(): Result<List<Message>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO MENSAJES ENVIADOS ===")
            val response = messagesService.getSentMessages()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} mensajes obtenidos")
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

    suspend fun searchMessages(query: String): Result<List<Message>> {
        return try {
            Log.d(TAG, "=== BUSCANDO MENSAJES: $query ===")
            val response = messagesService.searchMessages(query)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} mensajes encontrados")
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

    suspend fun getMessageThread(id: Int): Result<Message> {
        return try {
            Log.d(TAG, "=== OBTENIENDO HILO DE MENSAJE $id ===")
            val response = messagesService.getMessageThread(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Hilo de mensaje obtenido")
                Result.success(response.body()!!.message)
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

    suspend fun sendMessage(
        receiverId: Int? = null,
        subject: String,
        body: String,
        attachmentFile: File? = null,
        parentId: Int? = null,
        massive: String? = null
    ): Result<Message> {
        return try {
            Log.d(TAG, "=== ENVIANDO MENSAJE ===")
            Log.d(TAG, "Asunto: $subject, Masivo: ${massive ?: "false"}")

            val receiverIdBody = receiverId?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val subjectBody = subject.toRequestBody("text/plain".toMediaTypeOrNull())
            val bodyBody = body.toRequestBody("text/plain".toMediaTypeOrNull())
            val parentIdBody = parentId?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
            val massiveBody = massive?.toRequestBody("text/plain".toMediaTypeOrNull())

            val attachmentPart = attachmentFile?.let {
                val requestFile = it.asRequestBody("application/octet-stream".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("attachment", it.name, requestFile)
            }

            val response = messagesService.sendMessage(
                receiverIdBody,
                subjectBody,
                bodyBody,
                attachmentPart,
                parentIdBody,
                massiveBody
            )

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Mensaje enviado")
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

    suspend fun markAsRead(id: Int): Result<MarkAsReadResponse> {
        return try {
            Log.d(TAG, "=== MARCANDO MENSAJE $id COMO LEÍDO ===")
            val response = messagesService.markAsRead(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Mensaje marcado como leído")
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

    suspend fun markMassiveAsRead(id: Int): Result<MarkMassiveAsReadResponse> {
        return try {
            Log.d(TAG, "=== MARCANDO MENSAJE MASIVO $id COMO LEÍDO PARA TODOS ===")
            val response = messagesService.markMassiveAsRead(id)

            if (response.isSuccessful && response.body() != null) {
                val result = response.body()!!
                Log.d(TAG, "✅ Marcado para ${result.affected_users_count} usuarios")
                Result.success(result)
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

    suspend fun deleteMessage(id: Int): Result<String> {
        return try {
            Log.d(TAG, "=== ELIMINANDO MENSAJE $id ===")
            val response = messagesService.deleteMessage(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Mensaje eliminado")
                Result.success(response.body()!!.message)
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

    suspend fun restoreMessage(id: Int): Result<String> {
        return try {
            Log.d(TAG, "=== RESTAURANDO MENSAJE $id ===")
            val response = messagesService.restoreMessage(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Mensaje restaurado")
                Result.success(response.body()!!.message)
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

    suspend fun downloadAttachment(id: Int): Result<ResponseBody> {
        return try {
            Log.d(TAG, "=== DESCARGANDO ADJUNTO DEL MENSAJE $id ===")
            val response = messagesService.downloadAttachment(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Adjunto descargado")
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

    suspend fun getUsers(): Result<List<User>> {
        return try {
            Log.d(TAG, "=== OBTENIENDO USUARIOS ===")
            val response = messagesService.getUsers()

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ ${response.body()!!.size} usuarios obtenidos")
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