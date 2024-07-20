import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createJournal,
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
} from "../controllers/journalControllers.js";
import {
  createJournalLimiter,
  getJournalsLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createJournalLimiter, createJournal);
router.get("/bulk", getJournalsLimiter, getJournals);
router.get("/:id", getJournal);
router.put("/:id", updateJournal);
router.delete("/:id", deleteJournal);

export default router;
