export const DUPLICATE_NOTIFICATION_WINDOW_MS = 1500;

export function duplicateWindowBounds(postedAt: Date, windowMs = DUPLICATE_NOTIFICATION_WINDOW_MS) {
  const timestamp = postedAt.getTime();
  return {
    from: new Date(timestamp - windowMs),
    to: new Date(timestamp + windowMs)
  };
}
