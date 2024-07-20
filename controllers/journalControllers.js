import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createJournal = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.userId;

    const newJournal = await prisma.journal.create({
      data: {
        userId,
        title,
        content,
      },
    });
    res.status(201).json(newJournal);
  } catch (error) {
    res.status(500).json({ error: "Internal error: " + error });
  }
};

export const getJournals = async (req, res) => {
  try {
    const userId = req.userId;
    const journals = await prisma.journal.findMany({
      where: { userId },
      include: {
        User: {
          select: {
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json(journals);
  } catch (error) {
    res.status(500).json({ error: "Internal error: " + error });
  }
};

export const getJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const journal = await prisma.journal.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        User: {
          select: {
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!journal) {
      return res.status(404).json({ error: "Journal not found" });
    }

    res.status(200).json(journal);
  } catch (error) {
    console.error("Error fetching journal:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const journal = await prisma.journal.findUnique({ where: { id } });

    if (!journal || journal.userId !== userId) {
      res.status(404).json({ error: "Journal not found: " + error });
    }

    await prisma.journal.delete({ where: { id } });
    res.status(200).json({ message: "Journal deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal error: " + error });
  }
};

export const updateJournal = async (req, res) => {
  try {
      const { title, content } = req.body;
      const { id } = req.params;
      const userId = req.userId;

    const journal = await prisma.journal.findUnique({ where: { id } });
    if (!journal || journal.userId !== userId) {
      res.status(404).json({ error: "Journal not found: " + error });
    }

    const updatedData = await prisma.journal.update({
      where: { id },
      data: { title, content },
    });
    res.status(200).json(updatedData);
  } catch (error) {
    res.status(500).json({ error: "Internal error: " + error });
  }
};
