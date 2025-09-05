// server/services/socket.service.js
import { randomUUID } from "crypto";

// ===== In-memory stores =====
const MAX_RECENT = 100;
/** @type {Map<string, Array<{id:string, roomId:string, nickname:string, text:string, createdAt:string}>>} */
const recentByRoom = new Map();
/** @type {Map<string, Set<string>>} messageId -> Set<nickname> */
const reactionsByMsg = new Map();
/** @type {Map<string, { label?: "열정"|"정직"|"창의"|"존중", labels?: string[], scores?: Record<string, number>, summary?: string, method?: string, confidence?: number, score?: number, state: "PENDING"|"DONE"|"ERROR" }>} */
const aiByMsg = new Map();

/** @type {Map<string, { createdAt:number, roomId:string, perUser: Record<string, { nickname:string, totalMessages:number, totalReactions:number, labels: Record<string, number>, topReacted?: { messageId:string, text:string, reactionsCount:number, createdAt:string } }>, ranking: Array<{ nickname:string, rank:number, score:number, totalMessages:number, totalReactions:number, labels: Record<string, number> }> }>} */
const resultsByRoom = new Map();
/** @type {Map<string, { roomId:string, rank:number, score:number, totalMessages:number, totalReactions:number, labels: Record<string, number>, createdAt:number, topReacted?: { messageId:string, text:string, reactionsCount:number, createdAt:string } }>} */
const lastResultByUser = new Map();

// ===== Config / constants =====
const ALLOWED_LABELS = new Set(["열정","정직","창의","존중"]);
const MIN_AI_SCORE = Number(process.env.AI_MIN_SCORE || 0.6);
// 로컬 테스트용 엔드포인트 (환경변수 사용 시 교체)
// const AI_ENDPOINT = process.env.AI_ENDPOINT;
const AI_ENDPOINT = "http://localhost:8000";
const AI_API_KEY = process.env.AI_API_KEY;

// ===== Room lifetime =====
const ROOM_MAX_AGE_MS = Number(process.env.ROOM_MAX_AGE_MS || 25 * 60 * 1000); // 기본 25분

// ===== Test Bot (per-room, optional) =====
const BOT_ENABLED = process.env.CHAT_TEST_BOT !== '0';
const BOT_INTERVAL_MS = Number(process.env.CHAT_TEST_BOT_INTERVAL_MS || 10000);
const BOT_MESSAGES = [
  "테스트용 멘트입니다.",
  "이 주제에 대해 어떻게 생각하세요?",
  "한 줄 요약 가능하신가요?",
  "관련 사례가 있을까요?",
  "근거를 조금 더 구체화해볼까요?",
  "반대 관점도 들어보고 싶어요.",
  "참여해주셔서 감사합니다!",
];
function pickBotMessage() {
  return BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
}
function makeBotNickname(roomId) {
  // roomId 기준 고정 닉네임 생성(방마다 1봇)
  const suffix = Math.abs([...roomId].reduce((a, c) => (a * 33 + c.charCodeAt(0)) | 0, 7)).toString().slice(-4);
  return `봇(테스트)#${suffix}`;
}

// ===== Room state for AI mentor (silence tracking, topic, cooldown) =====
const COOLDOWN_SEC = Number(process.env.AI_MENT_COOLDOWN_SEC || 60);
const SILENCE_THRESHOLD_SEC = Number(process.env.AI_MENT_SILENCE_SEC || 45);       // room-level silence
const USER_SILENCE_THRESHOLD_SEC = Number(process.env.AI_USER_SILENCE_SEC || 60);  // per-user silence
/**
 * @typedef {{ topic?: string, lastMessageAt?: number, cooldownUntil?: number, userLastAt: Map<string, number>, rollingSummary?: string,
 *            topicNextAt?: number, topicIntervalMs?: number, encourageCooldownByUser?: Map<string, number>, botTimer?: any, botNickname?: string,
 *            createdAt?: number, expireAt?: number, expireTimer?: any }} RoomState
 */
/** @type {Map<string, RoomState>} */
const roomStates = new Map();

function getRoomState(roomId) {
  let st = roomStates.get(roomId);
  if (!st) {
    st = {
      userLastAt: new Map(),
      lastMessageAt: Date.now(),
      topicNextAt: Date.now(),
      topicIntervalMs: 180000,
      encourageCooldownByUser: new Map(),
      botTimer: null,
      botNickname: makeBotNickname(roomId),
      createdAt: Date.now(),
      expireAt: Date.now() + ROOM_MAX_AGE_MS,
      expireTimer: null,
    };
    roomStates.set(roomId, st);
  }
  return st;
}

