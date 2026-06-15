import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * PATCH /api/questions/[questionId]/status
 *
 * Updates a question's status (PENDING <-> APPROVED).
 * Admin-only — expects `Authorization: Bearer <adminToken>`.
 * Body: { status: "APPROVED" | "PENDING" }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ questionId: string }> }
) {
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

  // Ensure admin exists from token
  const adminId = payload?.adminId;
  if (!adminId) {
    return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 401 });
  }

  const params = await context.params;
  const { questionId } = params;

  const body = await request.json().catch(() => ({}));
  const status = body?.status === "PENDING" ? "PENDING" : "APPROVED";

  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  if (existing.status === status) {
    return NextResponse.json(
      { message: `Question already ${status.toLowerCase()}` },
      { status: 200 }
    );
  }

  try {
    const question = await prisma.question.update({
      where: { id: questionId },
      data: { status },
      include: {
        answers: {
          include: {
            admin: { select: { id: true, username: true } },
          },
        },
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Failed to update question status:", error);
    return NextResponse.json(
      { error: "Unable to update question status." },
      { status: 500 }
    );
  }
}