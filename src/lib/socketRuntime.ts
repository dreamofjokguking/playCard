type NotificationPayload = {
  type: string;
  title: string;
  message: string;
  path?: string;
  matchId?: string;
  clubRoomId?: string;
};

type EmitterFn = (userId: string, payload: NotificationPayload) => void;

let notificationEmitter: EmitterFn | null = null;

export function setNotificationEmitter(fn: EmitterFn) {
  notificationEmitter = fn;
}

export function emitNotificationToUser(userId: string, payload: NotificationPayload) {
  if (!notificationEmitter) return;
  notificationEmitter(userId, payload);
}

