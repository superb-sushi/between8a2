import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;
    const passcode = String(request.nextUrl.searchParams.get("passcode") || "").trim();

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
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
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    if (session.passcodeHash) {
      if (!passcode) {
        return NextResponse.json(
          { error: "Passcode is required.", requiresPasscode: true },
          { status: 401 }
        );
      }

      const passcodeMatches = await bcrypt.compare(passcode, session.passcodeHash);
      if (!passcodeMatches) {
        return NextResponse.json(
          { error: "Invalid passcode.", requiresPasscode: true },
          { status: 401 }
        );
      }
    }

    const { passcodeHash, ...sessionSafe } = session;

    return NextResponse.json({ session: sessionSafe });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load session." },
      { status: 500 }
    );
  }
}
