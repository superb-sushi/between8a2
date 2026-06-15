import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const passcode = String(body.passcode || "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    let passcodeHash: string | undefined;
    if (passcode) {
      if (!/^[0-9]{4}$/.test(passcode)) {
        return NextResponse.json(
          { error: "Passcode must be exactly 4 digits." },
          { status: 400 }
        );
      }
      passcodeHash = await bcrypt.hash(passcode, 10);
    }

    const session = await prisma.session.create({
      data: {
        title,
        description: description || undefined,
        passcodeHash,
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        passcodeHash: true,
      },
    });

    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        questions: [],
        hasPasscode: Boolean(session.passcodeHash),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 }
    );
  }
}
