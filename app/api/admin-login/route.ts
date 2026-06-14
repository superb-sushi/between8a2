import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    

    if (!username || !password) {
      return Response.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username },
    });
    

    if (!admin) {
      return Response.json(
        { error: "Invalid credentials: No such admin." },
        { status: 401 }
      );
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return Response.json(
        { error: "Invalid credentials: Wrong Password." },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return Response.json({
      token,
      adminId: admin.id,
      username: admin.username,
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
