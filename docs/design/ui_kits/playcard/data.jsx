// PlayCard — Mock data
// 각 선수는 3개 포지션(AT/SE/DF) 점수를 모두 가짐 (포지션 확정 X — 경기마다 어디든 갈 수 있음)
const PLAYERS = [
  { id: "u1",  name: "홍길동", level: 21, rarity: "legendary", title: "네트 위의 암살자", stats: { AT: 9.6, SE: 6.0, DF: 7.4 }, avg: 7.7 },
  { id: "u2",  name: "김민지", level: 12, rarity: "epic",      title: "코트의 지휘자",     stats: { AT: 7.0, SE: 9.2, DF: 7.4 }, avg: 7.9 },
  { id: "u3",  name: "이재훈", level: 9,  rarity: "rare",      title: "서브 머신",        stats: { AT: 8.6, SE: 6.4, DF: 6.5 }, avg: 7.2 },
  { id: "u4",  name: "박철수", level: 4,  rarity: "common",    title: "묵묵한 수비가",     stats: { AT: 5.2, SE: 5.8, DF: 7.6 }, avg: 6.2 },
  { id: "u5",  name: "최서연", level: 7,  rarity: "rare",      title: "은빛 공격수",       stats: { AT: 8.1, SE: 6.4, DF: 6.0 }, avg: 6.8 },
  { id: "u6",  name: "정유진", level: 5,  rarity: "common",    title: "안전제일주의자",    stats: { AT: 5.8, SE: 6.0, DF: 7.4 }, avg: 6.4 },
  { id: "u7",  name: "강도윤", level: 8,  rarity: "rare",      title: "벤치의 황태자",     stats: { AT: 6.8, SE: 7.0, DF: 7.6 }, avg: 7.1 },
  { id: "u8",  name: "윤서아", level: 11, rarity: "epic",      title: "센터의 벽",        stats: { AT: 8.2, SE: 6.8, DF: 7.4 }, avg: 7.5 },
  { id: "u9",  name: "송재원", level: 6,  rarity: "rare",      title: "끈질긴 한방",       stats: { AT: 7.6, SE: 6.0, DF: 6.4 }, avg: 6.7 },
  { id: "u10", name: "한지우", level: 10, rarity: "epic",      title: "마법의 손",        stats: { AT: 7.2, SE: 9.0, DF: 7.0 }, avg: 7.7 },
  { id: "u11", name: "노태경", level: 3,  rarity: "common",    title: "성장중",           stats: { AT: 5.4, SE: 5.6, DF: 6.0 }, avg: 5.7 },
  { id: "u12", name: "백유나", level: 6,  rarity: "rare",      title: "차분한 리시버",     stats: { AT: 5.6, SE: 6.4, DF: 8.4 }, avg: 6.8 },
];

const ME = PLAYERS[1]; // 김민지
const GROWTH = [7.2, 7.8, 7.4, 8.1, 8.0, 8.7];
const TITLE_HISTORY = [
  { title: "코트의 지휘자", date: "10/28", rarity: "epic" },
  { title: "환상의 토스맨", date: "10/21", rarity: "rare" },
  { title: "오늘은 컨디션 회복중", date: "10/14", rarity: "common" },
  { title: "벼락같은 스파이크", date: "10/07", rarity: "epic" },
  { title: "꾸준한 노력가", date: "09/30", rarity: "common" },
];

// Position system (3-pos: 공격수 · 세터 · 수비)
const POSITION_LABEL = { AT: "공격수", SE: "세터", DF: "수비" };
const POSITION_SHORT = { AT: "공", SE: "세", DF: "수" };
const POSITION_COLOR = { AT: "#FFB020", SE: "#A26BFF", DF: "#3A6DFF" };
const POSITION_ORDER = ["AT", "SE", "DF"];

// Team formation by team size
const TEAM_FORMATION = {
  4: { AT: 1, SE: 1, DF: 2 },
  3: { AT: 1, SE: 1, DF: 1 },
};

const TEAM_NAMES_A = ["불사조 군단", "검은 표범", "야생의 늑대", "강철의 송곳니", "맹수의 시간", "황금 사자"];
const TEAM_NAMES_B = ["바람의 후예", "은빛 파도", "푸른 번개", "달빛 무사", "북극성 클럽", "심해의 외침"];

window.PLAYERS = PLAYERS;
window.ME = ME;
window.GROWTH = GROWTH;
window.TITLE_HISTORY = TITLE_HISTORY;
window.POSITION_LABEL = POSITION_LABEL;
window.POSITION_SHORT = POSITION_SHORT;
window.POSITION_COLOR = POSITION_COLOR;
window.POSITION_ORDER = POSITION_ORDER;
window.TEAM_FORMATION = TEAM_FORMATION;
window.TEAM_NAMES_A = TEAM_NAMES_A;
window.TEAM_NAMES_B = TEAM_NAMES_B;
