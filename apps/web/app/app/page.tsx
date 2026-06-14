"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";

type PairState = {
  pairing_code: string;
  expires_at: string;
  qr_payload: string;
};

type RecentNotification = {
  id: string;
  sender: string | null;
  created_at: string;
};

type DeviceStatus = {
  pwa_subscriptions_count: number;
  android_device: null | {
    id: string;
    name: string | null;
    active: boolean;
    last_seen_at: string | null;
  };
};

const REQUEST_TIMEOUT_MS = 10000;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

function errorText(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return "Сервер не ответил за 10 секунд.";
  if (error instanceof Error) return error.message;
  return "Неизвестная ошибка.";
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
}

function getCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const csrf = typeof document !== "undefined" ? getCookie("mp_csrf") : undefined;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRF-Token": csrf } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AppPage() {
  const [ready, setReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pair, setPair] = useState<PairState | null>(null);
  const [devices, setDevices] = useState<DeviceStatus | null>(null);
  const [recent, setRecent] = useState<RecentNotification[]>([]);
  const [message, setMessage] = useState<string>("");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  const canPush = useMemo(() => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window, []);

  async function loadDevices() {
    const res = await fetchWithTimeout("/api/devices");
    if (res.ok) setDevices(await res.json());
  }

  async function loadRecent() {
    const res = await fetchWithTimeout("/api/notifications/recent");
    if (res.ok) setRecent(await res.json());
  }

  async function prepareSession() {
    setMessage("");
    await postJson("/api/session", {});
    setSessionReady(true);
    await Promise.allSettled([loadDevices(), loadRecent()]);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      setStandalone(isStandalone());
      setPushEnabled(typeof Notification !== "undefined" && Notification.permission === "granted");
      setReady(true);
      try {
        await prepareSession();
      } catch (e) {
        if (!active) return;
        setSessionReady(false);
        setMessage(`Не удалось подготовить сессию: ${errorText(e)}`);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!pair) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/pair/status?code=${encodeURIComponent(pair.pairing_code)}`);
      if (res.ok) {
        const status = await res.json();
        if (status.paired) {
          setMessage(`Android подключён: ${status.android_device_name || "устройство"}`);
          setPair(null);
          await loadDevices();
        }
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [pair]);

  async function enablePush() {
    try {
      setMessage("");
      if (!sessionReady) {
        setMessage("Сначала нужно подготовить сессию. Нажмите “Повторить подключение”.");
        return;
      }
      if (!canPush) {
        setMessage("Этот браузер не поддерживает Web Push.");
        return;
      }
      if (!standalone && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setMessage("На iPhone сначала добавьте сайт на экран «Домой» и откройте его как приложение.");
        return;
      }
      if (!vapidKey) {
        setMessage("Не задан NEXT_PUBLIC_VAPID_PUBLIC_KEY. Заполните VAPID keys в .env.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Уведомления не разрешены.");
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
      await postJson("/api/push/subscribe", subscription.toJSON());
      setPushEnabled(true);
      setMessage("Push-уведомления включены.");
      await loadDevices();
    } catch (e) {
      setMessage(`Не удалось включить push: ${errorText(e)}`);
    }
  }

  async function startPairing() {
    setMessage("");
    if (!sessionReady) {
      setMessage("Сначала нужно подготовить сессию. Нажмите “Повторить подключение”.");
      return;
    }
    const data = await postJson<PairState>("/api/pair/start", {});
    setPair(data);
    if (!pushEnabled) {
      setMessage("QR создан. Android можно подключить сейчас, но для доставки на iPhone нужно включить push-уведомления в PWA.");
    }
  }

  async function disconnectAndroid() {
    await postJson("/api/devices/disconnect", {});
    setMessage("Android отключён.");
    setPair(null);
    await loadDevices();
  }

  async function deleteAccount() {
    if (!confirm("Удалить устройства, подписки и историю уведомлений?")) return;
    await postJson("/api/account/delete", {});
    setMessage("Данные удалены. Обновите страницу для новой сессии.");
    setPair(null);
    setDevices(null);
    setRecent([]);
  }

  if (!ready) {
    return <main className="container"><section className="card">Загрузка…</section></main>;
  }

  return (
    <main className="container stack">
      <section className="card stack">
        <h1>Макс Пуш</h1>
        <p className="muted">Дубликаты уведомлений MAX с Android на iPhone. Текст сообщений не передаётся — только отправитель или название чата.</p>
        {!standalone && (
          <div className="notice small">
            <strong>Для iPhone:</strong> откройте сайт в Safari, нажмите “Поделиться”, выберите “На экран Домой”, затем откройте “Макс Пуш” с экрана Домой.
          </div>
        )}
        <div className="notice privacy small">
          <strong>Приватность:</strong> Android выдаёт приложению системный доступ к уведомлениям, но Макс Пуш в коде принимает только package MAX и не читает текст сообщения. На сервер отправляются только технический ID, отправитель/чат и время.
        </div>
        <div className="row">
          <span className={sessionReady ? "badge ok" : "badge warn"}>Сессия: {sessionReady ? "готова" : "не готова"}</span>
          <span className={pushEnabled ? "badge ok" : "badge warn"}>iPhone push: {pushEnabled ? "включён" : "не включён"}</span>
          <span className={devices?.android_device ? "badge ok" : "badge warn"}>Android: {devices?.android_device ? "подключён" : "не подключён"}</span>
        </div>
        <div className="row">
          <button className="button" onClick={enablePush} disabled={pushEnabled}>Включить уведомления</button>
          <button className="button secondary" onClick={startPairing}>Показать QR для Android</button>
          <button className="button secondary" onClick={loadRecent}>Обновить историю</button>
          {!sessionReady && <button className="button secondary" onClick={() => prepareSession().catch((e) => setMessage(`Не удалось подготовить сессию: ${errorText(e)}`))}>Повторить подключение</button>}
        </div>
        {message && <p className="small muted">{message}</p>}
      </section>

      {pair && (
        <section className="card stack">
          <h2>Подключение Android</h2>
          <p className="muted">Откройте Android-приложение “Макс Пуш” и отсканируйте QR. Код одноразовый и действует 5 минут.</p>
          <QRCodeCanvas value={pair.qr_payload} size={220} />
          <p>Код для ручного ввода:</p>
          <div className="code">{pair.pairing_code}</div>
          <p className="small muted">Код действует до {new Date(pair.expires_at).toLocaleTimeString()}.</p>
        </section>
      )}

      <section className="card stack">
        <h2>Как это работает</h2>
        <ol className="steps">
          <li>Добавьте PWA на экран “Домой” на iPhone и включите уведомления.</li>
          <li>Установите Android APK на телефон, где уже стоит MAX.</li>
          <li>Свяжите Android с iPhone через одноразовый QR-код.</li>
          <li>Разрешите Android-доступ к уведомлениям для “Макс Пуш”.</li>
        </ol>
        <p className="small muted">Сервис не восстанавливает push внутри официального MAX. Он отправляет внешний дубликат на вашу PWA.</p>
      </section>

      <section className="card stack">
        <h2>Статус</h2>
        <p>Подписок iPhone: {devices?.pwa_subscriptions_count ?? 0}</p>
        <p>Android: {devices?.android_device?.name || "не подключён"}</p>
        {devices?.android_device?.last_seen_at && <p>Последняя активность: {new Date(devices.android_device.last_seen_at).toLocaleString()}</p>}
        <div className="row">
          <button className="button secondary" onClick={disconnectAndroid}>Отключить Android</button>
          <button className="button danger" onClick={deleteAccount}>Удалить мои данные</button>
        </div>
      </section>

      <section className="card stack">
        <h2>Последние уведомления</h2>
        {recent.length === 0 ? <p className="muted">Пока нет уведомлений.</p> : (
          <ul className="list">
            {recent.map((item) => (
              <li key={item.id}>
                <strong>{item.sender ? `MAX: ${item.sender}` : "MAX"}</strong>
                <div className="small muted">Новое уведомление · {new Date(item.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
