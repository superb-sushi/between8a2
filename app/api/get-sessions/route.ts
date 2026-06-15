import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        passcodeHash: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      sessions.map(({ passcodeHash, ...session }) => ({
        ...session,
        hasPasscode: Boolean(passcodeHash),
      }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}