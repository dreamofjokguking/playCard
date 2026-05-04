import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const MatchSchema = new Schema(
  {
    clubRoomId: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    venue: { type: String, trim: true, default: '' },
    participants: { type: [String], default: [] },
    teamAssignments: {
      type: [
        new Schema(
          {
            userId: { type: String, required: true, trim: true },
            team: { type: String, enum: ['red', 'blue'], required: true }
          },
          { _id: false }
        )
      ],
      default: []
    },
    status: {
      type: String,
      enum: ['evaluating', 'completed', 'cancelled'],
      default: 'evaluating',
      required: true
    },
    evaluationDeadline: { type: Date },
    positionSubmissions: {
      type: [
        new Schema(
          {
            userId: { type: String, required: true, trim: true },
            selectedMetrics: { type: [String], default: [] },
            submittedAt: { type: Date, required: true, default: Date.now }
          },
          { _id: false }
        )
      ],
      default: []
    },
    evaluationsSubmitted: { type: [String], default: [] },
    mvpVotes: {
      type: [
        new Schema(
          {
            voterId: { type: String, required: true, trim: true },
            selectedUserId: { type: String, required: true, trim: true }
          },
          { _id: false }
        )
      ],
      default: []
    },
    results: {
      type: new Schema(
        {
          playerStats: {
            type: [
              new Schema(
                {
                  userId: { type: String, required: true, trim: true },
                  metricStats: {
                    type: [
                      new Schema(
                        {
                          metricKey: { type: String, required: true, trim: true },
                          avg: { type: Number, required: true },
                          count: { type: Number, required: true }
                        },
                        { _id: false }
                      )
                    ],
                    default: []
                  },
                  overall: { type: Number, required: true, default: 0 },
                  absences: { type: [String], default: [] },
                  mvpCount: { type: Number, required: true, default: 0 },
                  comments: { type: [String], default: [] }
                },
                { _id: false }
              )
            ],
            default: []
          }
        },
        { _id: false }
      )
    },
    createdBy: { type: String, required: true, trim: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type MatchDocument = InferSchemaType<typeof MatchSchema>;

const Match: Model<MatchDocument> =
  (mongoose.models.Match as Model<MatchDocument> | undefined) ||
  mongoose.model<MatchDocument>('Match', MatchSchema);

export default Match;
