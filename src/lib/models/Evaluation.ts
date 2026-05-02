import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const EvaluationSchema = new Schema(
  {
    clubRoomId: { type: String, required: true, trim: true },
    matchId: { type: String, required: true, trim: true },
    evaluatorId: { type: String, required: true, trim: true },
    ratings: {
      type: [
        new Schema(
          {
            targetUserId: { type: String, required: true, trim: true },
            metricScores: {
              type: [
                new Schema(
                  {
                    metricKey: { type: String, required: true, trim: true },
                    score: { type: Number }
                  },
                  { _id: false }
                )
              ],
              default: []
            },
            absences: { type: [String], default: [] },
            comment: { type: String, trim: true, default: '' }
          },
          { _id: false }
        )
      ],
      default: []
    },
    mvpPick: { type: String, required: true, trim: true },
    submittedAt: { type: Date, required: true, default: Date.now }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

EvaluationSchema.index({ matchId: 1, evaluatorId: 1 }, { unique: true });

export type EvaluationDocument = InferSchemaType<typeof EvaluationSchema>;

const Evaluation: Model<EvaluationDocument> =
  (mongoose.models.Evaluation as Model<EvaluationDocument> | undefined) ||
  mongoose.model<EvaluationDocument>('Evaluation', EvaluationSchema);

export default Evaluation;
