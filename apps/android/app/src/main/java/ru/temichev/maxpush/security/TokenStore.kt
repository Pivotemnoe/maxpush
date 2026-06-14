package ru.temichev.maxpush.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenStore(context: Context) {
    private val prefs = EncryptedSharedPreferences.create(
        context,
        "max_push_secure",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun savePairing(baseUrl: String, deviceId: String, deviceToken: String) {
        prefs.edit()
            .putString("base_url", baseUrl.trimEnd('/'))
            .putString("device_id", deviceId)
            .putString("device_token", deviceToken)
            .apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    fun baseUrl(): String = prefs.getString("base_url", null) ?: ru.temichev.maxpush.BuildConfig.DEFAULT_API_BASE_URL
    fun deviceToken(): String? = prefs.getString("device_token", null)
    fun deviceId(): String? = prefs.getString("device_id", null)
    fun isPaired(): Boolean = deviceToken() != null

    fun saveLastSentAt(value: Long) {
        prefs.edit().putLong("last_sent_at", value).apply()
    }

    fun lastSentAt(): Long = prefs.getLong("last_sent_at", 0L)
}
