# Полное ТЗ для Codex: «Макс Пуш» MVP v0.1

Создать monorepo проекта “Макс Пуш”.

## Цель

Сервис дублирует уведомления приложения MAX с Android на iPhone через PWA. Android-приложение читает только уведомления MAX и отправляет на сервер только отправителя/название чата. Текст сообщения не читать, не отправлять, не хранить.

## Название

```text
Product name: Макс Пуш
Website: notifymax.ru
Android app label: Макс Пуш
Android package: ru.temichev.maxpush
```

## Архитектура

```text
apps/web      Next.js PWA + backend API routes
apps/android  Native Android Kotlin app
prisma        Prisma schema
docker-compose.yml PostgreSQL для локальной разработки
```

## Приватность

Запрещено собирать, отправлять, логировать или хранить текст уведомления MAX.

Android-разрешение Notification Listener технически даёт широкий системный доступ. Реализация обязана немедленно отбрасывать все уведомления, у которых `packageName != ru.oneme.app`, и не должна иметь UI для выбора других приложений.

Разрешено:

```json
{
  "event_id": "sha256...",
  "sender": "Иван Петров",
  "posted_at": 1710000000,
  "package_name": "ru.oneme.app",
  "privacy_mode": "sender_only"
}
```

Запрещённые поля:

```text
body
text
message
content
notificationText
rawExtras
```

Если Android прислал одно из этих полей, backend обязан вернуть `400`.

Backend также обязан отклонять эти поля во вложенных объектах, даже если весь payload потом был бы отклонён строгой схемой.

## PWA

Страницы:

```text
/         лендинг
/app      основной PWA-экран
/android  скачивание APK
/privacy  политика приватности
/terms    условия использования
```

PWA должна:

- регистрировать service worker;
- получать Web Push subscription;
- показывать QR-код для привязки Android;
- показывать статус Android;
- объяснять, что Android выдаёт широкий системный доступ к уведомлениям, а приложение фильтрует только MAX;
- показывать историю последних уведомлений без текста сообщений;
- позволять отключить Android;
- позволять удалить данные.

Push format:

```text
Title: MAX: {sender}
Body: Новое уведомление
```

Если sender пустой:

```text
Title: MAX
Body: Новое уведомление
```

## Backend API

```text
POST /api/session
POST /api/push/subscribe
POST /api/pair/start
GET  /api/pair/status?code=ABC123
POST /api/pair/confirm
POST /api/android/notification
GET  /api/notifications/recent
GET  /api/devices
POST /api/devices/disconnect
POST /api/account/delete
```

## Android APK

Native Kotlin app.

Экраны:

```text
StartScreen
PairScreen
PermissionScreen
StatusScreen
```

Функции:

- QR pairing;
- ручной ввод pairing code;
- принимать API base URL из QR только если он соответствует production allowlist;
- запрос Notification Listener permission;
- проверка установленного MAX package `ru.oneme.app`;
- NotificationListenerService;
- отправка только sender/title;
- локальная очередь до 100 событий;
- test notification;
- отключение устройства.

Notification mapping:

1. Принимать только `packageName == ru.oneme.app`.
2. Не отправлять `EXTRA_TEXT`.
3. Не отправлять `EXTRA_BIG_TEXT`.
4. Не отправлять raw extras.
5. Sender брать только из:
   - `Notification.EXTRA_TITLE`
   - `Notification.EXTRA_CONVERSATION_TITLE`
   - `Notification.EXTRA_SUB_TEXT`
6. sender чистить: trim, убрать переносы строк, max length 120.

## Acceptance criteria

1. iPhone PWA включает push.
2. PWA показывает QR.
3. Android APK сканирует QR.
4. Android включает доступ к уведомлениям.
5. Test notification приходит на iPhone.
6. MAX notification приходит на iPhone без текста сообщения.
7. Backend отклоняет payload с `body/text/message/content`.
8. Уведомления не от `ru.oneme.app` игнорируются.
9. Пользователь может отключить Android и удалить данные.
10. Production backend не использует default `SESSION_SECRET`.
11. Cookie-auth POST защищены CSRF-токеном.
12. Production Android APK не принимает QR-код с чужим API host.
