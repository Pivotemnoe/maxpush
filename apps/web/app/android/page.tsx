import Link from "next/link";

function getLocalApkHref() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return null;

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "http:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    const hostSlug = url.hostname.replace(/\./g, "-");
    return `/download/max-push-local-${hostSlug}.apk`;
  } catch {
    return null;
  }
}

export default function AndroidPage() {
  const localApkHref = getLocalApkHref();

  return (
    <main className="container">
      <section className="card stack">
        <h1>Скачать Макс Пуш для Android</h1>
        <p className="muted">
          APK нужен для телефона, где установлен MAX. Он отбрасывает уведомления других приложений и отправляет на iPhone только отправителя/чат без текста сообщения.
        </p>
        <div className="row">
          {localApkHref && <a className="button" href={localApkHref}>Скачать локальный APK</a>}
          <a className={localApkHref ? "button secondary" : "button"} href="/download/max-push-latest.apk">Скачать APK для notifymax.ru</a>
          <Link className="button secondary" href="/app">Открыть iPhone PWA</Link>
        </div>
        {localApkHref && (
          <p className="small muted">
            Для проверки сейчас используйте локальный APK: он отправляет события на этот Mac в вашей Wi-Fi сети. APK для notifymax.ru нужен после выкладки на HTTPS-домен.
          </p>
        )}
        <h2>Инструкция</h2>
        <ol className="stack">
          <li>Скачайте APK.</li>
          <li>Разрешите установку из браузера.</li>
          <li>Откройте приложение “Макс Пуш”.</li>
          <li>Отсканируйте QR-код с iPhone.</li>
          <li>Разрешите доступ к уведомлениям.</li>
          <li>Если Android пишет “Доступ к настройкам ограничен”, откройте “О приложении Макс Пуш”, нажмите меню ⋮ и выберите “Разрешить ограниченные настройки”.</li>
          <li>Вернитесь в “Макс Пуш” и снова нажмите “Включить доступ к уведомлениям”.</li>
          <li>Проверьте, что статус приложения — “Работает”.</li>
        </ol>
        <div className="notice">
          <strong>Безопасность:</strong> Android выдаёт системный доступ к уведомлениям, но Макс Пуш фильтрует только package MAX. Текст сообщений, SMS, банки, контакты, фото, звонки и другие приложения не отправляются на сервер.
        </div>
      </section>
    </main>
  );
}
