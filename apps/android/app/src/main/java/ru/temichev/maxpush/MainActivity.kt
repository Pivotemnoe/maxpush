package ru.temichev.maxpush

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import ru.temichev.maxpush.api.ApiClient
import ru.temichev.maxpush.queue.NotificationQueue
import ru.temichev.maxpush.queue.QueueSender
import ru.temichev.maxpush.security.TokenStore
import java.util.UUID

class MainActivity : Activity() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var tokenStore: TokenStore
    private lateinit var statusText: TextView
    private val scanRequestCode = 42

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tokenStore = TokenStore(this)
        render()
    }

    override fun onResume() {
        super.onResume()
        render()
        scope.launch { QueueSender.flush(applicationContext); render() }
    }

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    @Deprecated("Deprecated in Android API, acceptable for MVP without Activity Result dependency")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == scanRequestCode && resultCode == RESULT_OK) {
            val raw = data?.getStringExtra(ScanQrActivity.EXTRA_QR_VALUE).orEmpty()
            handlePairingInput(raw)
        }
    }

    private fun render() {
        val scroll = ScrollView(this)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 50, 40, 40)
            gravity = Gravity.CENTER_HORIZONTAL
        }
        scroll.addView(root)

        root.addView(title("Макс Пуш"))
        root.addView(paragraph("Передаёт уведомления MAX с этого Android на iPhone. Текст сообщений не передаётся — только отправитель или название чата."))

        statusText = paragraph(statusText())
        root.addView(statusText)

        root.addView(sectionTitle("Шаг 1. Свяжите Android с iPhone"))
        root.addView(paragraph("На iPhone откройте PWA “Макс Пуш” и нажмите “Показать QR для Android”. Затем нажмите кнопку ниже на Android."))

        root.addView(button("Сканировать QR-код с iPhone") {
            startActivityForResult(Intent(this, ScanQrActivity::class.java), scanRequestCode)
        })

        root.addView(button("Ввести код вручную") { showManualCodeDialog() })

        root.addView(sectionTitle("Шаг 2. Разрешите доступ к уведомлениям"))
        root.addView(paragraph("После QR-подключения включите системный доступ к уведомлениям для “Макс Пуш”."))

        root.addView(button("Включить доступ к уведомлениям") {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        })

        root.addView(button("Открыть настройки приложения") {
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName")))
        })

        root.addView(paragraph("Если Android пишет “Доступ к настройкам ограничен”: нажмите “Открыть настройки приложения”, затем меню ⋮ и “Разрешить ограниченные настройки”. После этого вернитесь сюда и снова включите доступ к уведомлениям."))

        root.addView(sectionTitle("Шаг 3. Проверьте отправку"))

        root.addView(button("Отправить тест") { sendTestNotification() })

        root.addView(button("Отключить") {
            tokenStore.clear()
            NotificationQueue(this).clear()
            render()
        })

        root.addView(paragraph("Безопасность: на сервер отправляются только технический ID, отправитель или название чата и время. Текст сообщений, пароли, SMS, банки, контакты, фото, звонки и уведомления других приложений не отправляются."))
        root.addView(paragraph("Android выдаёт широкий системный доступ к уведомлениям. Макс Пуш сразу отбрасывает всё, кроме уведомлений MAX, и не читает текст сообщений."))
        root.addView(paragraph("Для стабильной работы отключите экономию батареи для MAX и Макс Пуш."))
        setContentView(scroll)
    }

    private fun statusText(): String {
        val queueSize = NotificationQueue(this).size()
        val lastSent = tokenStore.lastSentAt().takeIf { it > 0 }?.let { android.text.format.DateFormat.format("HH:mm:ss", it).toString() } ?: "нет"
        return "Статус: ${if (tokenStore.isPaired() && isNotificationAccessEnabled() && isMaxInstalled()) "Работает" else "Не работает"}\n" +
            "iPhone: ${if (tokenStore.isPaired()) "подключён" else "не подключён"}\n" +
            "MAX: ${if (isMaxInstalled()) "найден" else "не найден"}\n" +
            "Доступ к уведомлениям: ${if (isNotificationAccessEnabled()) "включён" else "выключен"}\n" +
            "Последняя отправка: $lastSent\n" +
            "Очередь: $queueSize"
    }

    private fun handlePairingInput(raw: String) {
        val uri = runCatching { Uri.parse(raw) }.getOrNull()
        val code = uri?.getQueryParameter("code") ?: raw.trim()
        val base = ApiBaseValidator.trustedBaseUrl(
            candidate = uri?.getQueryParameter("base"),
            defaultBaseUrl = BuildConfig.DEFAULT_API_BASE_URL,
            allowedHost = BuildConfig.ALLOWED_API_HOST,
            allowOverride = BuildConfig.ALLOW_QR_BASE_URL_OVERRIDE
        )
        if (base == null) {
            showError("QR-код не от notifymax.ru. Откройте PWA заново и покажите новый код.")
            return
        }
        if (code.isBlank()) {
            showError("Код подключения пустой")
            return
        }

        scope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    ApiClient(base).confirmPairing(
                        pairingCode = code,
                        deviceName = android.os.Build.MANUFACTURER + " " + android.os.Build.MODEL,
                        appVersion = BuildConfig.VERSION_NAME
                    )
                }
                tokenStore.savePairing(base, result.deviceId, result.deviceToken)
                showMessage("iPhone подключён")
                render()
            } catch (e: Exception) {
                showError("Не удалось подключить: ${e.message}")
            }
        }
    }

    private fun sendTestNotification() {
        val token = tokenStore.deviceToken()
        if (token == null) {
            showError("Сначала подключите iPhone")
            return
        }
        val queue = NotificationQueue(this)
        queue.enqueue(NotificationMapper.RelayEvent(
            eventId = "test-${UUID.randomUUID()}",
            sender = "Тест",
            postedAt = System.currentTimeMillis()
        ))
        scope.launch {
            val result = QueueSender.flush(applicationContext)
            render()
            if (result.authFailed) {
                showError("Подключение устарело. Отсканируйте новый QR-код с iPhone.")
            } else if (result.sent > 0) {
                showMessage("Тест отправлен")
            } else {
                showError("Не удалось отправить тест. Проверьте интернет и попробуйте ещё раз.")
            }
        }
    }

    private fun showManualCodeDialog() {
        val input = EditText(this).apply { inputType = InputType.TYPE_CLASS_TEXT }
        AlertDialog.Builder(this)
            .setTitle("Код подключения")
            .setMessage("Введите код с iPhone")
            .setView(input)
            .setPositiveButton("Подключить") { _, _ -> handlePairingInput(input.text.toString()) }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private fun isMaxInstalled(): Boolean = try {
        packageManager.getPackageInfo(Constants.MAX_PACKAGE, 0)
        true
    } catch (_: PackageManager.NameNotFoundException) {
        false
    }

    private fun isNotificationAccessEnabled(): Boolean {
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners") ?: return false
        return flat.contains(packageName)
    }

    private fun title(text: String): TextView = TextView(this).apply {
        this.text = text
        textSize = 26f
        setPadding(0, 0, 0, 20)
    }

    private fun sectionTitle(text: String): TextView = TextView(this).apply {
        this.text = text
        textSize = 20f
        setPadding(0, 26, 0, 8)
    }

    private fun paragraph(text: String): TextView = TextView(this).apply {
        this.text = text
        textSize = 16f
        setPadding(0, 10, 0, 10)
    }

    private fun button(text: String, onClick: () -> Unit): Button = Button(this).apply {
        this.text = text
        setOnClickListener { onClick() }
        layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            setMargins(0, 8, 0, 8)
        }
    }

    private fun showError(message: String) = AlertDialog.Builder(this).setTitle("Ошибка").setMessage(message).setPositiveButton("OK", null).show()
    private fun showMessage(message: String) = AlertDialog.Builder(this).setTitle("Готово").setMessage(message).setPositiveButton("OK", null).show()
}
