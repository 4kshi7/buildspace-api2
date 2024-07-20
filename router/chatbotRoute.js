import { Groq } from "groq-sdk";
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_KEY
});

const chatHistories = new Map();

// Maximum number of messages to store per user
const MAX_MESSAGES = 5;

// Cleanup interval in milliseconds (e.g., every 30 minutes)
const CLEANUP_INTERVAL = 30 * 60 * 1000;

// Function to cleanup inactive chats
const cleanupInactiveChats = () => {
  const now = Date.now();
  for (const [userId, chatData] of chatHistories.entries()) {
    if (now - chatData.lastActivity > CLEANUP_INTERVAL) {
      chatHistories.delete(userId);
    }
  }
};

// Start the cleanup interval
setInterval(cleanupInactiveChats, CLEANUP_INTERVAL);

router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const userInput = req.body.userInput;
    const systemMessage = `You are a helpful AI therapist answer short and precise.`;

    // Initialize or get chat history for the user
    let chatData = chatHistories.get(userId);
    if (!chatData) {
      chatData = {
        messages: [{ role: "system", content: systemMessage }],
        lastActivity: Date.now()
      };
      chatHistories.set(userId, chatData);
    }

    // Update last activity
    chatData.lastActivity = Date.now();

    // Add user input to history
    chatData.messages.push({ role: "user", content: userInput });

    // Trim messages if exceeding MAX_MESSAGES
    if (chatData.messages.length > MAX_MESSAGES) {
      chatData.messages = chatData.messages.slice(-MAX_MESSAGES);
    }

    const { data: chatCompletion } = await groq.chat.completions
      .create({
        messages: chatData.messages,
        model: "llama3-8b-8192",
        temperature: 0.7,
        max_tokens: 500,
      })
      .withResponse();

    if (chatCompletion?.choices?.[0]?.message?.content) {
      const responseText = chatCompletion.choices[0].message.content;

      // Add assistant response to history
      chatData.messages.push({ role: "assistant", content: responseText });

      // Trim messages again if needed
      if (chatData.messages.length > MAX_MESSAGES) {
        chatData.messages = chatData.messages.slice(-MAX_MESSAGES);
      }

      res.json({ message: responseText });
    } else {
      throw new Error("Unexpected API response");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred while processing the request" });
  }
});

export default router;