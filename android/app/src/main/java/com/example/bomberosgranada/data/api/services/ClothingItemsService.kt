package com.example.bomberosgranada.data.api.services

import retrofit2.Response
import retrofit2.http.*

interface ClothingItemsService {

    @GET("clothing-items")
    suspend fun getClothingItems(): Response<List<ClothingItem>>

    @GET("clothing-items/{id}")
    suspend fun getClothingItem(@Path("id") id: Int): Response<ClothingItem>

    @POST("clothing-items")
    suspend fun createClothingItem(@Body item: CreateClothingItemRequest): Response<ClothingItem>

    @PUT("clothing-items/{id}")
    suspend fun updateClothingItem(
        @Path("id") id: Int,
        @Body item: UpdateClothingItemRequest
    ): Response<ClothingItem>

    @DELETE("clothing-items/{id}")
    suspend fun deleteClothingItem(@Path("id") id: Int): Response<Unit>
}

// Models
data class ClothingItem(
    val id: Int,
    val nombre: String,
    val descripcion: String? = null,
    val categoria: String
)

data class CreateClothingItemRequest(
    val nombre: String,
    val descripcion: String? = null,
    val categoria: String
)

data class UpdateClothingItemRequest(
    val nombre: String? = null,
    val descripcion: String? = null,
    val categoria: String? = null
)