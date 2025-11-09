// server/services/socket.service.js
import { randomUUID } from "crypto";
import fs from 'fs/promises';
import path from 'path';

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

// ===== Room ID helpers =====
function composeRoomId(baseId, round){
  if (round === undefined || round === null) return String(baseId);
  return `${baseId}__r${round}`;
}
function decomposeRoomId(composed){
  const m = /^(.+?)__r(\d+)$/.exec(composed || "");
  if (!m) return { baseId: composed, round: undefined };
  return { baseId: m[1], round: Number(m[2]) };
}

// ===== Config / constants =====
const ALLOWED_LABELS = new Set(["열정","정직","창의","존중"]);
const MIN_AI_SCORE = Number(process.env.AI_MIN_SCORE || 0.6);
// 로컬 테스트용 엔드포인트 (환경변수 사용 시 교체)
// const AI_ENDPOINT = process.env.AI_ENDPOINT;
const AI_ENDPOINT = "http://localhost:8000";

const AI_API_KEY = process.env.AI_API_KEY;
// Prebuilt topic questions directory (per round)
const DISCUSSION_QUESTIONS_DIR = process.env.DISCUSSION_QUESTIONS_DIR || path.join(process.cwd(), 'data', 'discussion_questions');
// Helper to load prebuilt questions for a given base room and round
async function loadRoundQuestions(baseId, round){
  const attempts = [];
  // Try base + round specific
  if (baseId && (round !== undefined)) attempts.push(`${baseId}-r${round}.json`);
  // Try base aggregate
  if (baseId) attempts.push(`${baseId}.json`);
  // Try default for round
  if (round !== undefined) attempts.push(`default-r${round}.json`);
  // Fallback generic default
  attempts.push('default.json');

  for (const name of attempts){
    try{
      const f = path.join(DISCUSSION_QUESTIONS_DIR, name);
      const data = await readJSON(f);
      // Supported formats:
      // 1) Array<string|{text:string,type?:string,targets?:string[]}>  (file directly)
      if (Array.isArray(data)){
        return data.map((it)=> (typeof it === 'string' ? { text: it } : it)).filter(Boolean);
      }
      // 2) { rounds: { [round:number]: Array<...> } }
      if (data && data.rounds){
        const arr = data.rounds?.[String(round)] || data.rounds?.[Number(round)] || data.rounds?.[round];
        if (Array.isArray(arr)) return arr.map((it)=> (typeof it === 'string' ? { text: it } : it)).filter(Boolean);
      }
      // 3) { [round:number]: Array<...> }
      if (data && (typeof data === 'object')){
        const arr = data[String(round)] || data[Number(round)] || data[round];
        if (Array.isArray(arr)) return arr.map((it)=> (typeof it === 'string' ? { text: it } : it)).filter(Boolean);
      }
    }catch{}
  }
  return [];
}

// ===== Master content file for discussion questions (per video) =====
const DISCUSSION_MASTER_FILE = process.env.DISCUSSION_MASTER_FILE || path.join(DISCUSSION_QUESTIONS_DIR, 'default.json');

// Default mapping for numeric videoId (0~9) → keys in content.json
const DEFAULT_VIDEO_INDEX = [
  'video_tous_1',
  'video_tous_3',
  'video_tous_5',
  'video_vips_mgr_1',
  'video_vips_mgr_4',
  'video_vips_mgr_5',
  'video_vips_cook_2',
  'video_vips_cook_3',
  'video_vips_cook_4',
  'video_vips_cook_5',
];

// Resolver: convert videoId (number/string) to content.json key
async function resolveVideoKey(videoId){
  if (!videoId && videoId !== 0) return null;
  try{
    const data = await readJSON(DISCUSSION_MASTER_FILE);
    const vc = data && data.video_content ? data.video_content : {};

    // If already a direct key like 'video_tous_1', pass-through when exists
    if (typeof videoId === 'string' && vc[videoId]) return videoId;

    // Numeric or numeric-string → map
    const idx = typeof videoId === 'number' ? videoId : Number(String(videoId).trim());
    if (Number.isInteger(idx) && idx >= 0){
      // Prefer explicit mapping arrays if provided in content.json
      // 1) video_index: [ 'video_xxx', ... ]
      if (Array.isArray(data?.video_index) && data.video_index[idx]){
        return data.video_index[idx];
      }
      // 2) video_index_map: { "0": "video_xxx" }
      const viaMap = data?.video_index_map && (data.video_index_map[String(idx)] || data.video_index_map[idx]);
      if (typeof viaMap === 'string') return viaMap;

      // 3) Fallback to built-in default order
      if (DEFAULT_VIDEO_INDEX[idx]) return DEFAULT_VIDEO_INDEX[idx];
    }
  }catch{ /* ignore; fallthrough to null */ }
  return null;
}

// Helper to load discussion questions from master JSON based on videoId
async function loadVideoDiscussionQuestions(videoId){
  // Accept 0~9 (number/string) or full key like 'video_tous_1'
  const key = await resolveVideoKey(videoId) || (typeof videoId === 'string' ? videoId : null);
  if (!key) return [];
  try {
    const data = await readJSON(DISCUSSION_MASTER_FILE);
    const vc = data && data.video_content;
    const entry = vc && vc[key];
    const arr = entry && entry.discussion_questions;
    if (Array.isArray(arr)) return arr.map((it)=> (typeof it === 'string' ? it : (it && it.text) || '')).filter(Boolean);
  } catch (e) {
    // ignore and fallback
  }
  return [];
}

// ===== Archiving (persist chat logs per room) =====
const ARCHIVE_DIR = process.env.CHAT_ARCHIVE_DIR || path.join(process.cwd(), 'data', 'chat_archives');
async function ensureDir(dir){ try{ await fs.mkdir(dir, { recursive: true }); }catch{ /*noop*/ } }
async function writeJSON(file, obj){ await ensureDir(path.dirname(file)); await fs.writeFile(file, JSON.stringify(obj, null, 2), 'utf-8'); }
async function readJSON(file){ const buf = await fs.readFile(file, 'utf-8'); return JSON.parse(buf); }

// ===== Room lifetime =====
const ROOM_MAX_AGE_MS = Number(process.env.ROOM_MAX_AGE_MS || 10 * 1000); // 데모용  60초

