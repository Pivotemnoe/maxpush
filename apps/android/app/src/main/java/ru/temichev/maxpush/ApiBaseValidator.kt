package ru.temichev.maxpush

import java.net.URI

object ApiBaseValidator {
    fun trustedBaseUrl(candidate: String?, defaultBaseUrl: String, allowedHost: String, allowOverride: Boolean): String? {
        val fallback = normalize(defaultBaseUrl, allowLocalHttp = allowOverride) ?: return null
        val raw = candidate?.trim()?.takeIf { it.isNotBlank() } ?: return fallback
        val normalized = normalize(raw, allowLocalHttp = allowOverride) ?: return null

        if (!allowOverride && normalized != fallback) return null
        val uri = URI(normalized)
        if (uri.scheme != "https" && !isLocalHttpAllowed(uri, allowOverride)) return null
        if (!uri.host.equals(allowedHost, ignoreCase = true)) return null
        return normalized
    }

    private fun normalize(raw: String, allowLocalHttp: Boolean): String? {
        val uri = runCatching { URI(raw.trim().trimEnd('/')) }.getOrNull() ?: return null
        val scheme = uri.scheme?.lowercase() ?: return null
        val host = uri.host?.lowercase() ?: return null
        if (scheme != "https" && !(scheme == "http" && isLocalHost(host) && allowLocalHttp)) return null
        if (!uri.rawPath.isNullOrBlank() && uri.rawPath != "/") return null
        if (!uri.rawQuery.isNullOrBlank() || !uri.rawFragment.isNullOrBlank() || !uri.rawUserInfo.isNullOrBlank()) return null
        val port = if (uri.port == -1) "" else ":${uri.port}"
        return "$scheme://$host$port"
    }

    private fun isLocalHttpAllowed(uri: URI, allowOverride: Boolean): Boolean =
        allowOverride && uri.scheme == "http" && isLocalHost(uri.host)

    private fun isLocalHost(host: String?): Boolean {
        val value = host?.lowercase() ?: return false
        return value == "localhost" || value == "127.0.0.1" || value == "10.0.2.2" ||
            value.startsWith("192.168.") || value.startsWith("10.")
    }
}
