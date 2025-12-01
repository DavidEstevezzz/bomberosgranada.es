package es.bomberosgranada.app.data.api.services

import es.bomberosgranada.app.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ClothingItemsService {

    @GET("clothing-items")
    suspend fun getClothingItems(): Response<ClothingItemsResponse>

    @GET("clothing-items/{id}")
    suspend fun getClothingItem(@Path("id") id: Int): Response<ClothingItemResponse>

    @POST("clothing-items")
    suspend fun createClothingItem(@Body item: CreateClothingItemRequest): Response<ClothingItemCreatedResponse>

    @PUT("clothing-items/{id}")
    suspend fun updateClothingItem(
        @Path("id") id: Int,
        @Body item: UpdateClothingItemRequest
    ): Response<ClothingItemUpdatedResponse>

    @DELETE("clothing-items/{id}")
    suspend fun deleteClothingItem(@Path("id") id: Int): Response<ClothingItemDeletedResponse>
}