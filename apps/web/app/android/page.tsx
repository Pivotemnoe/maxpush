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
        <h1>Шаг 1. Установите Макс Пуш на Android</h1>
        <p className="muted">
          Это нужно сделать на отдельном Android-телефоне с Android 8 или новее. На нём уже должен быть установлен официальный MAX, выполнен вход в ваш аккаунт MAX и включены уведомления MAX.
        </p>
        <div className="notice small">
          <strong>Как Android будет работать после настройки:</strong>
          <ul className="compact-list">
            <li>Телефон остаётся включённым и подключённым к интернету: Wi-Fi или мобильная сеть.</li>
            <li>MAX должен получать уведомления на этом Android. Если MAX не залогинен или уведомления MAX выключены, пересылать будет нечего.</li>
            <li>MAX и “Макс Пуш” можно свернуть, но не нужно принудительно закрывать. Для стабильной работы отключите экономию батареи для MAX и “Макс Пуш”.</li>
            <li>APK читает только уведомления MAX и отправляет на iPhone отправителя/чат без текста сообщения.</li>
          </ul>
        </div>
        <div className="row">
          {localApkHref && <a className="button" href={localApkHref}>Скачать локальный APK</a>}
          <a className={localApkHref ? "button secondary" : "button"} href="/download/max-push-latest.apk">Скачать MaxPush APK</a>
          <Link className="button secondary" href="/app">Перейти к iPhone PWA</Link>
        </div>
        {localApkHref && (
          <p className="small muted">
            Для проверки сейчас используйте локальный APK: он отправляет события на этот Mac в вашей Wi-Fi сети. APK для notifymax.ru нужен после выкладки на HTTPS-домен.
          </p>
        )}
        <h2>Порядок подключения</h2>
        <ol className="steps">
          <li>Возьмите Android-телефон, где уже установлен MAX и выполнен вход в нужный аккаунт.</li>
          <li>Нажмите “Скачать MaxPush APK” на этом Android.</li>
          <li>Разрешите браузеру установку APK, если Android попросит.</li>
          <li>Откройте приложение “Макс Пуш”. Пока QR не сканируйте.</li>
          <li>На iPhone откройте <strong>notifymax.ru</strong>, нажмите “Открыть iPhone PWA”, добавьте PWA на экран “Домой” и включите уведомления.</li>
          <li>На iPhone нажмите “Показать QR для Android”.</li>
          <li>На Android в “Макс Пуш” нажмите “Сканировать QR-код с iPhone”.</li>
          <li>После успешного подключения на Android нажмите “Включить доступ к уведомлениям”.</li>
          <li>Если Android пишет “Доступ к настройкам ограничен”, откройте “О приложении Макс Пуш”, нажмите меню ⋮ и выберите “Разрешить ограниченные настройки”. Затем вернитесь и снова включите доступ к уведомлениям.</li>
          <li>Нажмите “Отправить тест” на Android. На iPhone должен прийти push “MAX: Тест”.</li>
        </ol>
        <div className="notice">
          <strong>Безопасность:</strong> Android выдаёт системный доступ к уведомлениям, но Макс Пуш фильтрует только package MAX. Текст сообщений, SMS, банки, контакты, фото, звонки и другие приложения не отправляются на сервер.
        </div>
      </section>
    </main>
  );
}
