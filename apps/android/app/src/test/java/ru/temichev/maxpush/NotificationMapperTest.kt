package ru.temichev.maxpush

import android.app.Notification
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NotificationMapperTest {
    @Test
    fun titleExistsSenderIsTitle() {
        val sender = NotificationMapper.extractSenderFromValues("Иван", null, null)
        assertEquals("Иван", sender)
    }

    @Test
    fun titleWithNewlinesIsCleaned() {
        val sender = NotificationMapper.extractSenderFromValues(" Иван\nПетров ", null, null)
        assertEquals("Иван Петров", sender)
    }

    @Test
    fun titleLongerThan120IsTruncated() {
        val sender = NotificationMapper.extractSenderFromValues("А".repeat(200), null, null)
        assertEquals(120, sender?.length)
    }

    @Test
    fun noTitleSenderNull() {
        val sender = NotificationMapper.extractSenderFromValues(null, null, null)
        assertNull(sender)
    }

    @Test
    fun textIsIgnoredWhenTitleAbsent() {
        // There is intentionally no method argument for notification text.
        val sender = NotificationMapper.extractSenderFromValues(null, null, null)
        assertNull(sender)
    }

    @Test
    fun wrongPackageIgnoredByPureCheck() {
        val event = NotificationMapper.fromValues(
            packageName = "org.telegram.messenger",
            key = "key",
            postTime = 1L,
            title = "Иван",
            conversationTitle = null,
            subText = null
        )
        assertNull(event)
    }

    @Test
    fun wrongPackageIgnoredByNotificationFilter() {
        assertTrue(NotificationMapper.shouldIgnoreNotification("org.telegram.messenger", 0))
    }

    @Test
    fun groupSummaryIgnoredByNotificationFilter() {
        assertTrue(NotificationMapper.shouldIgnoreNotification(Constants.MAX_PACKAGE, Notification.FLAG_GROUP_SUMMARY))
    }

    @Test
    fun foregroundServiceIgnoredByNotificationFilter() {
        assertTrue(NotificationMapper.shouldIgnoreNotification(Constants.MAX_PACKAGE, Notification.FLAG_FOREGROUND_SERVICE))
    }

    @Test
    fun ordinaryMaxNotificationAcceptedByNotificationFilter() {
        assertFalse(NotificationMapper.shouldIgnoreNotification(Constants.MAX_PACKAGE, 0))
    }

    @Test
    fun correctPackageCreatesEventWithoutText() {
        val event = NotificationMapper.fromValues(
            packageName = Constants.MAX_PACKAGE,
            key = "key",
            postTime = 1L,
            title = "Иван",
            conversationTitle = null,
            subText = null
        )
        assertEquals("Иван", event?.sender)
        assertTrue(event?.eventId?.isNotBlank() == true)
    }

    @Test
    fun correctPackageWithoutSenderIsIgnored() {
        val event = NotificationMapper.fromValues(
            packageName = Constants.MAX_PACKAGE,
            key = "key",
            postTime = 1L,
            title = null,
            conversationTitle = null,
            subText = null
        )
        assertNull(event)
    }
}