// ===== Helpers =====
function pushRecent(roomId, msg) {
  const arr = recentByRoom.get(roomId) ?? [];
  arr.push(msg);
  if (arr.length > MAX_RECENT) arr.shift();
  recentByRoom.set(roomId, arr);
}
function getReactionSet(messageId) {
  let set = reactionsByMsg.get(messageId);
  if (!set) {
    set = new Set();
    reactionsByMsg.set(messageId, set);
  }
  return set;
}
function findRoomIdByMessageId(messageId) {
  for (const [roomId, arr] of recentByRoom.entries()) {
    if (arr.some(m => m.id === messageId)) return roomId;
  }
  return null;
}

function calcUserScore(u) {
  // 가중치: 반응 3, 라벨합 1, 메시지 0.5
  const labelSum = Object.values(u.labels || {}).reduce((a,b)=>a+(b||0),0);
  return (u.totalReactions||0)*3 + labelSum*1 + (u.totalMessages||0)*0.5;
}

// ---- Room cleanup: when room has no connected clients (only AI/bot would remain) ----
function cleanupRoomIfEmpty(io, roomId) {
  const ns = io.of('/chat');
  const roomKey = `room:${roomId}`;
  const room = ns.adapter.rooms.get(roomKey);
  // if room exists and has clients, do nothing
  if (room && room.size > 0) return false;

  // stop test bot if running
  const st = roomStates.get(roomId);
  if (st?.botTimer) {
    clearInterval(st.botTimer);
    st.botTimer = null;
  }
  if (st?.expireTimer) {
    clearTimeout(st.expireTimer);
  }

  // remove per-user cooldown map etc.
  roomStates.delete(roomId);

  // purge in-memory messages and per-message maps
  const msgs = recentByRoom.get(roomId) || [];
  for (const m of msgs) {
    reactionsByMsg.delete(m.id);
    aiByMsg.delete(m.id);
  }
  recentByRoom.delete(roomId);

  return true;
}

// ---- Room expiry helpers ----
function expireRoom(io, roomId) {
  const ns = io.of('/chat');
  const roomKey = `room:${roomId}`;
  // 알림 브로드캐스트
  ns.to(roomKey).emit('room:expired', { roomId, reason: 'max_age', maxAgeMs: ROOM_MAX_AGE_MS });

  // 방의 모든 소켓을 방에서 제거 (글로벌 연결은 유지)
  const room = ns.adapter.rooms.get(roomKey);
  if (room) {
    for (const socketId of room) {
      const s = ns.sockets.get(socketId);
      if (s) s.leave(roomKey);
    }
  }

  // 결과 집계 (per user)
  const msgs = recentByRoom.get(roomId) || [];
  const perUser = {};
  for (const m of msgs) {
    const nick = m.nickname || '익명';
    if (!perUser[nick]) perUser[nick] = {
      nickname: nick,
      totalMessages: 0,
      totalReactions: 0,
      labels: { 정직:0, 창의:0, 존중:0, 열정:0 },
      topReacted: undefined,
    };
    perUser[nick].totalMessages += 1;
    const set = reactionsByMsg.get(m.id);
    const rc = set ? set.size : 0;
    perUser[nick].totalReactions += rc;
    // update most-reacted message per user
    if (!perUser[nick].topReacted || rc > perUser[nick].topReacted.reactionsCount) {
      perUser[nick].topReacted = {
        messageId: m.id,
        text: m.text,
        reactionsCount: rc,
        createdAt: m.createdAt,
      };
    }
    const ai = aiByMsg.get(m.id);
    if (ai?.labels && Array.isArray(ai.labels)) {
      for (const l of ai.labels) if (ALLOWED_LABELS.has(l)) perUser[nick].labels[l] = (perUser[nick].labels[l]||0) + 1;
    } else if (ai?.label && ALLOWED_LABELS.has(ai.label)) {
      perUser[nick].labels[ai.label] = (perUser[nick].labels[ai.label]||0) + 1;
    }
  }
  // 랭킹 계산
  const rankingArr = Object.values(perUser).map(u => ({
    nickname: u.nickname,
    totalMessages: u.totalMessages,
    totalReactions: u.totalReactions,
    labels: u.labels,
    score: calcUserScore(u)
  })).sort((a,b)=> b.score - a.score);
  let rank = 1; let lastScore = null; let sameCount = 0;
  for (let i=0;i<rankingArr.length;i++) {
    const s = rankingArr[i].score;
    if (lastScore === null) { rank = 1; sameCount = 1; lastScore = s; }
    else if (s === lastScore) { sameCount++; }
    else { rank += sameCount; sameCount = 1; lastScore = s; }
    rankingArr[i].rank = rank;
  }
  const createdAt = Date.now();
  resultsByRoom.set(roomId, { createdAt, roomId, perUser, ranking: rankingArr });
  for (const r of rankingArr) {
    lastResultByUser.set(r.nickname, {
      roomId,
      rank: r.rank,
      score: r.score,
      totalMessages: r.totalMessages,
      totalReactions: r.totalReactions,
      labels: r.labels,
      createdAt,
      topReacted: perUser[r.nickname]?.topReacted,
    });
  }

  // 전체 총평을 한 번 생성(성공/실패와 무관하게 이후 정리 진행)
  const genPromise = import('./review.service.js')
    .then(mod => mod.generateOverallSummary?.(roomId, { force: false }).catch(() => {}))
    .catch(() => {});

  genPromise.finally(() => {
    // 데이터 정리 및 봇 중지
    cleanupRoomIfEmpty(io, roomId);
  });
}

