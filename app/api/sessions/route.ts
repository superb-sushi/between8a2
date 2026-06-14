import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const session = await prisma.session.create({
      data: {
        title,
        description: description || undefined,
      },
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

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 }
    );
  }
}
