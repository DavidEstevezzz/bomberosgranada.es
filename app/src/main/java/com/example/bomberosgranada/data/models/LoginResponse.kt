package com.example.bomberosgranada.data.models

data class LoginResponse(
    val user: User,
    val role: String,
    val token: String
)

data class User(
    val id: Int,
    val name: String,
    val email: String,
    val id_parque: Int? = null,
    val id_brigada: Int? = null
)