function ensureRoomExpiry(io, roomId) {
  const st = getRoomState(roomId);
  if (st.expireTimer) return;
  const now = Date.now();
  const delay = Math.max(0, (st.expireAt ?? (now + ROOM_MAX_AGE_MS)) - now);
  st.expireTimer = setTimeout(() => {
    expireRoom(io, roomId);
  }, delay);
}

// ---- Per-room test bot ----
function ensureRoomBot(io, roomId) {
  if (!BOT_ENABLED) return;
  const st = getRoomState(roomId);
  if (st.botTimer) return; // already running
  const nickname = st.botNickname || makeBotNickname(roomId);
  st.botNickname = nickname;

  st.botTimer = setInterval(() => {
    try {
      const text = pickBotMessage();
      const msg = {
        id: randomUUID(),
        roomId,
        nickname,
        text,
        createdAt: new Date().toISOString(),
      };
      const now = Date.now();
      st.lastMessageAt = now;
      st.userLastAt.set(nickname, now);
      pushRecent(roomId, msg);
      io.of('/chat').to(`room:${roomId}`).emit('message:new', { ...msg, reactedUsers: [], reactionsCount: 0 });
      classifyAndBroadcast(io, msg);
    } catch (e) {
      // swallow errors to keep interval alive
    }
  }, BOT_INTERVAL_MS);
}

// ---- AI simulator (when external AI server is not configured) ----
function simulateAiClassification() {
  const delay = 80 + Math.floor(Math.random() * 320);
  return new Promise((resolve) => {
    setTimeout(() => {
      const score = Math.random();
      const labels = Array.from(ALLOWED_LABELS);
      const label = score >= MIN_AI_SCORE ? labels[Math.floor(Math.random() * labels.length)] : undefined;
      resolve({ label, score });
    }, delay);
  });
}

// ---- Build prompt context from recent messages & room state ----
function buildMentContext(roomId) {
  const now = Date.now();
  const state = getRoomState(roomId);
  const base = recentByRoom.get(roomId) ?? [];
  // 최근 20개만 사용
  const recent = base.slice(Math.max(0, base.length - 20));

  // 침묵 사용자 계산
  const silentUsers = [];
  for (const [nick, ts] of state.userLastAt.entries()) {
    const sec = Math.floor((now - ts) / 1000);
    if (sec >= USER_SILENCE_THRESHOLD_SEC) {
      silentUsers.push({ nickname: nick, silenceSec: sec });
    }
  }
  // 침묵 긴 순 정렬
  silentUsers.sort((a, b) => b.silenceSec - a.silenceSec);

  return {
    roomId,
    topic: state.topic || "",
    recent,
    silentUsers,
    lastMessageGapSec: Math.floor((now - (state.lastMessageAt || now)) / 1000)
  };
}

