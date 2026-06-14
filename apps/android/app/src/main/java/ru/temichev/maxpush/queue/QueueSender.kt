package ru.temichev.maxpush.queue

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import ru.temichev.maxpush.api.ApiClient
import ru.temichev.maxpush.security.TokenStore

object QueueSender {
    data class FlushResult(val sent: Int, val remaining: Int, val authFailed: Boolean)

    suspend fun flush(context: Context): FlushResult = withContext(Dispatchers.IO) {
        val tokenStore = TokenStore(context)
        val token = tokenStore.deviceToken() ?: return@withContext FlushResult(sent = 0, remaining = 0, authFailed = false)
        val queue = NotificationQueue(context)
        val api = ApiClient(tokenStore.baseUrl())
        var sent = 0
        var authFailed = false

        for (item in queue.all()) {
            try {
                if (api.sendNotification(token, item)) {
                    queue.remove(item.eventId)
                    tokenStore.saveLastSentAt(System.currentTimeMillis())
                    sent += 1
                }
            } catch (e: ApiClient.ApiException) {
                if (e.statusCode == 401 || e.statusCode == 403) {
                    tokenStore.clear()
                    authFailed = true
                } else if (e.statusCode == 400) {
                    queue.remove(item.eventId)
                    continue
                }
                break
            } catch (_: Exception) {
                // Keep item in local queue. Do not log sender or notification content.
                break
            }
        }
        FlushResult(sent = sent, remaining = queue.size(), authFailed = authFailed)
    }
}
