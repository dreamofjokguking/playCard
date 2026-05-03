const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^"(.*)"$/, '$1');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required in .env.local');
  }

  await mongoose.connect(mongoUri, { dbName: 'dreamofjokguking' });

  const userSchema = new mongoose.Schema(
    {
      clubRoomId: String,
      kakaoId: String,
      nickname: String,
      displayName: String,
      role: String,
      status: String,
      profileImage: String,
      currentTitle: String,
      titleHistory: Array,
      favoriteGroup: Boolean
    },
    { timestamps: true, versionKey: false }
  );
  const clubRoomSchema = new mongoose.Schema(
    {
      name: String,
      sportType: String,
      ownerId: String,
      managers: [String],
      positionMetrics: [
        {
          key: String,
          label: String,
          isActive: Boolean,
          order: Number
        }
      ]
    },
    { timestamps: true, versionKey: false }
  );
  const matchSchema = new mongoose.Schema(
    {
      clubRoomId: String,
      date: Date,
      time: String,
      venue: String,
      participants: [String],
      status: String,
      evaluationDeadline: Date,
      evaluationsSubmitted: [String],
      mvpVotes: Array,
      results: Object,
      createdBy: String
    },
    { timestamps: true, versionKey: false }
  );
  const evaluationSchema = new mongoose.Schema(
    {
      clubRoomId: String,
      matchId: String,
      evaluatorId: String,
      ratings: Array,
      mvpPick: String,
      submittedAt: Date
    },
    { timestamps: true, versionKey: false }
  );

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const ClubRoom = mongoose.models.ClubRoom || mongoose.model('ClubRoom', clubRoomSchema);
  const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
  const Evaluation = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);

  const ownerId = '665000000000000000000001';
  const player2Id = '665000000000000000000002';
  const player3Id = '665000000000000000000003';

  const clubRoomId = '665000000000000000000101';
  const matchId = '665000000000000000000201';

  await User.updateOne(
    { _id: ownerId },
    {
      $set: {
        _id: ownerId,
        clubRoomId,
        kakaoId: 'seed-kakao-owner',
        nickname: '테스터1',
        displayName: '테스터1',
        role: 'service_admin',
        status: 'active',
        favoriteGroup: true
      }
    },
    { upsert: true }
  );

  await User.updateOne(
    { _id: player2Id },
    {
      $set: {
        _id: player2Id,
        clubRoomId,
        kakaoId: 'seed-kakao-player2',
        nickname: '테스터2',
        displayName: '테스터2',
        role: 'member',
        status: 'active',
        favoriteGroup: false
      }
    },
    { upsert: true }
  );

  await User.updateOne(
    { _id: player3Id },
    {
      $set: {
        _id: player3Id,
        clubRoomId,
        kakaoId: 'seed-kakao-player3',
        nickname: '테스터3',
        displayName: '테스터3',
        role: 'member',
        status: 'active',
        favoriteGroup: false
      }
    },
    { upsert: true }
  );

  await ClubRoom.updateOne(
    { _id: clubRoomId },
    {
      $set: {
        _id: clubRoomId,
        name: 'SPM-6 평가 테스트 클럽룸',
        sportType: 'soccer',
        ownerId,
        managers: [ownerId],
        positionMetrics: [
          { key: 'attack', label: '공격', isActive: true, order: 1 },
          { key: 'defense', label: '수비', isActive: true, order: 2 },
          { key: 'pass', label: '패스', isActive: true, order: 3 }
        ]
      }
    },
    { upsert: true }
  );

  await Match.updateOne(
    { _id: matchId },
    {
      $set: {
        _id: matchId,
        clubRoomId,
        date: new Date(),
        time: '19:00',
        venue: '테스트구장',
        participants: [ownerId, player2Id, player3Id],
        status: 'evaluating',
        evaluationsSubmitted: [],
        mvpVotes: [],
        createdBy: ownerId
      },
      $unset: { results: 1 }
    },
    { upsert: true }
  );

  await Evaluation.deleteMany({ matchId });

  console.log('Seed completed.');
  console.log(`Login userId: ${ownerId}`);
  console.log(`Other participants: ${player2Id}, ${player3Id}`);
  console.log(`MatchId: ${matchId}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

