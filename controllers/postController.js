import { PrismaClient } from "@prisma/client";
import axios from "axios"
const prisma = new PrismaClient();

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

const getRandomAnimeGif = async () => {
  try {
    const response = await axios.get("https://api.giphy.com/v1/gifs/random", {
      params: {
        api_key: GIPHY_API_KEY,
        tag: "anime aesthetic+vaporwave",
        rating: "pg-13",
      },
    });
    return response.data.data.images.original.url;
  } catch (error) {
    return "https://picsum.photos/300/300?random"; // Fallback image
  }
};

export const publishPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.userId;

    const default_img = await getRandomAnimeGif();

    const newPost = await prisma.post.create({
      data: {
        userId,
        title,
        content,
        imgUrl: default_img,
      },
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            img: true,
            role: true,
          },
        },
      },
      orderBy: {
        publishedDate: 'asc',
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            img: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const post = await prisma.post.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== userId && user.role != "admin") {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this post" });
    }

    await prisma.post.delete({ where: { id } });
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, imgUrl } = req.body;
    const userId = req.userId;

    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this post" });
    }

    const default_img = await getRandomAnimeGif();


    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        imgUrl: default_img,
      },
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
