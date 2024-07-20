import express from "express";
import {
  deletePost,
  getAllPosts,
  getPosts,
  publishPost,
  updateBlog,
} from "../controllers/postController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { apiLimiter, createPostLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.use(apiLimiter);
router.use(authMiddleware);

router.post("/",  createPostLimiter, publishPost);
router.get("/bulk", getAllPosts);
router.get("/:id", getPosts);
router.delete("/:id", deletePost);
router.put("/:id", updateBlog);

export default router;