// ---- AI mentor simulators (topic + per-user encourage) ----
function simulateTopicMent(context) {
  const { topic } = context;
  const delay = 120 + Math.floor(Math.random() * 380);
  return new Promise((resolve) => {
    setTimeout(() => {
      const prompts = [
        `${topic ? `“${topic}” 맥락에서 ` : ""}지금까지 의견을 종합하면 어떤 선택지가 있나요?`,
        `방금 논의한 내용을 근거/예시와 함께 한 단계 더 구체화해 볼까요?`,
        `${topic ? `“${topic}”와 관련해 ` : ""}반대 관점에서 보면 어떤 리스크가 있을까요?`
      ];
      const text = prompts[Math.floor(Math.random() * prompts.length)];
      resolve({ id: randomUUID(), type: "topic_comment", text, targets: [], createdAt: new Date().toISOString() });
    }, delay);
  });
}

function simulateEncourageMent(context, targetNick) {
  const { topic } = context;
  const delay = 120 + Math.floor(Math.random() * 380);
  return new Promise((resolve) => {
    setTimeout(() => {
      const text = `@${targetNick} 님, ${topic ? `주제 “${topic}”에 대해 ` : ""}생각을 공유해 주실 수 있을까요? 한 줄 의견도 좋아요!`;
      resolve({ id: randomUUID(), type: "encourage", text, targets: [targetNick], createdAt: new Date().toISOString() });
    }, delay);
  });
}

// --- Split mentor generators ---
async function generateTopicMentAndBroadcast(io, roomId) {
  const state = getRoomState(roomId);
  const context = buildMentContext(roomId);
  let topicMent;
  if (AI_ENDPOINT) {
    try {
      const res = await fetch(AI_ENDPOINT + "/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(AI_API_KEY ? { "Authorization": `Bearer ${AI_API_KEY}` } : {})
        },
        body: JSON.stringify({
          intent: "ai_mentor_topic",
          roomId: context.roomId,
          topic: context.topic,
          recentMessages: context.recent.map(m => ({ nickname: m.nickname, text: m.text, aiLabel: (aiByMsg.get(m.id) || {}).label })),
          lastMessageGapSec: context.lastMessageGapSec,
          maxTokens: 120,
          style: "topic_comment",
          nickname: "",
          user_id: "",
          idle_time: 0,
        })
      });
      if (!res.ok) throw new Error(`AI mentor(topic) http ${res.status}`);
      const data = await res.json();
      topicMent = {
        id: randomUUID(),
        type: data?.type || "topic_comment",
        text: data?.question || "논의를 이어가기 위한 질문을 제안합니다.",
        targets: Array.isArray(data?.targets) ? data.targets : [],
        createdAt: new Date().toISOString()
      };
    } catch (e) {
      topicMent = await simulateTopicMent(context);
    }
  } else {
    topicMent = await simulateTopicMent(context);
  }
  if (topicMent) io.of("/chat").to(`room:${roomId}`).emit("ai:ment", { roomId, ...topicMent });
  return Boolean(topicMent);
}

async function generateEncouragesAndBroadcast(io, roomId) {
  const state = getRoomState(roomId);
  const now = Date.now();
  const ENCOURAGE_COOLDOWN_MS = 30000; // per-user cooldown
  const byUser = state.encourageCooldownByUser || new Map();

  if (!state.encourageCooldownByUser) state.encourageCooldownByUser = byUser;

  const context = buildMentContext(roomId);

  const silentUsers = context.silentUsers || [];

  let count = 0;
  for (const su of silentUsers) {

    const until = byUser.get(su.nickname) || 0;
    if (until > now) {
      continue; // still in cooldown for this user
    }
    let enc;
    if (AI_ENDPOINT) {

      console.log("침묵자")
      try {
        const res = await fetch(AI_ENDPOINT + "/question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(AI_API_KEY ? { "Authorization": `Bearer ${AI_API_KEY}` } : {})
          },
          body: JSON.stringify({
            intent: "ai_mentor_encourage",
            roomId: context.roomId,
            topic: context.topic,
            target: su.nickname,
            silenceSec: su.silenceSec,
            recentMessages: context.recent.map(m => ({ nickname: m.nickname, text: m.text, aiLabel: (aiByMsg.get(m.id) || {}).label })),
            maxTokens: 80,
            style: "encouraging",
            nickname: su.nickname,
            user_id: "test_id",
            idle_time: su.silenceSec,
          })
        });
        if (!res.ok) throw new Error(`AI mentor(encourage) http ${res.status}`);
        const data = await res.json();
        enc = {
          id: randomUUID(),
          type: data?.type || "encourage",
          text: data?.question || `@${su.nickname} 님, 의견을 들려주실 수 있을까요?`,
          targets: Array.isArray(data?.targets) && data.targets.length ? data.targets : [su.nickname],
          createdAt: new Date().toISOString()
        };
      } catch (e) {
        enc = await simulateEncourageMent(context, su.nickname);
      }
    } else {
      enc = await simulateEncourageMent(context, su.nickname);
    }
    if (enc) {
      io.of("/chat").to(`room:${roomId}`).emit("ai:ment", { roomId, ...enc });
      count += 1;
      byUser.set(su.nickname, Date.now() + ENCOURAGE_COOLDOWN_MS);
    }
  }
  return count;
}

