import jwt from "jsonwebtoken";
import zod from "zod";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import nodemailer from "nodemailer";

const DEFAULT_IMG_URL =
  "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const signupBody = zod.object({
  username: zod.string().min(4).max(20),
  email: zod.string().email(),
  password: zod.string().min(8),
  name: zod.string().max(25),
});

const signinBody = zod.object({
  username: zod.string(),
  password: zod.string(),
});
const updateSchema = zod.object({
  name: zod.string().max(25).optional(),
  username: zod.string().min(4).max(20).optional(),
  img: zod.string().url().optional(),
});

// const cookieConfig = {
//   httpsOnly: true,
//   secure: process.env.NODE_ENV === "production",
//   sameSite: "none", 
//   maxAge: 24 * 60 * 60 * 1000, // 24 hours
// };
const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  

};

export const signup = async (req, res) => {
  const { success, data } = signupBody.safeParse(req.body);
  if (!success) {
    return res.status(400).json({
      error: "Username already registered/Incorrect inputs",
    });
  }

  const { username, password, name, email, img } = data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Username already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        img: DEFAULT_IMG_URL || img,
      },
    });

    const userId = user.id;
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);

    res.cookie("token", token, cookieConfig);

    res.status(201).json({
      message: "User created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const signin = async (req, res) => {
  const { success, data } = signinBody.safeParse(req.body);

  if (!success) {
    return res.status(400).json({
      message: "Invalid inputs",
    });
  }

  const { username, password } = data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

    res.cookie('token', token, cookieConfig);

    console.log('Login successful. Cookie set:', cookieConfig);

    res.json({ message: "Logged in successfully" });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};
export const checkauth = (req, res) => {
  const token = req.cookies.token;
  console.log('Checking auth. Token:', token ? 'exists' : 'does not exist');
  
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully');
      res.json({ isLoggedIn: true });
    } catch (error) {
      console.error('Token verification failed:', error);
      res.clearCookie('token');
      res.json({ isLoggedIn: false });
    }
  } else {
    console.log('No token found');
    res.json({ isLoggedIn: false });
  }
};
export const update = async (req, res) => {
  const userId = req.userId;

  const { success, data } = updateSchema.safeParse(req.body);

  if (!success) {
    return res.status(400).json({
      error: "Invalid input",
    });
  }

  const { name, username, email, img } = data;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        username: username || undefined,
        img: img || undefined,
        email: email || undefined,
      },
    });

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        img: updatedUser.img,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Username already taken",
      });
    }

    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const sendMail = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
      },
    });
    const emailAddresses = users.map((user) => user.email);

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      bcc: emailAddresses, // Use BCC to hide recipients from each other
      subject: "Test Email",
      text: "If you're reading this, the email functionality is working!",
    });

    res.send(`Test email sent successfully to ${emailAddresses.length} users`);
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).send("Error sending test email");
  }
};

export const bulk = async (req, res) => {
  try {
    const requestingUserId = req.userId; // Assume you have the user's ID from authentication middleware
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { role: true },
    });

    if (requestingUser.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized. Admin access required." });
    }

    // If the user is an admin, proceed with fetching all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        img: true,
        email: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const userInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        img: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error " + error });
  }
};
