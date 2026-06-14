package ru.temichev.maxpush

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ApiBaseValidatorTest {
    @Test
    fun missingCandidateUsesDefaultBase() {
        assertEquals(
            "https://notifymax.ru",
            ApiBaseValidator.trustedBaseUrl(null, "https://notifymax.ru", "notifymax.ru", false)
        )
    }

    @Test
    fun rejectsHttpBase() {
        assertNull(ApiBaseValidator.trustedBaseUrl("http://notifymax.ru", "https://notifymax.ru", "notifymax.ru", true))
    }

    @Test
    fun allowsLocalHttpOnlyWithOverride() {
        assertEquals(
            "http://10.0.2.2:3000",
            ApiBaseValidator.trustedBaseUrl("http://10.0.2.2:3000", "http://10.0.2.2:3000", "10.0.2.2", true)
        )
    }

    @Test
    fun rejectsWrongHost() {
        assertNull(ApiBaseValidator.trustedBaseUrl("https://evil.example", "https://notifymax.ru", "notifymax.ru", true))
    }

    @Test
    fun rejectsOverrideWhenDisabled() {
        assertNull(ApiBaseValidator.trustedBaseUrl("https://api.notifymax.ru", "https://notifymax.ru", "notifymax.ru", false))
    }
}
