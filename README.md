# Макс Пуш — MVP v0.1

Сервис дублирует уведомления приложения MAX с Android на iPhone через PWA.

Главное ограничение приватности: **текст сообщения не отправляется, не хранится и не показывается**. Android-приложение передаёт только отправителя/название чата из заголовка уведомления.

Важное уточнение: Android-разрешение “Доступ к уведомлениям” системно широкое. Приложение “Макс Пуш” фильтрует события на своей стороне и принимает только package MAX `ru.oneme.app`; уведомления других приложений сразу отбрасываются.

```text
MAX на Android
→ APK “Макс Пуш”
→ backend notifymax.ru
→ PWA на iPhone
→ push: “MAX: {отправитель} / Новое уведомление”
```

## Что внутри

```text
apps/web      Next.js PWA + API routes
apps/android  Native Android Kotlin APK
prisma        Prisma schema
scripts       утилиты для сборки/копирования APK
CODEX_TASK.md полное ТЗ для Codex/разработчика
```

## Быстрый локальный запуск web/backend

```bash
cp .env.example apps/web/.env
docker compose up -d
cd apps/web
npm install
npx prisma generate --schema=../../prisma/schema.prisma
npx prisma migrate dev --schema=../../prisma/schema.prisma --name init
npm run dev
```

Откройте:

```text
http://localhost:3000
http://localhost:3000/app
http://localhost:3000/android
```

Для реальных push-уведомлений нужны VAPID-ключи.

Для production обязательно задайте длинный случайный `SESSION_SECRET`. Приложение не стартует с dev/default secret в production.

## Создание VAPID keys

После `npm install` в `apps/web`:

```bash
npx web-push generate-vapid-keys
```

Заполните в `apps/web/.env`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:support@notifymax.ru"
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` и `VAPID_PUBLIC_KEY` должны совпадать.

## Порядок подключения пользователя

1. Открыть `https://notifymax.ru/` на Android, где уже установлен MAX.
2. Скачать и установить APK “Макс Пуш”.
3. Открыть “Макс Пуш” на Android и оставить приложение открытым.
4. Открыть `https://notifymax.ru/` на iPhone, перейти в iPhone PWA, добавить PWA на экран “Домой” и включить уведомления.
5. На iPhone нажать “Показать QR для Android”.
6. На Android нажать “Сканировать QR-код с iPhone”.
7. На Android нажать “Включить доступ к уведомлениям”.
8. Если Android показывает “Доступ к настройкам ограничен”, открыть настройки приложения “Макс Пуш”, нажать меню `⋮` и выбрать “Разрешить ограниченные настройки”.
9. Вернуться в “Макс Пуш” и нажать “Отправить тест”.

## Android debug APK

Нужен установленный Android Studio / Android SDK.

```bash
cd apps/android
./gradlew assembleDebug
```

Для локальной связки Android emulator → локальный Next.js можно собрать APK с явным dev override:

```bash
./gradlew assembleDebug -PmaxPushApiBaseUrl=http://10.0.2.2:3000 -PmaxPushAllowQrBaseUrlOverride=true -PmaxPushAllowCleartextTraffic=true
```

Для публичной раздачи не включайте `maxPushAllowQrBaseUrlOverride`.

Если Gradle wrapper ещё не сгенерирован, откройте проект в Android Studio или выполните Gradle локально:

```bash
gradle wrapper
./gradlew assembleDebug
```

Готовый debug APK:

```text
apps/android/app/build/outputs/apk/debug/app-debug.apk
```

Скопировать его в сайт:

```bash
./scripts/copy-debug-apk.sh
```

После копирования файл будет доступен как:

```text
apps/web/public/download/max-push-latest.apk
```

## Android release APK

Release APK подписывается локальным keystore. Keystore и пароли не коммитятся.

Один раз создайте `apps/android/signing.local.properties`:

```properties
maxPushReleaseStoreFile=keystore/maxpush-release.jks
maxPushReleaseStorePassword=...
maxPushReleaseKeyAlias=maxpush
maxPushReleaseKeyPassword=...
```

Затем:

```bash
cd apps/android
./gradlew assembleRelease
cd ../..
./scripts/copy-release-apk.sh
```

Публичный APK:

```text
apps/web/public/download/max-push-latest.apk
```

Важно: если на Android уже стояла debug-сборка, её нужно удалить перед установкой release APK, потому что подпись другая.

## Проверка MVP

1. Установить APK на Android.
2. Открыть `/app` на iPhone.
3. Добавить PWA на экран “Домой”.
4. Открыть PWA с экрана “Домой”.
5. Нажать “Включить уведомления”.
6. Нажать “Показать QR для Android”.
7. На Android нажать “Сканировать QR-код с iPhone”.
8. Включить доступ к уведомлениям для “Макс Пуш”.
   Если Android показывает “Доступ к настройкам ограничен”, откройте “О приложении Макс Пуш”, нажмите меню `⋮` и выберите “Разрешить ограниченные настройки”. Затем вернитесь в приложение и снова включите доступ к уведомлениям.
9. Нажать “Отправить тест”.
10. На iPhone должен прийти push:

```text
Title: MAX: Тест
Body: Новое уведомление
```

11. Когда на Android приходит уведомление MAX, на iPhone приходит:

```text
Title: MAX: {отправитель}
Body: Новое уведомление
```

## Важные границы

- Приложение не восстанавливает push внутри официального приложения MAX.
- Оно отправляет внешний дубликат уведомления на PWA/iPhone.
- Android APK слушает только package `ru.oneme.app`.
- QR-код привязки не может перенаправить production APK на чужой API-домен.
- Текст сообщения не отправляется.
- Локальная очередь Android хранится в encrypted preferences.
- Официальный логотип MAX не используется.

## Security checklist перед публикацией

- Использовать только HTTPS-домен `notifymax.ru`.
- Сгенерировать `SESSION_SECRET` и VAPID keys на production-сервере, не коммитить `.env`.
- Собирать release APK, а не debug APK, для публичной раздачи.
- Проверить реальные уведомления MAX на Android: `Notification.EXTRA_TITLE`, `EXTRA_CONVERSATION_TITLE`, `EXTRA_SUB_TEXT` не должны содержать текст сообщения.
- Проверить `/privacy` и `/terms` перед публикацией домена.
- Запустить `npm test`, `npm run build`, `./gradlew testDebugUnitTest`.

## Переменные окружения

См. `.env.example`.

## Тесты

Web/backend:

```bash
cd apps/web
npm test
```

Android unit tests:

```bash
cd apps/android
./gradlew testDebugUnitTest
```
