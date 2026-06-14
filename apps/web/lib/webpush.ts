import webpush from "web-push";
import { prisma } from "./prisma";

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@notifymax.ru";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToUser(userId: string, title: string, body: string) {
  if (!configureWebPush()) {
    console.warn("VAPID keys are not configured. Push skipped.");
    return { sent: 0, skipped: true };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId, active: true }
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        JSON.stringify({ title, body, url: "/app", tag: "max-push" })
      );
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await prisma.pushSubscription.update({ where: { id: sub.id }, data: { active: false } });
      } else {
        console.error("Web push delivery failed", { statusCode: error?.statusCode });
      }
    }
  }
  return { sent, skipped: false };
}
