package es.bomberosgranada.app.data.api.adapters

import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import java.lang.reflect.Type

/**
 * Gson adapter que permite deserializar campos que pueden venir como boolean o int.
 * Normaliza a Int (true -> 1, false -> 0) para mantener compatibilidad con el modelo.
 */
class BooleanIntAdapter : JsonDeserializer<Int?>, JsonSerializer<Int?> {
    override fun deserialize(json: JsonElement?, typeOfT: Type?, context: JsonDeserializationContext?): Int? {
        if (json == null || json.isJsonNull) return null

        val primitive = json.asJsonPrimitive
        return when {
            primitive.isBoolean -> if (primitive.asBoolean) 1 else 0
            primitive.isNumber -> primitive.asInt
            primitive.isString -> primitive.asString.toIntOrNull()
            else -> null
        }
    }

    override fun serialize(src: Int?, typeOfSrc: Type?, context: JsonSerializationContext?): JsonElement {
        return src?.let { JsonPrimitive(it) } ?: JsonNull.INSTANCE
    }
}