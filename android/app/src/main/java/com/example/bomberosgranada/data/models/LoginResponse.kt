package com.example.bomberosgranada.data.models
import com.google.gson.annotations.SerializedName
data class LoginResponse(
    val user: User,
    val role: String,
    val token: String
)

data class User(
    val id: Int,
    @SerializedName("nombre") val name: String,  // ✅ Mapea "nombre" a "name"
    val email: String,
    @SerializedName("id_parque") val id_parque: Int? = null,
    @SerializedName("id_brigada") val id_brigada: Int? = null
)
