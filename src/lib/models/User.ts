import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const UserSchema = new Schema(
  {
    clubRoomId: { type: String, trim: true, default: '' },
    kakaoId: {
      type: String,
      trim: true,
      index: { unique: true, partialFilterExpression: { kakaoId: { $type: 'string' } } }
    },
    googleId: {
      type: String,
      trim: true,
      index: { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } }
    },
    email: { type: String, trim: true, default: '', lowercase: true },
    nickname: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['service_admin', 'member', 'pending', 'admin'],
      default: 'pending',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true
    },
    profileImage: { type: String, trim: true, default: '' },
    currentTitle: { type: String, trim: true, default: '' },
    currentRarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common'
    },
    titleHistory: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, trim: true },
            matchId: { type: String, required: true, trim: true },
            rarity: {
              type: String,
              enum: ['common', 'rare', 'epic', 'legendary'],
              default: 'common'
            },
            createdAt: { type: Date, required: true, default: Date.now }
          },
          { _id: false }
        )
      ],
      default: []
    },
    favoriteGroup: { type: Boolean, default: false },
    onboardedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument> | undefined) ||
  mongoose.model<UserDocument>('User', UserSchema);

export default User;
