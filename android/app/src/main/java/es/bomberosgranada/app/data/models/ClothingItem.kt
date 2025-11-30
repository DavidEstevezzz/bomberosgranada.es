package es.bomberosgranada.app.data.models

data class ClothingItem(
    val id: Int,
    val name: String,
    val created_at: String?,
    val updated_at: String?
)

data class ClothingItemsResponse(
    val status: String,
    val data: List<ClothingItem>
)

data class ClothingItemResponse(
    val status: String,
    val data: ClothingItem
)

data class ClothingItemCreatedResponse(
    val status: String,
    val message: String,
    val data: ClothingItem
)

data class ClothingItemUpdatedResponse(
    val status: String,
    val message: String,
    val data: ClothingItem
)

data class ClothingItemDeletedResponse(
    val status: String,
    val message: String
)

data class CreateClothingItemRequest(
    val name: String
)

data class UpdateClothingItemRequest(
    val name: String
)