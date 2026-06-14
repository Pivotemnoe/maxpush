package ru.temichev.maxpush

import android.app.Notification
import android.os.Bundle
import java.security.MessageDigest

object NotificationMapper {
    data class RelayEvent(
        val eventId: String,
        val sender: String?,
        val postedAt: Long,
        val packageName: String = Constants.MAX_PACKAGE,
        val privacyMode: String = Constants.PRIVACY_MODE
    )

    fun fromNotification(packageName: String, key: String, postTime: Long, extras: Bundle): RelayEvent? {
        // Deliberately do NOT read Notification.EXTRA_TEXT or EXTRA_BIG_TEXT.
        return fromValues(
            packageName = packageName,
            key = key,
            postTime = postTime,
            title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString(),
            conversationTitle = extras.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString(),
            subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()
        )
    }

    fun fromValues(
        packageName: String,
        key: String,
        postTime: Long,
        title: String?,
        conversationTitle: String?,
        subText: String?
    ): RelayEvent? {
        if (packageName != Constants.MAX_PACKAGE) return null

        val sender = extractSenderFromValues(
            title = title,
            conversationTitle = conversationTitle,
            subText = subText
        )

        val eventId = sha256("$packageName|$key|$postTime|${sender.orEmpty()}")
        return RelayEvent(eventId = eventId, sender = sender, postedAt = postTime)
    }

    fun extractSenderFromValues(title: String?, conversationTitle: String?, subText: String?): String? {
        val candidate = listOf(title, conversationTitle, subText).firstOrNull { !it.isNullOrBlank() } ?: return null
        return cleanSender(candidate)
    }

    fun cleanSender(value: String): String? {
        val cleaned = value
            .replace(Regex("[\\r\\n\\t]+"), " ")
            .replace(Regex("\\s{2,}"), " ")
            .trim()
            .take(120)
        return cleaned.ifBlank { null }
    }

    private fun sha256(value: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
