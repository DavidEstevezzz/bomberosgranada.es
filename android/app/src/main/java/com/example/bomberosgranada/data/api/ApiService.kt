package com.example.bomberosgranada.data.api

import com.example.bomberosgranada.data.models.LoginRequest
import com.example.bomberosgranada.data.models.LoginResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {

    @POST("login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>
}