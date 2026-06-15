import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

// ------------------------
// SEED DATA
// ------------------------

const adminDataBase = {
  username: "admin",
};

const session1Questions = [
  {
    title: "What exactly is 'Between Eight and Two about?'",
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
];

const session2Questions = [
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
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const adminData: Prisma.AdminCreateInput = {
    ...adminDataBase,
    password: hashedPassword,
  };

  // 1. ADMIN (upsert safe)
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {
      password: hashedPassword,
    },
    create: adminData,
  });

  console.log("Admin ready:", admin.username);

  // 2. SESSIONS
  const session1 = await prisma.session.create({
    data: {
      title: "Foundations of Faith",
      description: "Session exploring core theological questions",
    },
  });

  const session2 = await prisma.session.create({
    data: {
      title: "Faith in Practice",
      description: "Session about living out faith daily",
    },
  });

  console.log("Sessions created");

  // 3. QUESTIONS SESSION 1
  const questionsSession1 = [];

  for (const q of session1Questions) {
    const created = await prisma.question.create({
      data: {
        ...q,
        sessionId: session1.id,
      },
    });

    questionsSession1.push(created);
  }

  // 4. QUESTIONS SESSION 2
  const questionsSession2 = [];

  for (const q of session2Questions) {
    const created = await prisma.question.create({
      data: {
        ...q,
        sessionId: session2.id,
      },
    });

    questionsSession2.push(created);
  }

  console.log("Questions created");

  // 5. ANSWERS SESSION 1 (ALL include adminId)

  await prisma.answer.createMany({
    data: [
      {
        content:
          "'Between Eight and Two' is an initiative done to create a safe space for members of 8.2 to ask questions they may have revolving around things like Jesus, faith, life, and theology! The platform serves to allow members to post questions anonymously, while also allowing leaders to reply to these answers, giving cell members greater clarity and allowing them to receive good advice!",
        questionId: questionsSession1[0].id,
        adminId: admin.id,
      },
      {
        content:
          "It can also shape character and deepen dependence on God.",
        questionId: questionsSession1[0].id,
        adminId: admin.id,
      },
      {
        content:
          "Biblical figures like Job also experienced deep suffering.",
        questionId: questionsSession1[0].id,
        adminId: admin.id,
      },
      {
        content: "Prayer is about relationship, not strict rules.",
        questionId: questionsSession1[1].id,
        adminId: admin.id,
      },
      {
        content:
          "You can pray honestly and openly—God values sincerity.",
        questionId: questionsSession1[1].id,
        adminId: admin.id,
      },
      {
        content:
          "Many people use ACTS (Adoration, Confession, Thanksgiving, Supplication).",
        questionId: questionsSession1[1].id,
        adminId: admin.id,
      },
    ],
  });

  await prisma.answer.create({
    data: {
      content:
        "Many believe God speaks through Scripture, conviction, and circumstances.",
      questionId: questionsSession1[2].id,
      adminId: admin.id,
    },
  });

  // 6. ANSWERS SESSION 2
  await prisma.answer.create({
    data: {
      content:
        "Faith is trusting God even when you cannot see the full picture.",
      questionId: questionsSession2[0].id,
      adminId: admin.id,
    },
  });

  console.log("Answers created");
  console.log("Seeding complete 🚀");
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