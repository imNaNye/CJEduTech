// server/routes/socket.routes.js
import { Router } from "express";
import { getOverview } from "../services/socket.service.js";

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

export default router;
