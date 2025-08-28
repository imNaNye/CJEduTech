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

// ===== Config / constants =====
const ALLOWED_LABELS = new Set(["열정","정직","창의","존중"]);
const MIN_AI_SCORE = Number(process.env.AI_MIN_SCORE || 0.6);
// 로컬 테스트용 엔드포인트 (환경변수 사용 시 교체)
// const AI_ENDPOINT = process.env.AI_ENDPOINT;
const AI_ENDPOINT = "http://localhost:8000";
const AI_API_KEY = process.env.AI_API_KEY;

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
 *            topicNextAt?: number, topicIntervalMs?: number, encourageCooldownByUser?: Map<string, number>, botTimer?: any, botNickname?: string }} RoomState
 */
/** @type {Map<string, RoomState>} */
const roomStates = new Map();

function getRoomState(roomId) {
  let st = roomStates.get(roomId);
  if (!st) {
    st = { userLastAt: new Map(), lastMessageAt: Date.now(), topicNextAt: Date.now(), topicIntervalMs: 180000, encourageCooldownByUser: new Map(), botTimer: null, botNickname: makeBotNickname(roomId) };
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

      console.log("침묵자1",byUser)
  if (!state.encourageCooldownByUser) state.encourageCooldownByUser = byUser;

      console.log("침묵자2",)
  const context = buildMentContext(roomId);

      console.log("침묵자3",context)
  const silentUsers = context.silentUsers || [];

      console.log("침묵자4",silentUsers)
  let count = 0;
  for (const su of silentUsers) {

      console.log("침묵자5",su)
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
export function initChatSocket(io) {
  startMentorScheduler(io);

  io.of("/chat").on("connection", (socket) => {
    let joinedRoomId = null;

    socket.on("room:join", ({ roomId }) => {
      if (!roomId) return;
      if (joinedRoomId) socket.leave(`room:${joinedRoomId}`);
      joinedRoomId = roomId;
      socket.join(`room:${roomId}`);

      // ensure room state exists
      getRoomState(roomId);

      // start per-room test bot (posts every 10s)
      ensureRoomBot(io, roomId);

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
    });

    socket.on("message:send", (payload, cb) => {
      try {
        const { roomId, text, nickname } = payload || {};
        const trimmed = (text || "").trim();
        if (!roomId || !trimmed) {
          cb?.({ ok: false });
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
      const set = getReactionSet(messageId);
      if (set.has(nickname)) set.delete(nickname);
      else set.add(nickname);
      const roomId = findRoomIdByMessageId(messageId);
      if (!roomId) return;
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
      // 1) 3분 주기 토론 멘트: 방 생성 시 즉시 한 번, 이후 3분마다
      if (!st.topicNextAt) st.topicNextAt = now; // 안전장치
      if (!st.topicIntervalMs) st.topicIntervalMs = 180000; // 3분
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