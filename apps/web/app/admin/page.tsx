import { getAdminCredential, getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function messageText(code: string | undefined) {
  if (code === "created") return "Пароль создан. Админка открыта.";
  if (code === "login_error") return "Пароль не подошёл.";
  if (code === "password_changed") return "Пароль изменён. Старые входы сброшены.";
  if (code === "change_error") return "Не удалось сменить пароль. Проверьте текущий пароль и повтор нового пароля.";
  if (code === "logout") return "Вы вышли из админки.";
  return null;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "нет данных";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function StatCard({ title, value, hint }: { title: string; value: number | string; hint: string }) {
  return (
    <div className="stat-card">
      <div className="small muted">{title}</div>
      <strong>{value}</strong>
      <p className="small muted">{hint}</p>
    </div>
  );
}

function PasswordInput({ name, label, autoFocus = false }: { name: string; label: string; autoFocus?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" name={name} type="password" minLength={10} required autoFocus={autoFocus} />
    </label>
  );
}

function SetupView({ message }: { message: string | null }) {
  return (
    <main className="container">
      <section className="card stack">
        <h1>Первичная настройка админки</h1>
        <p className="muted">Задайте пароль. Он будет храниться в базе только как хэш, не открытым текстом.</p>
        {message && <div className="notice small">{message}</div>}
        <form className="form" method="post" action="/api/admin/setup">
          <PasswordInput name="password" label="Новый пароль" autoFocus />
          <PasswordInput name="confirm_password" label="Повторите пароль" />
          <button className="button" type="submit">Создать пароль и войти</button>
        </form>
      </section>
    </main>
  );
}

function LoginView({ message }: { message: string | null }) {
  return (
    <main className="container">
      <section className="card stack">
        <h1>Вход в админку</h1>
        <p className="muted">Введите пароль администратора, чтобы посмотреть статистику сервиса.</p>
        {message && <div className="notice small">{message}</div>}
        <form className="form" method="post" action="/api/admin/login">
          <PasswordInput name="password" label="Пароль" autoFocus />
          <button className="button" type="submit">Войти</button>
        </form>
      </section>
    </main>
  );
}

async function DashboardView({ message }: { message: string | null }) {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    configuredUsers,
    activeSubscriptions,
    activeAndroid,
    android24h,
    android7d,
    events24h,
    events7d,
    eventsTotal,
    delivered24h,
    recentEvents
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({
      where: {
        devices: { some: { type: "android_relay", active: true } },
        pushSubscriptions: { some: { active: true } }
      }
    }),
    prisma.pushSubscription.count({ where: { active: true } }),
    prisma.device.count({ where: { type: "android_relay", active: true } }),
    prisma.device.count({ where: { type: "android_relay", active: true, lastSeenAt: { gte: dayAgo } } }),
    prisma.device.count({ where: { type: "android_relay", active: true, lastSeenAt: { gte: weekAgo } } }),
    prisma.notificationEvent.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.notificationEvent.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.notificationEvent.count(),
    prisma.notificationEvent.count({ where: { deliveredAt: { gte: dayAgo } } }),
    prisma.notificationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        sender: true,
        createdAt: true,
        deliveredAt: true,
        androidDevice: { select: { name: true, lastSeenAt: true } }
      }
    })
  ]);

  return (
    <main className="container stack">
      <section className="card stack">
        <div className="admin-header">
          <div>
            <h1>Админка Макс Пуш</h1>
            <p className="muted">Сводка без текста сообщений и без секретных токенов.</p>
          </div>
          <form method="post" action="/api/admin/logout">
            <button className="button secondary" type="submit">Выйти</button>
          </form>
        </div>
        {message && <div className="notice small">{message}</div>}
        <div className="admin-grid">
          <StatCard title="Всего пользователей" value={totalUsers} hint="Все созданные iPhone-сессии." />
          <StatCard title="Полностью подключены" value={configuredUsers} hint="Есть iPhone push и активный Android." />
          <StatCard title="iPhone push-подписок" value={activeSubscriptions} hint="Куда можно отправлять уведомления." />
          <StatCard title="Android подключено" value={activeAndroid} hint="Активные Android-устройства." />
          <StatCard title="Android активны за 24 часа" value={android24h} hint="Устройства, которые недавно выходили на связь." />
          <StatCard title="Android активны за 7 дней" value={android7d} hint="Пользователи, которые могли пользоваться сервисом на неделе." />
          <StatCard title="Уведомлений за 24 часа" value={events24h} hint="Принято от Android за сутки." />
          <StatCard title="Уведомлений за 7 дней" value={events7d} hint="Принято от Android за неделю." />
          <StatCard title="Всего уведомлений" value={eventsTotal} hint="История с момента запуска." />
          <StatCard title="Доставлено на iPhone за 24 часа" value={delivered24h} hint="Push реально отправлен хотя бы на одну подписку." />
        </div>
      </section>

      <section className="card stack">
        <h2>Последние действия</h2>
        {recentEvents.length === 0 ? (
          <p className="muted">Пока нет событий.</p>
        ) : (
          <ul className="list">
            {recentEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.sender ? `MAX: ${event.sender}` : "MAX"}</strong>
                <div className="small muted">
                  {formatDate(event.createdAt)} · Android: {event.androidDevice.name || "без названия"} · {event.deliveredAt ? "push отправлен на iPhone" : "push не отправлен: нет активной iPhone-подписки или событие не доставлялось"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h2>Сменить пароль</h2>
        <form className="form" method="post" action="/api/admin/change-password">
          <PasswordInput name="current_password" label="Текущий пароль" />
          <PasswordInput name="new_password" label="Новый пароль" />
          <PasswordInput name="confirm_password" label="Повторите новый пароль" />
          <button className="button" type="submit">Сменить пароль</button>
        </form>
      </section>
    </main>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const message = messageText(firstParam(params?.message));
  const credential = await getAdminCredential();
  if (!credential) return <SetupView message={message} />;

  const admin = await getAdminSession();
  if (!admin) return <LoginView message={message} />;

  return <DashboardView message={message} />;
}