// ===== Test Bot (per-room, optional, multi-bot) =====
const BOT_ENABLED = false;
const BOT_MIN_INTERVAL_MS = Number(process.env.CHAT_TEST_BOT_MIN_MS || 10000);
const BOT_MAX_INTERVAL_MS = Number(process.env.CHAT_TEST_BOT_MAX_MS || 25000);
const BOT_COUNT = Number(process.env.CHAT_TEST_BOT_COUNT || 5);

// 20개 페르소나(이름 + 말투 키워드)
const BOT_PERSONAS = [
  { name: '소피아', tone: '분석적' },
  { name: '민준', tone: '직설적' },
  { name: '지우', tone: '호기심' },
  { name: '하연', tone: '정중함' },
  { name: '도윤', tone: '사실검증' },
  { name: '서연', tone: '격려' },
  { name: '현우', tone: '반론제기' },
  { name: '지민', tone: '요약' },
  { name: '가을', tone: '사례중심' },
  { name: '태윤', tone: '비유' },
  { name: '나래', tone: '창의적' },
  { name: '유진', tone: '정직' },
  { name: '주원', tone: '열정' },
  { name: '하늘', tone: '존중' },
  { name: '서준', tone: '논리' },
  { name: '수아', tone: '문제정의' },
  { name: '예준', tone: '데이터' },
  { name: '현서', tone: '리스크' },
  { name: '채원', tone: '아이디어' },
  { name: '이안', tone: '정리' },
];

const BOT_OPENERS = [
  (t) => `${t ? `“${t}”에 대해 ` : ''}핵심 쟁점을 한 줄로 정리해보면 어떨까요?`,
  () => `먼저 기준을 정하면 좋겠습니다. 무엇을 최우선으로 볼까요?`,
  () => `관련 데이터나 사례가 있으면 공유 부탁드려요.`,
];
const BOT_MOVERS = [
  () => `좋은 포인트네요. 반대 관점에서 보면 어떤 리스크가 있을까요?`,
  () => `지금까지 의견을 근거/예시로 확장해볼까요?`,
  () => `논의된 대안을 비교할 기준을 제안해 봅니다: 비용, 시간, 영향도.`,
];
const BOT_SUMMARIZERS = [
  () => `잠깐 정리하면, 지금까지 나온 의견은 ① ② ③ 정도로 보입니다. 빠진 게 있을까요?`,
  () => `요약하면 방향 A vs B 논점으로 보입니다. 추가 의견 있으신가요?`,
];

function randInt(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
function randPick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

function makeBotNickname(roomId, idx) {
  const p = BOT_PERSONAS[idx % BOT_PERSONAS.length];
  const seed = Math.abs([...roomId].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 13) + idx)
                .toString(36).slice(-3);
  return `토론봇·${p.name}#${seed}`;
}

// ===== Room state for AI mentor (silence tracking, topic, cooldown) =====
const COOLDOWN_SEC = Number(process.env.AI_MENT_COOLDOWN_SEC || 60);
const SILENCE_THRESHOLD_SEC = Number(process.env.AI_MENT_SILENCE_SEC || 45);       // room-level silence
const USER_SILENCE_THRESHOLD_SEC = Number(process.env.AI_USER_SILENCE_SEC || 60);  // per-user silence
/**
 * @typedef {{ topic?: string, lastMessageAt?: number, cooldownUntil?: number, userLastAt: Map<string, number>, rollingSummary?: string,
 *            topicNextAt?: number, topicIntervalMs?: number, encourageCooldownByUser?: Map<string, number>, botTimers?: any[], botNicknames?: string[],
 *            createdAt?: number, expireAt?: number, expireTimer?: any }} RoomState
 */
/** @type {Map<string, RoomState>} */
const roomStates = new Map();

function getRoomState(roomId) {
  let st = roomStates.get(roomId);
  if (!st) {
    st = {
      isClosing: false, // prevent duplicate expireRoom runs
      topicBuckets: new Map(),   // Map<topic:string, Map<nickname, Array<{id,text,createdAt}>>>
      topicSummariesGenerated: false,
      userLastAt: new Map(),
      lastMessageAt: Date.now(),
      topicNextAt: Date.now(),
      topicIntervalMs: 180000,
      encourageCooldownByUser: new Map(),
      botTimers: [],
      botNicknames: [],
      createdAt: Date.now(),
      expireAt: Date.now() + ROOM_MAX_AGE_MS,
      expireTimer: null,
    };
    roomStates.set(roomId, st);
  }
  st.expireAt = Date.now() + ROOM_MAX_AGE_MS;
  st.createdAt = Date.now();
  roomStates.set(roomId,st);
  return st;
}

// ===== Topic Rotation & Broadcast Helpers =====
async function ensureRoomTopics(roomId){
  const st = getRoomState(roomId);
  if (Array.isArray(st.topics) && st.topics.length) return;
  try {
    // 1) Try master content.json via videoId
    const videoTopics = await loadVideoDiscussionQuestions(st.videoId);
    if (videoTopics && videoTopics.length){
      st.topics = videoTopics;
    } else {
      // 2) Fallback to legacy per-round files
      const { baseId, round } = decomposeRoomId(roomId);
      const arr = await loadRoundQuestions(baseId, round);
      const topics = (arr || []).map(it => (typeof it === 'string' ? it : (it && it.text) || '')).filter(Boolean);
      st.topics = topics;
    }
  } catch {
    // 3) Last resort defaults
    st.topics = [
      '오늘 토론의 핵심 가치는 무엇인가요?',
      '가장 설득력 있는 근거는 무엇인가요?',
      '반대 입장에서 본 핵심 리스크는 무엇인가요?'
    ];
  }
  if (!Array.isArray(st.topics) || !st.topics.length){
    st.topics = [
      '오늘 토론의 핵심 가치는 무엇인가요?',
      '가장 설득력 있는 근거는 무엇인가요?',
      '반대 입장에서 본 핵심 리스크는 무엇인가요?'
    ];
  }
  if (typeof st.topicIndex !== 'number') st.topicIndex = -1;
}

function broadcastCurrentTopic(io, roomId){
  const st = getRoomState(roomId);
  if(!st.topics) return;
  const text = "주제 "+(st.topicIndex+1)+"/"+st.topics.length+" : "+st.topic || '';
  console.log("New Topic : ",st.topicIndex,st.topic);
  if(st.topicIndex<0) return;
  if (!text) return;
  const payload = {
    roomId,
    id: randomUUID(),
    type: 'current_topic',
    text,
    targets: [],
    createdAt: new Date().toISOString()
  };
  io.of('/chat').to(`room:${roomId}`).emit('ai:ment', payload);
}

