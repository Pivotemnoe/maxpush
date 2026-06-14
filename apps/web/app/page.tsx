import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <section className="card stack">
        <span className="badge">MVP v0.1</span>
        <h1>Получайте уведомления MAX на iPhone</h1>
        <p className="muted">
          Макс Пуш передаёт уведомления MAX с вашего Android на iPhone. Без текста сообщений — только отправитель или название чата.
        </p>
        <div className="row">
          <Link className="button" href="/app">Подключить iPhone</Link>
          <Link className="button secondary" href="/android">Скачать APK для Android</Link>
        </div>
        <div className="notice small">
          Сервис не восстанавливает push внутри официального приложения MAX. Он отправляет внешний дубликат уведомления на вашу PWA и требует Android-телефон с установленным MAX.
        </div>
      </section>
    </main>
  );
}