async function generateMentAndBroadcast(io, roomId) {
  // 토픽 멘트 1개 + 침묵자 멘트 N개를 한 번에 요청
  const sentTopic = await generateTopicMentAndBroadcast(io, roomId);
  const sentEnc = await generateEncouragesAndBroadcast(io, roomId);
  return Boolean(sentTopic || sentEnc);
}

async function classifyAndBroadcast(io, msg) {
  aiByMsg.set(msg.id, { state: "PENDING" });
  if (!AI_ENDPOINT) {
    // 폴백: 이전 랜덤 시뮬레이터 유지
    try {
      simulateAiClassification().then(({ label, score }) => {
        if (label && score >= MIN_AI_SCORE) {
          aiByMsg.set(msg.id, { label, score, state: "DONE" });
          io.of("/chat").to(`room:${msg.roomId}`).emit("message:ai", {
            messageId: msg.id,
            aiLabel: label,
            aiScore: score
          });
        } else {
          aiByMsg.set(msg.id, { state: "DONE" });
        }
      });
    } catch {
      aiByMsg.set(msg.id, { state: "ERROR" });
    }
    return;
  }
  try {
    const res = await fetch(AI_ENDPOINT + "/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_API_KEY ? { "Authorization": `Bearer ${AI_API_KEY}` } : {})
      },
      body: JSON.stringify({
        messageId: msg.id,
        text: msg.text,
        nickname: msg.nickname,
        roomId: msg.roomId,
        user_id:"test_id"
      })
    });
    if (!res.ok) throw new Error(`AI classify http ${res.status}`);
    const data = await res.json();
    // 기대 형식:
    // { cj_values: {정직:66,...}, primary_trait: ["창의"], summary:"...", method:"...", confidence:0.12 ... }

    const rawValues = data?.cj_values && typeof data.cj_values === 'object' ? data.cj_values : {};
    const primary = Array.isArray(data?.primary_trait)
      ? data.primary_trait
      : (data?.primary_trait ? [data.primary_trait] : []);
    // 점수 정규화 (0~1 또는 0~100 허용)
    const norm = (v) => {
      const n = Number(v);
      if (Number.isNaN(n)) return undefined;
      if (n > 1) return Math.max(0, Math.min(1, n / 100));
      return Math.max(0, Math.min(1, n));
    };

    // 1) primary_trait 우선 채택
    let labels = primary.filter((l) => ALLOWED_LABELS.has(l));

    // 2) 비어 있으면 cj_values에서 임계 이상 라벨을 추출
    if (!labels.length) {
      labels = Object.entries(rawValues)
        .filter(([k, v]) => ALLOWED_LABELS.has(k) && (norm(v) ?? 0) >= MIN_AI_SCORE)
        .sort((a, b) => (norm(b[1]) ?? 0) - (norm(a[1]) ?? 0))
        .map(([k]) => k);
    }

    // 3) 라벨별 정규화 점수 맵
    const scores = {};
    for (const l of labels) {
      const nv = norm(rawValues[l]);
      if (typeof nv === 'number') scores[l] = nv;
    }

    // 4) 최소 임계값 검사
    const hasPassing = Object.values(scores).some((s) => s >= MIN_AI_SCORE);
    if (labels.length && hasPassing) {
      // 메모리 저장(호환을 위해 첫 라벨/점수도 함께 저장)
      const first = labels[0];
      const firstScore = typeof scores[first] === 'number' ? scores[first] : undefined;
      aiByMsg.set(msg.id, {
        labels,
        scores,
        summary: data?.summary,
        method: data?.method,
        confidence: typeof data?.confidence === 'number' ? data.confidence : undefined,
        label: first,
        score: firstScore,
        state: "DONE"
      });
      // 브로드캐스트(신규 + 호환 필드)
      io.of("/chat").to(`room:${msg.roomId}`).emit("message:ai", {
        messageId: msg.id,
        aiLabels: labels,
        aiScores: scores,
        aiSummary: data?.summary,
        aiMethod: data?.method,
        aiConfidence: data?.confidence,
        // backward-compatible
        aiLabel: first,
        aiScore: firstScore
      });
    } else {
      aiByMsg.set(msg.id, { state: "DONE" });
    }
  } catch (err) {
    aiByMsg.set(msg.id, { state: "ERROR" });
    console.error("[AI] classify error:", err?.message || err);
  }
}

