import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <section className="card stack">
        <span className="badge">MVP v0.1</span>
        <h1>Макс Пуш</h1>
        <p className="muted">
          Настройка начинается с Android: установите APK на телефон, где уже стоит MAX, затем откройте PWA на iPhone и свяжите устройства QR-кодом.
        </p>
        <div className="setup-flow">
          <div className="setup-step">
            <span className="step-number">1</span>
            <div>
              <h2>Android: установить MaxPush</h2>
              <p className="muted small">Откройте эту страницу на Android, скачайте APK и установите приложение “Макс Пуш”.</p>
              <div className="row">
                <a className="button" href="/download/max-push-latest.apk">Скачать APK</a>
                <Link className="button secondary" href="/android">Инструкция Android</Link>
              </div>
            </div>
          </div>
          <div className="setup-step">
            <span className="step-number">2</span>
            <div>
              <h2>iPhone: открыть PWA</h2>
              <p className="muted small">На iPhone откройте PWA, добавьте на экран “Домой” и включите уведомления.</p>
              <Link className="button secondary" href="/app">Открыть iPhone PWA</Link>
            </div>
          </div>
          <div className="setup-step">
            <span className="step-number">3</span>
            <div>
              <h2>Связать QR-кодом</h2>
              <p className="muted small">На iPhone нажмите “Показать QR для Android”. На Android нажмите “Сканировать QR-код с iPhone”.</p>
            </div>
          </div>
          <div className="setup-step">
            <span className="step-number">4</span>
            <div>
              <h2>Разрешить доступ на Android</h2>
              <p className="muted small">В Android-приложении нажмите “Включить доступ к уведомлениям”, включите “Макс Пуш” и отправьте тест.</p>
            </div>
          </div>
        </div>
        <div className="download-box">
          <strong>Прямая ссылка на APK:</strong>
          <a href="/download/max-push-latest.apk">https://notifymax.ru/download/max-push-latest.apk</a>
        </div>
        <div className="notice privacy small">
          <strong>Безопасность:</strong> на сервер отправляются только технический ID, отправитель или название чата и время. Текст сообщений, пароли, SMS, банки, контакты, фото, звонки и уведомления других приложений не отправляются.
        </div>
        <div className="notice small">
          Сервис не восстанавливает push внутри официального приложения MAX. Он отправляет внешний дубликат уведомления на вашу PWA и требует Android-телефон с установленным MAX.
        </div>
      </section>
    </main>
  );
}
