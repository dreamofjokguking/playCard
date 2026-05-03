import Notification from '@/lib/models/Notification';

type BroadcastInput = {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  clubRoomId?: string;
  matchId?: string;
  path?: string;
};

export async function broadcastNotification(input: BroadcastInput) {
  const uniqueUserIds = Array.from(new Set(input.userIds.map((v) => v.trim()).filter(Boolean)));
  if (uniqueUserIds.length === 0) return;

  await Notification.insertMany(
    uniqueUserIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      path: input.path ?? '',
      clubRoomId: input.clubRoomId ?? '',
      matchId: input.matchId ?? '',
      read: false,
      sentAt: new Date()
    }))
  );
}