// ===== Public API =====
// === Snapshot helper for AI overall summary ===
export function getRoomSnapshot(roomId) {
  const messages = Array.isArray(recentByRoom.get(roomId)) ? recentByRoom.get(roomId) : [];
  const st = roomStates.get(roomId) || {};
  const topic = st.topic || "";
  // duration 분 단위 추정
  let duration;
  if (st.createdAt && st.expireAt) {
    duration = Math.round((st.expireAt - st.createdAt) / 60000);
  } else if (st.createdAt) {
    duration = Math.round((Date.now() - st.createdAt) / 60000);
  }
  const round_number = st.roundNumber || (st.context && st.context.round_number) || undefined;
  return { messages, context: { topic, duration, round_number } };
}

export function initChatSocket(io) {
  startMentorScheduler(io);

  io.of("/chat").on("connection", (socket) => {
    let joinedRoomId = null;

    socket.on("room:join", ({ roomId }) => {
      if (!roomId) return;
      let prevRoom = joinedRoomId;
      if (prevRoom) socket.leave(`room:${prevRoom}`);
      joinedRoomId = roomId;
      socket.join(`room:${roomId}`);
      // after leaving previous room, cleanup if empty
      if (prevRoom) setTimeout(() => cleanupRoomIfEmpty(io, prevRoom), 0);

      // ensure room state exists
      getRoomState(roomId);

      // start per-room test bot (posts every 10s)
      ensureRoomBot(io, roomId);

      // start/ensure room expiry timer (max 25분)
      ensureRoomExpiry(io, roomId);

      // recent with reactions + ai
      const base = recentByRoom.get(roomId) ?? [];
      const recent = base.map(m => {
        const set = reactionsByMsg.get(m.id) ?? new Set();
        const ai = aiByMsg.get(m.id) || {};
        return { 
          ...m, 
          reactedUsers: Array.from(set), 
          reactionsCount: set.size,
          // multi-label fields
          aiLabels: ai.labels,
          aiScores: ai.scores,
          aiSummary: ai.summary,
          aiMethod: ai.method,
          aiConfidence: ai.confidence,
          // backward-compat single fields
          aiLabel: ai.label,
          aiScore: ai.score
        };
      });
      socket.emit("room:recent", { messages: recent });
      // Send initial remaining time info
      const st0 = getRoomState(roomId);
      socket.emit('room:time', {
        roomId,
        expireAt: st0.expireAt,
        now: Date.now(),
        remainingMs: Math.max(0, (st0.expireAt || Date.now()) - Date.now()),
      });
    });

    socket.on("message:send", (payload, cb) => {
      try {
        const { roomId, text, nickname } = payload || {};
        const trimmed = (text || "").trim();
        if (!roomId || !trimmed) {
          cb?.({ ok: false });
          return;
        }
        // guard if room is expired
        const stGuard = roomStates.get(roomId);
        if (stGuard && stGuard.expireAt && Date.now() >= stGuard.expireAt) {
          cb?.({ ok: false, reason: 'room_expired' });
          return;
        }
        const msg = {
          id: randomUUID(),
          roomId,
          nickname: nickname || "익명",
          text: trimmed,
          createdAt: new Date().toISOString()
        };
        const st = getRoomState(roomId);
        const now = Date.now();
        st.lastMessageAt = now;
        st.userLastAt.set(msg.nickname, now);
        pushRecent(roomId, msg);
        cb?.({ ok: true, serverId: msg.id, createdAt: msg.createdAt });
        io.of("/chat").to(`room:${roomId}`).emit("message:new", { ...msg, reactedUsers: [], reactionsCount: 0 });
        classifyAndBroadcast(io, msg);
      } catch (e) {
        cb?.({ ok: false });
      }
    });

    socket.on("reaction:toggle", ({ messageId, nickname }) => {
      if (!messageId || !nickname) return;
      const roomId = findRoomIdByMessageId(messageId);
      if (!roomId) return;
      const stGuard = roomStates.get(roomId);
      if (stGuard && stGuard.expireAt && Date.now() >= stGuard.expireAt) return; // ignore when expired
      const set = getReactionSet(messageId);
      if (set.has(nickname)) set.delete(nickname);
      else set.add(nickname);
      io.of("/chat").to(`room:${roomId}`).emit("reaction:update", {
        messageId,
        reactedUsers: Array.from(set),
        reactionsCount: set.size
      });
    });

    // 수동 트리거: 클라이언트가 AI 멘트 요청
    socket.on("ai:ment:request", async ({ roomId: reqRoomId }) => {
      const targetRoom = reqRoomId || joinedRoomId;
      if (!targetRoom) return;
      await generateMentAndBroadcast(io, targetRoom);
    });

    // 사용자가 토론 종료 요청
    socket.on('room:end', ({ roomId: reqRoomId }) => {
      const targetRoom = reqRoomId || joinedRoomId;
      if (!targetRoom) return;
      expireRoom(io, targetRoom);
    });

    // 남은 시간 질의(클라이언트 요청)
    socket.on('room:time:request', ({ roomId: reqRoomId }) => {
      const targetRoom = reqRoomId || joinedRoomId;
      if (!targetRoom) return;
      const st = getRoomState(targetRoom);
      socket.emit('room:time', {
        roomId: targetRoom,
        expireAt: st.expireAt,
        now: Date.now(),
        remainingMs: Math.max(0, (st.expireAt || Date.now()) - Date.now()),
      });
    });

    socket.on('disconnect', () => {
      if (joinedRoomId) setTimeout(() => cleanupRoomIfEmpty(io, joinedRoomId), 0);
    });
  });
}

