import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true, trim: true, index: true },
    clubRoomId: { type: String, trim: true, default: '' },
    matchId: { type: String, trim: true, default: '' },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    path: { type: String, trim: true, default: '' },
    read: { type: Boolean, default: false, index: true },
    sentAt: { type: Date, required: true, default: Date.now, index: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;

const Notification: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument> | undefined) ||
  mongoose.model<NotificationDocument>('Notification', NotificationSchema);

export default Notification;
