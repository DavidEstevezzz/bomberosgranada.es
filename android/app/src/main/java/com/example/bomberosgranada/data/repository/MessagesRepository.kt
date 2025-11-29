package com.example.bomberosgranada.data.repository

import android.util.Log
import com.example.bomberosgranada.data.api.ApiClient
import com.example.bomberosgranada.data.api.services.Message
import com.example.bomberosgranada.data.api.services.MessageThread
import com.example.bomberosgranada.data.api.services.UserInfo
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
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

    suspend fun getMessage(id: Int): Result<MessageThread> {
        return try {
            Log.d(TAG, "=== OBTENIENDO MENSAJE $id ===")
            val response = messagesService.getMessage(id)

            if (response.isSuccessful && response.body() != null) {
                Log.d(TAG, "✅ Mensaje obtenido")
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

    suspend fun sendMessage(
        receiverId: Int,
        subject: String,
        body: String,
        attachmentFile: File? = null,
        parentId: Int? = null
    ): Result<Message> {
        return try {
            Log.d(TAG, "=== ENVIANDO MENSAJE ===")

            val receiverIdBody = receiverId.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val subjectBody = subject.toRequestBody("text/plain".toMediaTypeOrNull())
            val bodyBody = body.toRequestBody("text/plain".toMediaTypeOrNull())
            val parentIdBody = parentId?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())

            val attachmentPart = attachmentFile?.let {
                val requestFile = it.asRequestBody("application/octet-stream".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("attachment", it.name, requestFile)
            }

            val response = messagesService.sendMessage(
                receiverIdBody,
                subjectBody,
                bodyBody,
                attachmentPart,
                parentIdBody
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

    suspend fun markAsRead(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== MARCANDO MENSAJE $id COMO LEÍDO ===")
            val response = messagesService.markAsRead(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Mensaje marcado como leído")
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

    suspend fun deleteMessage(id: Int): Result<Unit> {
        return try {
            Log.d(TAG, "=== ELIMINANDO MENSAJE $id ===")
            val response = messagesService.deleteMessage(id)

            if (response.isSuccessful) {
                Log.d(TAG, "✅ Mensaje eliminado")
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

    suspend fun getUsers(): Result<List<UserInfo>> {
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