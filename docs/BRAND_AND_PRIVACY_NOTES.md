# Brand and privacy notes

- Не использовать официальный логотип MAX в APK или PWA без отдельного письменного разрешения.
- Публичная формулировка: “дубликаты уведомлений MAX”, а не “восстановление push в MAX”.
- По умолчанию не передавать текст сообщений.
- Android package приложения: `ru.temichev.maxpush`, не имитировать официальный package MAX.
- В интерфейсе не должно быть выбора других приложений.
- Backend должен отклонять любые payload с `body`, `text`, `message`, `content`, `notificationText`, `rawExtras`.
