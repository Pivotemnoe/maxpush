# Security checklist

## Secrets

- `.env` files must not be committed.
- `SESSION_SECRET` must be a long random value in production.
- `VAPID_PRIVATE_KEY` must exist only on the backend host.
- Android device tokens are returned once during pairing and only token hashes are stored in PostgreSQL.

## Notification privacy

- Android code must ignore every notification where `packageName != ru.oneme.app`.
- Android code must not read or send `Notification.EXTRA_TEXT`, `Notification.EXTRA_BIG_TEXT`, raw extras, SMS, contacts, calls, photos, or notifications from other apps.
- Backend must reject forbidden fields at any payload depth: `body`, `text`, `message`, `content`, `notificationText`, `rawExtras`.
- Before release, test real MAX notifications and confirm sender fields do not contain message text.

## Pairing and API boundary

- Pairing codes are one-time and expire after 5 minutes.
- Pairing confirmation must claim the code atomically before returning a device token.
- Production Android must only trust `https://notifymax.ru` as API base.
- Public APK distribution must use a signed release build, not debug APK.

## User-facing trust

- PWA and Android screens must clearly say that Android grants broad notification access, while Макс Пуш filters only MAX.
- `/privacy` must list stored and non-stored data.
- `/terms` must say the product is not an official MAX client and does not restore push inside MAX.
