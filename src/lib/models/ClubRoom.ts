import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const PositionMetricSchema = new Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const ClubRoomSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sportType: { type: String, required: true, trim: true, default: 'etc' },
    ownerId: { type: String, required: true, trim: true },
    managers: { type: [String], default: [] },
    positionMetrics: { type: [PositionMetricSchema], default: [] }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type ClubRoomDocument = InferSchemaType<typeof ClubRoomSchema>;

const ClubRoom: Model<ClubRoomDocument> =
  (mongoose.models.ClubRoom as Model<ClubRoomDocument> | undefined) ||
  mongoose.model<ClubRoomDocument>('ClubRoom', ClubRoomSchema);

export default ClubRoom;
