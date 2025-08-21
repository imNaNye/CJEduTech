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
  io.of("/chat").on("connection", (socket) => {
    let joinedRoomId = null;

    socket.on("room:join", ({ roomId }) => {
      if (!roomId) return;
      if (joinedRoomId) socket.leave(`room:${joinedRoomId}`);
      joinedRoomId = roomId;
      socket.join(`room:${roomId}`);

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
  });
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
