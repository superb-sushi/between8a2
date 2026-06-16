import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const JWT_SECRET = process.env.JWT_SECRET;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
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
  const { sessionId } = params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      questions: {
        where: { status: "APPROVED" },
        include: {
          answers: {
            include: {
              admin: { select: { id: true, username: true } },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const answeredQuestions = session.questions.filter((q) => q.answers.length > 0);

  if (answeredQuestions.length === 0) {
    return NextResponse.json(
      { error: "No answered questions to summarise yet." },
      { status: 400 }
    );
  }

  const questionsBlock = session.questions
    .map((q, i) => {
      const answerBlock =
        q.answers.length > 0
          ? q.answers.map((a) => `Answer (${a.admin?.username ?? "Leader"}): ${a.content}`).join("\n")
          : "No answer given.";

      return `Q${i + 1}: ${q.title}\n${q.question}\n${answerBlock}`;
    })
    .join("\n\n---\n\n");

  const prompt = `You are summarising a cell group Q&A session titled "${session.title}"${session.description ? ` — "${session.description}"` : ""}.

Here are the questions and answers from the session:

${questionsBlock}

Analyze the themes discussed, organize the information into clear and digestible points, and isolate any open-ended questions that require further discussion. Do not include any prayer points or spiritual guidance, and do not exaggerate or lie!

Respond with ONLY a JSON object in this exact shape, with no preamble or markdown backticks:
{
  "summary": "A short paragraph summarising the key themes of the session (3-4 sentences).",
  "takeaways": [
    "First key takeaway for participants to reflect on.",
    "Second key takeaway.",
    "Third key takeaway."
  ],
  "parkingLot": [
    "Any questions (they must be phrased as questions!) that remained open-ended or deserves a dedicated future session."
  ],
  "tags": ["Generate 2-4 single-word or short phrase tags representing the main topics discussed"]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // ✅ FIXED: Check structural presence of parkingLot and tags instead of prayerPoint
    if (!parsed.summary || !Array.isArray(parsed.takeaways) || !Array.isArray(parsed.parkingLot) || !Array.isArray(parsed.tags)) {
      return NextResponse.json(
        { error: "Unexpected response shape from AI." },
        { status: 500 }
      );
    }

    // ✅ FIXED: Return the new fields to your frontend state handler
    return NextResponse.json({
      summary: parsed.summary,
      takeaways: parsed.takeaways,
      parkingLot: parsed.parkingLot,
      tags: parsed.tags,
    });
  } catch (error) {
    console.error("AI summary error:", error);
    return NextResponse.json(
      { error: "Unable to generate summary." },
      { status: 500 }
    );
  }
}