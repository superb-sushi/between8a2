import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const question = String(body.question || "").trim();
    const sessionId = String(body.sessionId || "").trim();

    if (!sessionId || !title || !question) {
      return NextResponse.json(
        { error: "sessionId, title, and question are required." },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    const createdQuestion = await prisma.question.create({
      data: {
        title,
        question,
        sessionId,
      },
      include: {
        answers: {
          include: {
            admin: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ question: createdQuestion });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create question." },
      { status: 500 }
    );
  }
}
