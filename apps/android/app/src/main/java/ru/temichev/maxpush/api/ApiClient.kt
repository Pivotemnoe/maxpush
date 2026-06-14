package ru.temichev.maxpush.api

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import ru.temichev.maxpush.queue.NotificationQueue
import java.io.IOException
import java.util.concurrent.TimeUnit

class ApiClient(private val baseUrl: String) {
    data class PairingResult(val deviceId: String, val deviceToken: String)
    class ApiException(val statusCode: Int, message: String) : IOException(message)

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private val jsonMedia = "application/json; charset=utf-8".toMediaType()

    fun confirmPairing(pairingCode: String, deviceName: String, appVersion: String): PairingResult {
        val body = JSONObject().apply {
            put("pairing_code", pairingCode)
            put("device_name", deviceName)
            put("app_version", appVersion)
        }
        val response = post("/api/pair/confirm", body, token = null)
        if (!response.optBoolean("ok")) throw IOException("Pairing failed")
        return PairingResult(response.getString("device_id"), response.getString("device_token"))
    }

    fun sendNotification(token: String, item: NotificationQueue.Pending): Boolean {
        val body = JSONObject().apply {
            put("event_id", item.eventId)
            if (item.sender != null) put("sender", item.sender) else put("sender", JSONObject.NULL)
            put("posted_at", item.postedAt)
            put("package_name", item.packageName)
            put("privacy_mode", item.privacyMode)
        }
        val response = post("/api/android/notification", body, token)
        return response.optBoolean("ok")
    }

    private fun post(path: String, json: JSONObject, token: String?): JSONObject {
        val requestBuilder = Request.Builder()
            .url(baseUrl.trimEnd('/') + path)
            .post(json.toString().toRequestBody(jsonMedia))
            .header("Content-Type", "application/json")
        if (token != null) requestBuilder.header("Authorization", "Bearer $token")

        client.newCall(requestBuilder.build()).execute().use { response ->
            val text = response.body?.string().orEmpty()
            if (!response.isSuccessful) throw ApiException(response.code, "HTTP ${response.code}")
            return if (text.isBlank()) JSONObject() else JSONObject(text)
        }
    }
}
