import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./router/authRoutes.js";
import postRoutes from "./router/postRoutes.js";
import journalRoutes from "./router/journalRoutes.js"
import chatbotRouter from "./router/chatbotRoute.js";
import cookieParser from "cookie-parser";

//config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
// const corsOptions = {
//   origin: [process.env.FRONTEND, process.env.FRONTEND_LOCAL],
//   credentials: true,
// };

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND 
    : process.env.FRONTEND_LOCAL,
  credentials: true
}));

// Middleware
// app.use(cors(corsOptions));
app.use(cookieParser())
app.use(express.json());

//server
app.use("/api/v1/user", authRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/journal", journalRoutes);
app.use("/api/v1/bot", chatbotRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
