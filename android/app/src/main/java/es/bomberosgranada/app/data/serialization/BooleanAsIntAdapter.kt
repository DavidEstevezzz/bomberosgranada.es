package es.bomberosgranada.app.data.serialization

import com.google.gson.JsonDeserializationContext
import com.google.gson.JsonDeserializer
import com.google.gson.JsonElement
import com.google.gson.JsonParseException
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializationContext
import com.google.gson.JsonSerializer
import java.lang.reflect.Type

/**
 * Adapter that accepts booleans encoded as either JSON booleans or numbers (0/1).
 */
class BooleanAsIntAdapter : JsonDeserializer<Boolean?>, JsonSerializer<Boolean?> {
    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): Boolean? {
        json ?: return null

        val primitive = json.asJsonPrimitive

        return when {
            primitive.isBoolean -> primitive.asBoolean
            primitive.isNumber -> primitive.asInt != 0
            primitive.isString -> primitive.asString.toBooleanStrictOrNull()
            else -> throw JsonParseException("Cannot parse value as boolean: $json")
        }
    }

    override fun serialize(
        src: Boolean?,
        typeOfSrc: Type?,
        context: JsonSerializationContext?
    ): JsonElement {
        return JsonPrimitive(src)
    }
}