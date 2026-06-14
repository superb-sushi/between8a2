import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// ------------------------
// SEED DATA
// ------------------------

const adminData: Prisma.AdminCreateInput = {
  username: "admin",
  password: "hashed-password-here",
};

const questionData = [
  {
    title: "Why does God allow suffering?",
    question: "I’ve always wondered why suffering exists if God is good.",
    isAnswered: true,
  },
  {
    title: "How should I pray?",
    question: "Is there a correct way to pray?",
    isAnswered: true,
  },
  {
    title: "Does God still speak today?",
    question: "How do we know if God is speaking to us now?",
    isAnswered: true,
  },
  {
    title: "What is faith?",
    question: "I don’t fully understand what faith really means.",
    isAnswered: false,
  },
  {
    title: "Why read the Bible?",
    question: "Why is the Bible important today?",
    isAnswered: false,
  },
];

// ------------------------
// MAIN SEED FUNCTION
// ------------------------

export async function main() {
  // 1. ADMIN (ONLY ONE)
  const admin = await prisma.admin.create({
    data: adminData,
  });

  console.log("Admin created:", admin.username);

  // 2. SESSION
  const session = await prisma.session.create({
    data: {
      title: "Default Session",
      description: "Seeded Q&A session",
    },
  });

  console.log("Session created:", session.id);

  // 3. QUESTIONS (ATTACHED TO SESSION)
  const questions: any[] = [];

  for (const q of questionData) {
    const created = await prisma.question.create({
      data: {
        ...q,
        sessionId: session.id,
      },
    });

    questions.push(created);
  }

  console.log("Questions created:", questions.length);

  // ------------------------
  // 4. ANSWERS
  // ------------------------

  // Question 1 → 3 answers
  await prisma.answer.createMany({
    data: [
      {
        content:
          "Suffering may exist in a fallen world while still allowing free will.",
        questionId: questions[0].id,
      },
      {
        content:
          "It can also shape character and deepen dependence on God.",
        questionId: questions[0].id,
      },
      {
        content:
          "Biblical figures like Job also experienced deep suffering.",
        questionId: questions[0].id,
      },
    ],
  });

  // Question 2 → 3 answers
  await prisma.answer.createMany({
    data: [
      {
        content: "Prayer is about relationship, not strict rules.",
        questionId: questions[1].id,
      },
      {
        content:
          "You can pray honestly and openly—God values sincerity.",
        questionId: questions[1].id,
      },
      {
        content:
          "Many people use ACTS (Adoration, Confession, Thanksgiving, Supplication).",
        questionId: questions[1].id,
      },
    ],
  });

  // Question 3 → 1 answer
  await prisma.answer.create({
    data: {
      content:
        "Many believe God speaks through Scripture, conviction, and circumstances.",
      questionId: questions[2].id,
    },
  });

  console.log("Answers created");
}

// ------------------------
// EXECUTE
// ------------------------

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });