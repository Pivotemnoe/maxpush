package ru.temichev.maxpush

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import ru.temichev.maxpush.queue.NotificationQueue
import ru.temichev.maxpush.queue.QueueSender
import ru.temichev.maxpush.security.TokenStore

class MaxNotificationListenerService : NotificationListenerService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (NotificationMapper.shouldIgnoreNotification(sbn.packageName, sbn.notification.flags)) return
        if (!TokenStore(applicationContext).isPaired()) return

        val event = NotificationMapper.fromNotification(
            packageName = sbn.packageName,
            key = sbn.key,
            postTime = sbn.postTime,
            extras = sbn.notification.extras
        ) ?: return

        NotificationQueue(applicationContext).enqueue(event)
        scope.launch { QueueSender.flush(applicationContext) }
    }
}
