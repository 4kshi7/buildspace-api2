import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    next();
  } catch (error) {
    console.error("Error checking user role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
