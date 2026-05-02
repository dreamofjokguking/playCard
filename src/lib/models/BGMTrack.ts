import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const BGMTrackSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true, trim: true },
    uploadedBy: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type BGMTrackDocument = InferSchemaType<typeof BGMTrackSchema>;

const BGMTrack: Model<BGMTrackDocument> =
  (mongoose.models.BGMTrack as Model<BGMTrackDocument> | undefined) ||
  mongoose.model<BGMTrackDocument>('BGMTrack', BGMTrackSchema);

export default BGMTrack;
