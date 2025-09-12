// server/routes/socket.routes.js
import { Router } from "express";
import { getOverview } from "../services/socket.service.js";

import { getRoomResult, getUserLastResult } from "../services/socket.service.js";

const router = Router();

// GET /api/chat/overview
router.get("/overview", (req, res) => {
  try {
    const data = getOverview();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "overview_failed" });
  }
});
router.get("/result/:roomId", (req, res) => {
  console.log("chat get room",req.params.roomId)
  const data = getRoomResult(req.params.roomId);
  if (!data) return res.status(404).json({ error: "not_found" });

  res.json(data);
});

router.get("/my-result", (req, res) => {
  const { nickname } = req.query || {};

  console.log("chat get nick",nickname);
  if (!nickname) return res.status(400).json({ error: "nickname_required" });
  const data = getUserLastResult(String(nickname));
  if (!data) return res.status(404).json({ error: "not_found" });

  res.json(data);
});
export default router;
