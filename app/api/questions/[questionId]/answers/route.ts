import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: NextRequest, context: { params: Promise<{ questionId: string }> }) {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: "Missing JWT_SECRET" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }

  const params = await context.params;
  const { questionId } = params;
  const body = await request.json();
  const content = String(body.content || "").trim();

  if (!content) {
    return NextResponse.json(
      { error: "Answer content is required" },
      { status: 400 }
    );
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return NextResponse.json(
      { error: "Question not found" },
      { status: 404 }
    );
  }

  // Ensure admin exists from token
  const adminId = payload?.adminId;
  if (!adminId) {
    return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 401 });
  }

  const answer = await prisma.answer.create({
    data: {
      content,
      questionId,
      adminId,
    },
    include: {
      admin: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  await prisma.question.update({
    where: { id: questionId },
    data: { isAnswered: true },
  });

  return NextResponse.json({ answer });
}
