package com.example.bomberosgranada.data.api.services

import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface MessagesService {

    @GET("messages")
    suspend fun getInboxMessages(): Response<List<Message>>

    @GET("messages/sent")
    suspend fun getSentMessages(): Response<List<Message>>

    @GET("messages/{id}")
    suspend fun getMessage(@Path("id") id: Int): Response<MessageThread>

    @GET("messages/search")
    suspend fun searchMessages(@Query("query") query: String): Response<List<Message>>

    @Multipart
    @POST("messages")
    suspend fun sendMessage(
        @Part("receiver_id") receiverId: RequestBody,
        @Part("subject") subject: RequestBody,
        @Part("body") body: RequestBody,
        @Part attachment: MultipartBody.Part? = null,
        @Part("parent_id") parentId: RequestBody? = null
    ): Response<Message>

    @PATCH("messages/{id}/mark-as-read")
    suspend fun markAsRead(@Path("id") id: Int): Response<Unit>

    @PATCH("messages/{id}/mark-massive-as-read")
    suspend fun markMassiveAsRead(@Path("id") id: Int): Response<Unit>

    @DELETE("messages/{id}")
    suspend fun deleteMessage(@Path("id") id: Int): Response<Unit>

    @PATCH("messages/{id}/restore")
    suspend fun restoreMessage(@Path("id") id: Int): Response<Unit>

    @GET("messages/{id}/attachment")
    suspend fun downloadAttachment(@Path("id") id: Int): Response<ResponseBody>

    @GET("users")
    suspend fun getUsers(): Response<List<UserInfo>>
}

// Models
data class Message(
    val id: Int,
    val subject: String,
    val body: String,
    val sender_id: Int,
    val receiver_id: Int,
    val sender_name: String? = null,
    val receiver_name: String? = null,
    val read: Boolean,
    val created_at: String,
    val attachment: String? = null,
    val parent_id: Int? = null,
    val individualized: Boolean = false
)

data class MessageThread(
    val id: Int,
    val subject: String,
    val body: String,
    val sender_id: Int,
    val receiver_id: Int,
    val sender_name: String,
    val receiver_name: String,
    val read: Boolean,
    val created_at: String,
    val attachment: String? = null,
    val parent_id: Int? = null,
    val replies: List<Message>? = null
)

data class UserInfo(
    val id_empleado: Int,
    val nombre: String,
    val apellido: String,
    val email: String
)