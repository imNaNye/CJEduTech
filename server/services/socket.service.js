// server/services/socket.service.js
import { randomUUID } from "crypto";

// ===== In-memory stores =====
const MAX_RECENT = 100;
/** @type {Map<string, Array<{id:string, roomId:string, nickname:string, text:string, createdAt:string}>>} */
const recentByRoom = new Map();
/** @type {Map<string, Set<string>>} messageId -> Set<nickname> */
const reactionsByMsg = new Map();
/** @type {Map<string, { label?: "열정"|"정직"|"창의"|"존중", score?: number, state: "PENDING"|"DONE"|"ERROR" }>} */
const aiByMsg = new Map();

// ===== Config / constants =====
const ALLOWED_LABELS = new Set(["열정","정직","창의","존중"]);
const MIN_AI_SCORE = Number(process.env.AI_MIN_SCORE || 0.6);
const AI_ENDPOINT = process.env.AI_ENDPOINT;
const AI_API_KEY = process.env.AI_API_KEY;

// ===== Room state for AI mentor (silence tracking, topic, cooldown) =====
const COOLDOWN_SEC = Number(process.env.AI_MENT_COOLDOWN_SEC || 60);
const SILENCE_THRESHOLD_SEC = Number(process.env.AI_MENT_SILENCE_SEC || 45);       // room-level silence
const USER_SILENCE_THRESHOLD_SEC = Number(process.env.AI_USER_SILENCE_SEC || 60);  // per-user silence
/**
 * @typedef {{ topic?: string, lastMessageAt?: number, cooldownUntil?: number, userLastAt: Map<string, number>, rollingSummary?: string }} RoomState
 */
/** @type {Map<string, RoomState>} */
const roomStates = new Map();

function getRoomState(roomId) {
  let st = roomStates.get(roomId);
  if (!st) {
    st = { userLastAt: new Map(), lastMessageAt: Date.now() };
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

async function generateMentAndBroadcast(io, roomId) {
  const state = getRoomState(roomId);
  const now = Date.now();
  // 쿨다운 체크
  if (state.cooldownUntil && state.cooldownUntil > now) return false;

  // 컨텍스트 생성
  const context = buildMentContext(roomId);

  const ments = [];

  // 1) 토론 관련 멘트(항상 생성)
  let topicMent;
  if (AI_ENDPOINT) {
    try {
      const res = await fetch(AI_ENDPOINT + "/mentor", {
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
          style: "encouraging"
        })
      });
      if (!res.ok) throw new Error(`AI mentor(topic) http ${res.status}`);
      const data = await res.json();
      topicMent = {
        id: randomUUID(),
        type: data?.type || "topic_comment",
        text: data?.text || "논의를 이어가기 위한 질문을 제안합니다.",
        targets: Array.isArray(data?.targets) ? data.targets : [],
        createdAt: new Date().toISOString()
      };
    } catch (e) {
      topicMent = await simulateTopicMent(context);
    }
  } else {
    topicMent = await simulateTopicMent(context);
  }
  if (topicMent) ments.push(topicMent);

  // 2) 침묵자별 멘트(각 침묵 사용자마다 생성)
  const silentUsers = context.silentUsers || [];
  for (const su of silentUsers) {
    let enc;
    if (AI_ENDPOINT) {
      try {
        const res = await fetch(AI_ENDPOINT + "/mentor", {
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
            style: "encouraging"
          })
        });
        if (!res.ok) throw new Error(`AI mentor(encourage) http ${res.status}`);
        const data = await res.json();
        enc = {
          id: randomUUID(),
          type: data?.type || "encourage",
          text: data?.text || `@${su.nickname} 님, 의견을 들려주실 수 있을까요?`,
          targets: Array.isArray(data?.targets) && data.targets.length ? data.targets : [su.nickname],
          createdAt: new Date().toISOString()
        };
      } catch (e) {
        enc = await simulateEncourageMent(context, su.nickname);
      }
    } else {
      enc = await simulateEncourageMent(context, su.nickname);
    }
    if (enc) ments.push(enc);
  }

  // 쿨다운 설정(한 번에 생성한 멘트 묶음에 대해 공통 쿨다운)
  state.cooldownUntil = now + COOLDOWN_SEC * 1000;

  // 브로드캐스트 (각 멘트를 개별 이벤트로 전송)
  for (const m of ments) {
    io.of("/chat").to(`room:${roomId}`).emit("ai:ment", { roomId, ...m });
  }
  return ments.length > 0;
}

async function classifyAndBroadcast(io, msg) {
  aiByMsg.set(msg.id, { state: "PENDING" });
  if (!AI_ENDPOINT) {
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
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_API_KEY ? { "Authorization": `Bearer ${AI_API_KEY}` } : {})
      },
      body: JSON.stringify({
        messageId: msg.id,
        text: msg.text,
        nickname: msg.nickname,
        roomId: msg.roomId
      })
    });
    if (!res.ok) throw new Error(`AI classify http ${res.status}`);
    const data = await res.json();
    const label = data?.label;
    const score = Number(data?.score);
    if (ALLOWED_LABELS.has(label) && !Number.isNaN(score) && score >= MIN_AI_SCORE) {
      aiByMsg.set(msg.id, { label, score, state: "DONE" });
      io.of("/chat").to(`room:${msg.roomId}`).emit("message:ai", {
        messageId: msg.id,
        aiLabel: label,
        aiScore: score
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

      // recent with reactions + ai
      const base = recentByRoom.get(roomId) ?? [];
      const recent = base.map(m => {
        const set = reactionsByMsg.get(m.id) ?? new Set();
        const ai = aiByMsg.get(m.id) || {};
        return { 
          ...m, 
          reactedUsers: Array.from(set), 
          reactionsCount: set.size,
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
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, st] of roomStates.entries()) {
      const gap = Math.floor((now - (st.lastMessageAt || now)) / 1000);
      if (gap >= SILENCE_THRESHOLD_SEC && (!st.cooldownUntil || st.cooldownUntil <= now)) {
        // 자동 트리거 (침묵)
        generateMentAndBroadcast(io, roomId);
      }
    }
  }, 5000); // 5초마다 스캔
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
      if (ai?.label && ALLOWED_LABELS.has(ai.label)) {
        totals[ai.label] = (totals[ai.label] || 0) + 1;
      }
    }
  }
  return totals;
}
