package ru.temichev.maxpush.queue

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONArray
import org.json.JSONObject
import ru.temichev.maxpush.Constants
import ru.temichev.maxpush.NotificationMapper

class NotificationQueue(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "max_push_queue_secure",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    data class Pending(
        val eventId: String,
        val sender: String?,
        val postedAt: Long,
        val packageName: String,
        val privacyMode: String
    )

    @Synchronized
    fun enqueue(event: NotificationMapper.RelayEvent) {
        val current = all().toMutableList()
        if (current.any { it.eventId == event.eventId }) return
        current.add(Pending(event.eventId, event.sender, event.postedAt, event.packageName, event.privacyMode))
        val trimmed = current.takeLast(Constants.MAX_QUEUE_SIZE)
        save(trimmed)
    }

    @Synchronized
    fun all(): List<Pending> {
        val raw = prefs.getString("items", "[]") ?: "[]"
        val array = JSONArray(raw)
        return (0 until array.length()).mapNotNull { index ->
            val obj = array.optJSONObject(index) ?: return@mapNotNull null
            Pending(
                eventId = obj.optString("event_id"),
                sender = obj.optString("sender").ifBlank { null },
                postedAt = obj.optLong("posted_at"),
                packageName = obj.optString("package_name", Constants.MAX_PACKAGE),
                privacyMode = obj.optString("privacy_mode", Constants.PRIVACY_MODE)
            )
        }.filter { it.eventId.isNotBlank() }
    }

    @Synchronized
    fun remove(eventId: String) {
        save(all().filterNot { it.eventId == eventId })
    }

    @Synchronized
    fun clear() {
        save(emptyList())
    }

    fun size(): Int = all().size

    @Synchronized
    private fun save(items: List<Pending>) {
        val array = JSONArray()
        items.forEach { item ->
            array.put(JSONObject().apply {
                put("event_id", item.eventId)
                put("sender", item.sender ?: JSONObject.NULL)
                put("posted_at", item.postedAt)
                put("package_name", item.packageName)
                put("privacy_mode", item.privacyMode)
            })
        }
        prefs.edit().putString("items", array.toString()).apply()
    }
}