function setNextTopic(io, roomId, dir = +1,default_topic = false){
  const st = getRoomState(roomId);
  const topics = Array.isArray(st.topics) ? st.topics : [];
  if (!topics.length) return false;

  const cur = (typeof st.topicIndex === 'number') ? st.topicIndex : -1;
  const step = (dir === -1) ? -1 : +1;

  // Compute next index without wrapping
  let nextIdx = (cur === -1) ? (step > 0 ? 0 : -1) : (cur + step);

  if (nextIdx < 0 || nextIdx >= topics.length) return false; // out of range → no change

  st.topicIndex = nextIdx;
  if (default_topic) st.topicIndex = 0;
  st.topic = topics[st.topicIndex];
  broadcastCurrentTopic(io, roomId);
  return true;
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

function serializeMessagesForArchive(roomId){
  const arr = recentByRoom.get(roomId) || [];
  return arr.map(m => {
    const set = reactionsByMsg.get(m.id) || new Set();
    const ai = aiByMsg.get(m.id) || {};
    const { baseId, round } = decomposeRoomId(m.roomId);
    return {
      id: m.id,
      roomId: m.roomId,
      baseRoomId: baseId,
      round_number: round,
      nickname: m.nickname,
      avatarId: m.avatarId || m.avatar,
      text: m.text,
      createdAt: m.createdAt,
      reactedUsers: Array.from(set),
      reactionsCount: set.size,
      ai: {
        label: ai.label,
        labels: ai.labels,
        scores: ai.scores,
        score: ai.score,
        summary: ai.summary,
        method: ai.method,
        confidence: ai.confidence,
        state: ai.state,
      }
    };
  });
}

// ---- Room cleanup: when room has no connected clients (only AI/bot would remain) ----
function cleanupRoomIfEmpty(io, roomId) {

  const ns = io.of('/chat');
  const roomKey = `room:${roomId}`;
  const room = ns.adapter.rooms.get(roomKey);
  // if room exists and has clients, do nothing
  if (room && room.size > 0) return false;

  // stop test bots if running
  const st = roomStates.get(roomId);
  if (st?.botTimers && st.botTimers.length) {
    for (const t of st.botTimers) clearTimeout(t);
    st.botTimers = [];
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
async function expireRoom(io, roomId) {
  // Add guard to prevent duplicate runs
  const stFlag = getRoomState(roomId);
  if (stFlag.isClosing) return; // prevent duplicate runs
  stFlag.isClosing = true;

  const ns = io.of('/chat');
  const roomKey = `room:${roomId}`;
  // 1) 종료 준비 안내 (결과 생성 중)
  ns.to(roomKey).emit('room:closing', { roomId, reason: 'max_age', maxAgeMs: ROOM_MAX_AGE_MS });
  // ⚠️ 여기서는 아직 방에서 소켓을 제거하지 않습니다. (결과 준비 완료 신호를 받아야 함)

  // stop test bots if running
  const st = roomStates.get(roomId);
  if (st?.botTimers && st.botTimers.length) {
    for (const t of st.botTimers) clearTimeout(t);
    st.botTimers = [];
  }

  // 결과 집계 (per user)
  const msgs = recentByRoom.get(roomId) || [];
  const avatarIdByNick = {}; // ✅ 닉네임→아바타 맵
  // Track, per user, the most-liked message for each persona label
  const perUserTopByLabel = {}; // nickname -> { 정직|열정|창의|존중: { messageId, text, reactionsCount, createdAt } }
  const perUser = {};
  for (const m of msgs) {
    const nick = m.nickname || '익명';
    if ((m.avatarId || m.avatar) && !avatarIdByNick[nick]) {
      avatarIdByNick[nick] = String(m.avatarId || m.avatar);
    }
    if (!perUser[nick]) perUser[nick] = {
      nickname: nick,
      totalMessages: 0,
      totalReactions: 0,
      labels: { 정직:0, 창의:0, 존중:0, 열정:0 },
      topReacted: undefined,
    };
    if (!perUserTopByLabel[nick]) perUserTopByLabel[nick] = { 정직:null, 열정:null, 창의:null, 존중:null };
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
      for (const l of ai.labels) {
        if (!ALLOWED_LABELS.has(l)) continue;
        perUser[nick].labels[l] = (perUser[nick].labels[l]||0) + 1;
        const cur = perUserTopByLabel[nick][l];
        if (!cur || rc > (cur.reactionsCount || 0)) {
          perUserTopByLabel[nick][l] = { messageId: m.id, text: m.text, reactionsCount: rc, createdAt: m.createdAt };
        }
      }
    } else if (ai?.label && ALLOWED_LABELS.has(ai.label)) {
      const l = ai.label;
      perUser[nick].labels[l] = (perUser[nick].labels[l]||0) + 1;
      const cur = perUserTopByLabel[nick][l];
      if (!cur || rc > (cur.reactionsCount || 0)) {
        perUserTopByLabel[nick][l] = { messageId: m.id, text: m.text, reactionsCount: rc, createdAt: m.createdAt };
      }
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
  // === Persona grouping (server-provided) ===
  const groups =  undefined;
  /*
  const groups = { 정직: [], 열정: [], 창의: [], 존중: [] };
  const ORDER = ['정직','열정','창의','존중'];
  for (const [nick, u] of Object.entries(perUser)) {
    const counts = u.labels || {};
    let best = null; let bestCnt = -1;
    for (const k of ORDER){
      const v = Number(counts[k] || 0);
      if (v > bestCnt){ bestCnt = v; best = k; }
      else if (v === bestCnt && v > 0) {  }
    }

    // If no labels yet, assign to the smallest group (ties resolved by ORDER priority)
    if (!best || bestCnt <= 0) {
      let minKey = ORDER[0];
      for (const k of ORDER) {
        if (groups[k].length < groups[minKey].length) minKey = k;
      }
      groups[minKey].push({ nickname: nick, totalPersonaLabels: 0, topReacted: u.topReacted || null });
      continue;
    }

    const topForBest = perUserTopByLabel[nick]?.[best] || u.topReacted || null;
    groups[best].push({ nickname: nick, totalPersonaLabels: bestCnt, topReacted: topForBest });
  }
  for (const k of Object.keys(groups)){
    groups[k].sort((a,b) => {
      const ra = a.topReacted?.reactionsCount || 0;
      const rb = b.topReacted?.reactionsCount || 0;
      if (rb !== ra) return rb - ra;
      if ((b.totalPersonaLabels||0) !== (a.totalPersonaLabels||0)) return (b.totalPersonaLabels||0) - (a.totalPersonaLabels||0);
      const ua = perUser[a.nickname]?.totalReactions || 0;
      const ub = perUser[b.nickname]?.totalReactions || 0;
      return ub - ua;
    });
  }*/

    // Defer topic-wise summaries to background for speed
    let topicSummaries = { topics: [], generatedAt: null };

  // === Defer overall summary to background for speed ===
  let overallSummaryText = null;

  const createdAt = Date.now();
  resultsByRoom.set(roomId, { createdAt, roomId, perUser, ranking: rankingArr, groups, topicSummaries, avatarMap: avatarIdByNick, overallSummary: overallSummaryText });
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

  // === Archive to disk ===
  const stMeta = roomStates.get(roomId) || {};
  // Persist video id information for final aggregation by video
  let video_id_index = (typeof stMeta.videoId !== 'undefined') ? stMeta.videoId : undefined;
  let video_id_key;
  try {
    video_id_key = await resolveVideoKey(stMeta.videoId);
  } catch {}
  const archive = {
    roomId,
    createdAt,
    expireAt: stMeta.expireAt || Date.now(),
    topic: stMeta.topic || '',
    video_id_index,
    video_id_key,
    round_number: stMeta.roundNumber || (stMeta.context && stMeta.context.round_number) || undefined,
    messages: serializeMessagesForArchive(roomId),
    perUser,
    ranking: rankingArr,
    groups,
    avatarMap: avatarIdByNick, // ✅ 추가
    topicSummaries,
    overallSummary: overallSummaryText,
  };
  const { baseId, round } = decomposeRoomId(roomId);
  const suffix = round !== undefined ? `-r${round}` : '';
  const latestFile = path.join(ARCHIVE_DIR, `${baseId}${suffix}-latest.json`);
  const datedFile = path.join(ARCHIVE_DIR, `${baseId}${suffix}-${createdAt}.json`);
  try {
    await writeJSON(datedFile, archive);
    await writeJSON(latestFile, archive);
  } catch (e) {
    console.error('[ARCHIVE] write error:', e?.message || e);
  }

  // 2) 결과 준비 완료 알림 (이 신호를 받은 클라이언트가 결과 페이지로 이동)
  ns.to(roomKey).emit('results:ready', { roomId });

  // 2.5) 토픽/종합 요약 생성 완료까지 대기하여 클라이언트가 topics:ready / overallSummary:ready를 수신할 수 있도록 함
  try {
    await buildAndBroadcastSummaries(io, roomId);
  } catch {}

  // 3) 최종 만료 이벤트 브로드캐스트
  ns.to(roomKey).emit('room:expired', { roomId, reason: 'max_age', maxAgeMs: ROOM_MAX_AGE_MS });

  // 4) 방의 모든 소켓을 방에서 제거 (이제 제거해도 됨)
  const room = ns.adapter.rooms.get(roomKey);
  if (room) {
    for (const socketId of room) {
      const s = ns.sockets.get(socketId);
      if (s) s.leave(roomKey);
    }
  }

  // 정리: 방 비우기
  cleanupRoomIfEmpty(io, roomId);
}

// ---- Background job for topic and overall summaries ----
async function buildAndBroadcastSummaries(io, roomId){
  // Reuse existing in-memory data
  const stS = getRoomState(roomId);
  const msgs = recentByRoom.get(roomId) || [];
  const perUser = (resultsByRoom.get(roomId) || {}).perUser || {};

  // --- Topic-wise representative statements (moved from expireRoom) ---
  let topicSummaries = { topics: [], generatedAt: Date.now() };
  try {
    if (!stS.topicSummariesGenerated) {
      const chat_history = msgs.map(m => ({ nickname: m.nickname, text: m.text, timestamp: m.createdAt }));
      const names = Array.isArray(stS.topics) ? stS.topics : [];
      const discussion_topics = names.map(n => ({ name: String(n || ''), description: '' }));

      const botNames = Array.isArray(stS.botNicknames) ? new Set(stS.botNicknames) : new Set();
      const userNicknames = Object.keys(perUser).filter(n => !botNames.has(n));

      const byTopic = new Map();
      for (const n of names) byTopic.set(String(n), []);

      if (AI_ENDPOINT && userNicknames.length && discussion_topics.length) {
        for (const nick of userNicknames) {
          try {
            const res = await fetch(AI_ENDPOINT + '/user-summary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...(AI_API_KEY ? { 'Authorization': `Bearer ${AI_API_KEY}` } : {}) },
              body: JSON.stringify({ user_id: nick, chat_history, discussion_topics, max_statements_per_topic: 1 })
            });
            if (!res.ok) throw new Error('user-summary http ' + res.status);
            const data = await res.json();
            if (data && Array.isArray(data.topics)) {
              for (const t of data.topics) {
                const topicName = t?.topic || '';
                const arr = byTopic.get(topicName) || [];
                const relevance = typeof t?.relevance_score === 'number' ? t.relevance_score : 0;
                const summaryText = (t?.summary && String(t.summary)) || (Array.isArray(t?.related_statements) && t.related_statements[0]) || '';
                if (summaryText) arr.push({ nickname: nick, summary: summaryText, relevance });
                byTopic.set(topicName, arr);
              }
            }
          } catch {}
        }
      } else {
        const buckets = stS.topicBuckets instanceof Map ? stS.topicBuckets : new Map();
        for (const [topic, byUser] of buckets.entries()) {
          const arr = [];
          for (const [nick, msgsArr] of byUser.entries()) {
            const m = (msgsArr || [])[0];
            if (m && m.text) arr.push({ nickname: nick, summary: m.text, relevance: 0 });
          }
          byTopic.set(topic, arr);
        }
      }

      const topicsOut = [];
      for (const name of (Array.isArray(stS.topics) ? stS.topics : [])) {
        const items = (byTopic.get(String(name)) || []).sort((a,b) => (b.relevance||0) - (a.relevance||0));
        topicsOut.push({ topic: String(name), summaries: items });
      }
      topicSummaries.topics = topicsOut;
      stS.topicSummariesGenerated = true;
    }
  } catch {}

  // Persist into results map & notify clients (socket)
  const cur = resultsByRoom.get(roomId) || { roomId };
  cur.topicSummaries = topicSummaries;
  resultsByRoom.set(roomId, cur);

  // Optional: archive refresh of latest file
  try {
    const { baseId, round } = decomposeRoomId(roomId);
    const suffix = round !== undefined ? `-r${round}` : '';
    const latestFile = path.join(ARCHIVE_DIR, `${baseId}${suffix}-latest.json`);
    const datedFile = path.join(ARCHIVE_DIR, `${baseId}${suffix}-${cur.createdAt || Date.now()}.json`);
    await writeJSON(latestFile, { ...(await readJSON(latestFile)), topicSummaries });
  } catch {}

  io.of('/chat').to(`room:${roomId}`).emit('topics:ready', { roomId });

  // --- Overall summary in background ---
  try {
    const mod = await import('./review.service.js');
    const sum = await mod.generateOverallSummary?.(roomId, { force: true });
    const overallSummaryText = sum?.summaryText || null;
    const cur2 = resultsByRoom.get(roomId) || { roomId };
    cur2.overallSummary = overallSummaryText;
    resultsByRoom.set(roomId, cur2);
    io.of('/chat').to(`room:${roomId}`).emit('overallSummary:ready', { roomId });
  } catch {}
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
  if (st.botTimers && st.botTimers.length >= BOT_COUNT) return; // already running

  // 생성되지 않은 봇 닉네임 채우기
  if (!Array.isArray(st.botNicknames)) st.botNicknames = [];
  while (st.botNicknames.length < BOT_COUNT) {
    st.botNicknames.push(makeBotNickname(roomId, st.botNicknames.length));
  }

  // 각 봇마다 개별 타이머 시작
  const timers = st.botTimers || [];
  while (timers.length < BOT_COUNT) {
    const botIndex = timers.length;
    const nickname = st.botNicknames[botIndex];
    const startDelay = randInt(1000, 4000);

    const run = () => {
      try {
        const base = recentByRoom.get(roomId) ?? [];
        const state = getRoomState(roomId);
        const now = Date.now();
        // 마지막 메시지 기반으로 타입 선택
        const last = base[base.length - 1];
        let text;
        if (!last) {
          text = randPick(BOT_OPENERS)(state.topic || '');
        } else if (Math.random() < 0.3) {
          text = randPick(BOT_SUMMARIZERS)();
        } else {
          text = randPick(BOT_MOVERS)();
        }

        const msg = {
          id: randomUUID(),
          roomId,
          nickname,
          text,
          createdAt: new Date().toISOString(),
        };
        state.lastMessageAt = now;
        state.userLastAt.set(nickname, now);
        pushRecent(roomId, msg);
        io.of('/chat').to(`room:${roomId}`).emit('message:new', { ...msg, reactedUsers: [], reactionsCount: 0 });
        classifyAndBroadcast(io, msg);
        scheduleRandomReactions(io, roomId, msg);
      } catch {}

      // 다음 실행 간격 (개인별 랜덤)
      const nextMs = randInt(BOT_MIN_INTERVAL_MS, BOT_MAX_INTERVAL_MS);
      timers[botIndex] = setTimeout(run, nextMs);
    };

    timers.push(setTimeout(run, startDelay));
  }
  st.botTimers = timers;
}

function scheduleRandomReactions(io, roomId, msg) {
  // 최근 메시지에 대해 일부 봇이 랜덤하게 반응 토글 (지연 후)
  const st = getRoomState(roomId);
  const bots = st.botNicknames || [];
  if (!bots.length) return;

  // 0~3명 정도 랜덤 반응
  const reactCount = randInt(0, Math.min(3, bots.length));
  const picks = [...bots].sort(() => Math.random() - 0.5).slice(0, reactCount);

  for (const nick of picks) {
    if (nick === msg.nickname) continue; // 자기 메시지에 반응 금지
    const delay = randInt(500, 2500);
    setTimeout(() => {
      const set = getReactionSet(msg.id);
      if (set.has(nick)) return; // 이미 눌렀으면 스킵
      set.add(nick);
      io.of('/chat').to(`room:${roomId}`).emit('reaction:update', {
        messageId: msg.id,
        reactedUsers: Array.from(set),
        reactionsCount: set.size,
      });
    }, delay);
  }
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
  // AI 서버에 /question 요청하여 생성
const state = getRoomState(roomId);
const context = buildMentContext(roomId);
const discussion_topic = context.topic || '';
const video_id = await resolveVideoKey(state.videoId) || '';
// 가장 최근 대화 전송자를 타겟으로 지정
const lastSender = (Array.isArray(context.recent) && context.recent.length)
  ? context.recent[context.recent.length - 1].nickname
  : '';
const target_user = lastSender || '';
const chat_history = (context.recent || []).map(m => ({ nickname: m.nickname, text: m.text }));

let q;
if (AI_ENDPOINT) {
  try {
    const payload = {
        nickname: target_user,
        discussion_topic,
        video_id,
        questionText:"",
        chat_history
      };
      console.log("멘트 :",payload);
    const res = await fetch(AI_ENDPOINT + "/question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_API_KEY ? { "Authorization": `Bearer ${AI_API_KEY}` } : {})
      },
      body: JSON.stringify(
        payload
      )
    });
    if (!res.ok) throw new Error(`AI question http ${res.status}`);
    const data = await res.json();
    q = {
      question: data?.question || '',
      target_user: data?.target_user ?? target_user,
      video_id: data?.video_id ?? video_id,
      discussion_topic: data?.discussion_topic ?? discussion_topic
    };
  } catch (e) {
    // 폴백(서버 불가 시 기본 멘트)
    q = {
      question: `${discussion_topic ? `“${discussion_topic}” 관련해 ` : ''}다음 논의를 진전시키기 위한 질문을 제안해 주세요.`,
      target_user,
      video_id,
      discussion_topic
    };
  }
} else {
  // AI 서버 미구성 시 폴백
  q = {
    question: `${discussion_topic ? `“${discussion_topic}” 관련해 ` : ''}어떤 선택지가 가능한가요? 근거를 함께 들어주세요.`,
    target_user,
    video_id,
    discussion_topic
  };
}

if (!q || !q.question) return false;
  if (!q.question || q.question === '결과 없음' || q.question.toLowerCase().includes('결과 없음') || q.question === '결과없음' || q.question.toLowerCase().includes('결과없음')) {
    console.log(`[AI Ment] No valid result for room ${roomId}, skipping broadcast`);
    return;
  }
  
const payload = {
  id: randomUUID(),
  type: 'topic_comment',
  text: q.question,
  targets: q.target_user ? [q.target_user] : [],
  createdAt: new Date().toISOString()
};
io.of('/chat').to(`room:${roomId}`).emit('ai:ment', { roomId, ...payload });
return true;
}

async function generateEncouragesAndBroadcast(io, roomId) {
  const state = getRoomState(roomId);
  const now = Date.now();
  const ENCOURAGE_COOLDOWN_MS = 1000 * 60; // per-user cooldown
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
      const payload = {
            intent: "ai_mentor_encourage",
            roomId: context.roomId,
            topic: context.topic,
            target: su.nickname,
            silenceSec: su.silenceSec,
            chat_history: context.recent.map(m => ({ nickname: m.nickname, text: m.text, aiLabel: (aiByMsg.get(m.id) || {}).label })),
            maxTokens: 80,
            style: "encouraging",
            nickname: su.nickname,
            user_id: "test_id",
            idle_time: su.silenceSec,
          };
          console.log("참여 :",payload);
      try {
        const res = await fetch(AI_ENDPOINT + "/encouragement", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(AI_API_KEY ? { "Authorization": `Bearer ${AI_API_KEY}` } : {})
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`AI mentor(encourage) http ${res.status}`);
        const data = await res.json();
        enc = {
          id: randomUUID(),
          type: data?.type || "encourage",
          text: data?.message || `@${su.nickname} 님, 의견을 들려주실 수 있을까요?`,
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
    const res = await fetch(AI_ENDPOINT + "/classify-gpt", {
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

    socket.on("room:join", async ({ roomId, round, videoId, isAdmin }) => {
      console.log(isAdmin);
      if (!roomId) return;

      const composed = composeRoomId(roomId, round);
      let prevRoom = joinedRoomId;
      if (prevRoom) socket.leave(`room:${prevRoom}`);
      joinedRoomId = composed;
      socket.join(`room:${composed}`);
      if (prevRoom) setTimeout(() => cleanupRoomIfEmpty(io, prevRoom), 0);

      // ensure room state exists & save current video id (do not override once set)
      const stForJoin = getRoomState(composed);
      if (isAdmin) {
        const incomingHas = (videoId !== undefined && videoId !== null);
        const alreadyHas = (typeof stForJoin.videoId !== 'undefined');

        // Only the first admin who provides a videoId initializes the room.
        if (incomingHas && !alreadyHas) {
          stForJoin.videoId = videoId; // 0~9 숫자/문자 모두 허용
          console.log('[room:join] videoId set (initial)=', videoId);

          // 🔁 Reset topic sequence and buckets
          stForJoin.topics = undefined; // force reload via ensureRoomTopics (by videoId)
          stForJoin.topic = undefined;
          stForJoin.topicIndex = -1;
          stForJoin.topicBuckets = new Map();
          stForJoin.topicSummariesGenerated = false; // allow regeneration at expire

          // 🧹 Clear existing messages and AI data for a clean setup
          recentByRoom.delete(composed);
          for (const [mid] of reactionsByMsg) {
            const roomMatch = findRoomIdByMessageId(mid);
            if (roomMatch === composed) reactionsByMsg.delete(mid);
          }
          for (const [mid] of aiByMsg) {
            const roomMatch = findRoomIdByMessageId(mid);
            if (roomMatch === composed) aiByMsg.delete(mid);
          }

          // schedule first topic broadcast ~10s later
          const now = Date.now();
          stForJoin.topicNextAt = now + 10000; // 10s

          // ⏱ Reset room timer (remaining time)
          stForJoin.createdAt = now;
          stForJoin.expireAt = now + ROOM_MAX_AGE_MS;
          if (stForJoin.expireTimer) { clearTimeout(stForJoin.expireTimer); stForJoin.expireTimer = null; }
          ensureRoomExpiry(io, composed);

          // Preload topics for new video (no broadcast yet)
          await ensureRoomTopics(composed);
          // 🔊 Immediately broadcast the first topic after setup
          setNextTopic(io, composed, 0, true);

          // --- Broadcast synced videoId to all clients in the room ---
          io.of('/chat').to(`room:${composed}`).emit('room:video', {
            roomId: composed,
            videoId: stForJoin.videoId
          });

          // Notify clients about refreshed time
          io.of('/chat').to(`room:${composed}`).emit('room:time', {
            roomId: composed,
            expireAt: stForJoin.expireAt,
            now: Date.now(),
            remainingMs: Math.max(0, (stForJoin.expireAt || Date.now()) - Date.now()),
          });
        } else if (incomingHas && alreadyHas) {
          // Ignore subsequent admin attempts to reconfigure; keep the first configuration.
          console.log('[room:join] admin setup already exists; ignoring new videoId:', videoId, 'current=', stForJoin.videoId);
        } else {
          console.log('[room:join] no incoming videoId; keep existing=', alreadyHas ? stForJoin.videoId : '(unset)');
        }
      } else {
        console.log('[room:join] non-admin user; videoId change not allowed');
      }

      // Preload topics only (first topic will be announced by scheduler ~10s after creation)
      ensureRoomTopics(composed);
      broadcastCurrentTopic(io, composed);

      // --- Send current videoId to the newly joined client for sync ---
      if (typeof stForJoin.videoId !== 'undefined') {
        socket.emit('room:video', { roomId: composed, videoId: stForJoin.videoId });
      }

      // start per-room test bot
      ensureRoomBot(io, composed);

      // start/ensure room expiry timer
      ensureRoomExpiry(io, composed);

      const base = recentByRoom.get(composed) ?? [];
      const recent = base.map(m => {
        const set = reactionsByMsg.get(m.id) ?? new Set();
        const ai = aiByMsg.get(m.id) || {};
        return {
          ...m,
          avatarId: m.avatarId || m.avatar,
          avatar: m.avatarId || m.avatar,
          reactedUsers: Array.from(set),
          reactionsCount: set.size,
          aiLabels: ai.labels,
          aiScores: ai.scores,
          aiSummary: ai.summary,
          aiMethod: ai.method,
          aiConfidence: ai.confidence,
          aiLabel: ai.label,
          aiScore: ai.score
        };
      });
      socket.emit("room:recent", { messages: recent });
      const st0 = getRoomState(composed);
      socket.emit('room:time', {
        roomId: composed,
        expireAt: st0.expireAt,
        now: Date.now(),
        remainingMs: Math.max(0, (st0.expireAt || Date.now()) - Date.now()),
      });
    });

    socket.on("message:send", async (payload, cb) => {
      try {
        const { roomId: baseId, round, text, nickname,avatar } = payload || {};
        const roomId = baseId ? composeRoomId(baseId, round) : joinedRoomId;
        const trimmed = (text || "").trim();
        if (!roomId || !trimmed) { cb?.({ ok:false }); return; }

        // === Direct AI Q&A (DM) ===
        // 사용자가 메시지에 '@아이고라'를 포함하면, 해당 사용자에게만 답변을 보내고
        // 대화 내역(recent/push/broadcast)에는 기록하지 않는다.
        if (/@아이고라/.test(trimmed)) {
          const questionText = trimmed.replace(/@아이고라/g, '').trim();
          // 빈 질문은 무시
          if (!questionText) { cb?.({ ok:false, reason: 'empty_ai_question' }); return; }
                    // 사용자 DM 질문을 본인에게만 메시지처럼 표시(기록/브로드캐스트/아카이브 X)
          const dmUserMsg = {
            id: randomUUID(),
            roomId,
            nickname: payload?.nickname || '나',
            text: trimmed,
            createdAt: new Date().toISOString(),
            private: true,
            type: 'user_dm'
          };
          // 개별 소켓에만 표시
          socket.emit('message:new', { ...dmUserMsg, reactedUsers: [], reactionsCount: 0 });
          // 컨텍스트 구성
          const stForRoom = getRoomState(roomId);
          const context = buildMentContext(roomId);
          const discussion_topic = context.topic || '';
          const video_id = await resolveVideoKey( stForRoom.videoId) || '';
          console.log(video_id);
          const chat_history = (context.recent || []).map(m => ({ nickname: m.nickname, text: m.text }));

          (async () => {
            let answer = '';
            if (AI_ENDPOINT) {
              try {
                const res = await fetch(AI_ENDPOINT + '/qa', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(AI_API_KEY ? { 'Authorization': `Bearer ${AI_API_KEY}` } : {})
                  },
                  body: JSON.stringify({
                    nickname: payload?.nickname || '',
                    questionText: questionText,
                    discussion_topic,
                    video_id,
                    chat_history
                  })
                });
                if (!res.ok) throw new Error(`AI qa http ${res.status}`);
                const data = await res.json();
                // 기대 포맷이 없다면 최대한 유연하게 추출
                answer = data?.question || data?.message || data?.text || '';
              } catch (e) {
                // 폴백 답변
                answer = `질문 감사합니다. ${discussion_topic ? `주제 "${discussion_topic}" 기준으로 ` : ''}간단히 정리해 보자면: ${questionText}`;
              }
            } else {
              // AI 서버 미구성 폴백
              answer = `(${discussion_topic || '일반'})에 대한 간단 응답: ${questionText}`;
            }

            // 개인에게만 전송(방출 X, 기록 X)
            const dm = {
              id: randomUUID(),
              type: 'ai_dm',
              text: answer,
              targets: [payload?.nickname || ''],
              createdAt: new Date().toISOString(),
              private: true
            };
            // 해당 소켓에만 전송
            socket.emit('ai:ment', { roomId, ...dm });
            cb?.({ ok: true, private: true });
          })();

          return; // 일반 메시지 흐름 중단
        }

        // === Command shortcuts for testing ===
        // 1) /종료 : expire room immediately
        // 2) /멘트 : send next topic-related AI ment from prebuilt queue
        // 3) /참여 : request encourage AI ment(s) for silent users

        /*
        if (trimmed.startsWith('/')){
          const cmd = trimmed.replace(/^\s*\/(.*)$/,'$1').trim();
          if (cmd === '종료' || cmd.toLowerCase() === 'end'){
            expireRoom(io, roomId);
            cb?.({ ok: true, command: 'end' });
            return;
          }
          // ✅ 새로 추가: /다음 명령
          if (cmd === '다음' || cmd.toLowerCase() === 'nexttopic') {
            const changed = setNextTopic(io, roomId);
            cb?.({ ok: changed, command: 'nexttopic' });
            return;
          }
          if (cmd === '멘트' || cmd.toLowerCase() === 'next' || cmd.toLowerCase() === 'ment'){
            generateTopicMentAndBroadcast(io, roomId).then(sent => {
              cb?.({ ok: true, command: 'topic', sent: Boolean(sent) });
            }).catch(() => cb?.({ ok: false, command: 'topic' }));
            return;
          }
          if (cmd === '참여' || cmd.toLowerCase() === 'enc' || cmd.toLowerCase() === 'encourage'){
            generateEncouragesAndBroadcast(io, roomId).then(count => {
              cb?.({ ok: true, command: 'encourage', count: Number(count)||0 });
            }).catch(() => cb?.({ ok: false, command: 'encourage' }));
            return;
          }
          // unknown slash command -> ignore as command and continue to post as normal message
        }
          */
        // guard if room is expired
        const stGuard = roomStates.get(roomId);
        if (stGuard && stGuard.expireAt && Date.now() >= stGuard.expireAt) {
          cb?.({ ok: false, reason: 'room_expired' });
          return;
        }
        console.log("received avatar :",String(avatar));
        const msg = {
          id: randomUUID(),
          roomId,
          avatarId:String(avatar), // ✅ avatarId로 저장
          avatar:String(avatar), // ✅ avatarId로 저장
          nickname: nickname || "익명",
          text: trimmed,
          createdAt: new Date().toISOString()
        };
        const st = getRoomState(roomId);
        const now = Date.now();
        st.lastMessageAt = now;
        st.userLastAt.set(msg.nickname, now);
        pushRecent(roomId, msg);
        // --- Save message under current topic bucket ---
        try {
          const st4 = getRoomState(roomId);
          const topicKey = st4.topic || '(주제없음)';
          if (!st4.topicBuckets) st4.topicBuckets = new Map();
          if (!st4.topicBuckets.has(topicKey)) st4.topicBuckets.set(topicKey, new Map());
          const byUser = st4.topicBuckets.get(topicKey);
          if (!byUser.has(msg.nickname)) byUser.set(msg.nickname, []);
          byUser.get(msg.nickname).push({ id: msg.id, text: msg.text, createdAt: msg.createdAt });
        } catch {}
        generateTopicMentAndBroadcast(io,roomId);
        cb?.({ ok: true, serverId: msg.id, createdAt: msg.createdAt });
        io.of("/chat").to(`room:${roomId}`).emit("message:new", { ...msg, reactedUsers: [], reactionsCount: 0 });
        classifyAndBroadcast(io, msg);
        scheduleRandomReactions(io, roomId, msg);
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
            console.log("ment request: ",targetRoom);
      if (!targetRoom) return;
      await generateMentAndBroadcast(io, targetRoom);
    });

    // 수동 트리거: 클라이언트가 다음/이전 토론 주제 요청
    socket.on("room:next", async ({ roomId: reqRoomId, dir }) => {
            const targetRoom = reqRoomId || joinedRoomId;
            console.log("next request: ", targetRoom, 'dir=', dir);
            if (!targetRoom) return;
            const changed = await setNextTopic(io, targetRoom, dir === -1 ? -1 : +1);
    });

    // 사용자가 토론 종료 요청
    socket.on('room:end', ({ roomId: reqRoomId }) => {
      const targetRoom = reqRoomId || joinedRoomId;

      console.log("end request: ",targetRoom);
      if (!targetRoom) return;
      expireRoom(io, targetRoom);
    });

    // 남은 시간 질의(클라이언트 요청)
    socket.on('room:time:request', ({ roomId: reqRoomId }) => {
      const targetRoom = reqRoomId || joinedRoomId;
      
      if (!targetRoom) return;
      const st = getRoomState(targetRoom);
      //123
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
      // ⏱ 시연용: 만료시간을 현재 기준으로 계속 연장
      
      if (st.expireAt && now >= st.expireAt) {
        if (!st.isClosing) expireRoom(io, roomId);
        continue;
      }

      // 자동 토픽 교체 비활성화 (수동 제어)

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

export async function getRoomArchive(roomId){
  try {
    const { baseId, round } = decomposeRoomId(roomId);
    const suffix = round !== undefined ? `-r${round}` : '';
    return await readJSON(path.join(ARCHIVE_DIR, `${baseId}${suffix}-latest.json`));
  } catch { return null; }
}

export async function listRoomArchives(roomId){
  try {
    const { baseId, round } = decomposeRoomId(roomId);
    const files = await fs.readdir(ARCHIVE_DIR);
    const prefix = round !== undefined ? `${baseId}-r${round}-` : `${baseId}-`;
    const hits = files.filter(f => f.startsWith(prefix) && f.endsWith('.json') && !f.endsWith('-latest.json'));
    const results = [];
    for (const f of hits){
      try { results.push(await readJSON(path.join(ARCHIVE_DIR, f))); } catch {}
    }
    results.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    return results;
  } catch { return []; }
}

export async function aggregateArchives(roomIds = []){
  // 병합: perUser 합산 후 점수 재계산, 메시지는 필요 시 결합
  const combo = { rooms: [], messages: [], perUser: {}, ranking: [] };
  for (const rid of roomIds){
    const a = await getRoomArchive(rid);
    if (!a) continue;
    combo.rooms.push({ roomId: a.roomId, createdAt: a.createdAt, round_number: a.round_number });
    combo.messages.push(...(a.messages||[]));
    for (const [nick, u] of Object.entries(a.perUser || {})){
      if (!combo.perUser[nick]) combo.perUser[nick] = { nickname: nick, totalMessages:0, totalReactions:0, labels:{ 정직:0, 창의:0, 존중:0, 열정:0 } };
      combo.perUser[nick].totalMessages += (u.totalMessages||0);
      combo.perUser[nick].totalReactions += (u.totalReactions||0);
      for (const k of Object.keys(combo.perUser[nick].labels)){
        combo.perUser[nick].labels[k] += (u.labels?.[k]||0);
      }
    }
  }
  // 랭킹 재산출
  const arr = Object.values(combo.perUser).map(u => ({
    nickname: u.nickname,
    totalMessages: u.totalMessages,
    totalReactions: u.totalReactions,
    labels: u.labels,
    score: calcUserScore(u),
  })).sort((a,b)=> b.score - a.score);
  let rank=1, same=0, last=null;
  for (let i=0;i<arr.length;i++){
    const s = arr[i].score;
    if (last===null){ rank=1; same=1; last=s; }
    else if (s===last){ same++; }
    else { rank+=same; same=1; last=s; }
    arr[i].rank = rank;
  }
  combo.ranking = arr;
  return combo;
}

// ===== Aggregate all rounds of a roomId =====
export async function aggregateRoom(roomId){
  const all = await listRoomArchives(roomId);
  const ids = all.map(a => a.roomId); // same id; reuse aggregator by composing archives directly
  // Build combo similar to aggregateArchives but using loaded archives
  const combo = { rooms: [], messages: [], perUser: {}, ranking: [] };
  for (const a of all){
    combo.rooms.push({ roomId: a.roomId, createdAt: a.createdAt, round_number: a.round_number });
    combo.messages.push(...(a.messages||[]));
    for (const [nick, u] of Object.entries(a.perUser || {})){
      if (!combo.perUser[nick]) combo.perUser[nick] = { nickname: nick, totalMessages:0, totalReactions:0, labels:{ 정직:0, 창의:0, 존중:0, 열정:0 } };
      combo.perUser[nick].totalMessages += (u.totalMessages||0);
      combo.perUser[nick].totalReactions += (u.totalReactions||0);
      for (const k of Object.keys(combo.perUser[nick].labels)){
        combo.perUser[nick].labels[k] += (u.labels?.[k]||0);
      }
    }
  }
  const arr = Object.values(combo.perUser).map(u => ({ nickname:u.nickname, totalMessages:u.totalMessages, totalReactions:u.totalReactions, labels:u.labels, score:calcUserScore(u) })).sort((a,b)=>b.score-a.score);
  let rank=1,same=0,last=null; for (const r of arr){ if(last===null){rank=1;same=1;last=r.score;} else if(r.score===last){same++;} else {rank+=same;same=1;last=r.score;} r.rank=rank; }
  combo.ranking = arr;
  return combo;
}