let mentorSchedulerStarted = false;
function startMentorScheduler(io) {
  if (mentorSchedulerStarted) return;
  mentorSchedulerStarted = true;
  // Note: test bot runs independently per room (see ensureRoomBot)
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, st] of roomStates.entries()) {
      // 만료된 방은 즉시 만료 처리 후 continue
      if (st.expireAt && now >= st.expireAt) {
        expireRoom(io, roomId);
        continue;
      }
      // 1) 3분 주기 토론 멘트: 방 생성 시 즉시 한 번, 이후 5분마다
      if (!st.topicNextAt) st.topicNextAt = now; // 안전장치
      if (!st.topicIntervalMs) st.topicIntervalMs = 305000; // 5분
      if (now >= st.topicNextAt) {
        generateTopicMentAndBroadcast(io, roomId);
        st.topicNextAt = now + st.topicIntervalMs;
      }

      // 2) 침묵자 체크는 수시(5초마다 스캔): 사용자별 침묵 기준 충족 시 개별 멘트 생성
      generateEncouragesAndBroadcast(io, roomId);
    }
  }, 5000);
}

export function getOverview() {
  // Aggregate label counts, total messages and reactions
  const totals = {
    정직: 0,
    창의: 0,
    존중: 0,
    열정: 0,
    totalMessages: 0,
    totalReactions: 0
  };

  for (const [, msgs] of recentByRoom.entries()) {
    totals.totalMessages += msgs.length;
    for (const m of msgs) {
      const set = reactionsByMsg.get(m.id);
      if (set) totals.totalReactions += set.size;
      const ai = aiByMsg.get(m.id);
      if (ai?.labels && Array.isArray(ai.labels) && ai.labels.length) {
        for (const l of ai.labels) {
          if (ALLOWED_LABELS.has(l)) {
            totals[l] = (totals[l] || 0) + 1;
          }
        }
      } else if (ai?.label && ALLOWED_LABELS.has(ai.label)) {
        totals[ai.label] = (totals[ai.label] || 0) + 1;
      }
    }
  }
  return totals;
}

export function getRoomResult(roomId){ return resultsByRoom.get(roomId) || null; }
export function getUserLastResult(nickname){ return lastResultByUser.get(nickname) || null; }