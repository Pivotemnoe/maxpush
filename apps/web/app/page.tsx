import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <section className="card stack">
        <span className="badge">MVP v0.1</span>
        <h1>Макс Пуш</h1>
        <p className="muted">
          Один вход для подключения: iPhone открывает PWA, Android скачивает APK. Уведомления MAX дублируются на iPhone без текста сообщений.
        </p>
        <div className="launch-grid">
          <div className="launch-panel">
            <span className="badge ok">iPhone</span>
            <h2>Открыть PWA</h2>
            <p className="muted small">Откройте на iPhone, добавьте на экран “Домой” и включите уведомления.</p>
            <Link className="button" href="/app">Открыть iPhone PWA</Link>
          </div>
          <div className="launch-panel">
            <span className="badge warn">Android</span>
            <h2>Установить APK</h2>
            <p className="muted small">Откройте на Android-телефоне, где уже установлен MAX, и скачайте APK.</p>
            <a className="button" href="/download/max-push-latest.apk">Скачать APK</a>
            <Link className="button secondary" href="/android">Инструкция для Android</Link>
          </div>
        </div>
        <div className="download-box">
          <strong>Прямая ссылка на APK:</strong>
          <a href="/download/max-push-latest.apk">https://notifymax.ru/download/max-push-latest.apk</a>
        </div>
        <div className="notice small">
          Сервис не восстанавливает push внутри официального приложения MAX. Он отправляет внешний дубликат уведомления на вашу PWA и требует Android-телефон с установленным MAX.
        </div>
      </section>
    </main>
  );
}
