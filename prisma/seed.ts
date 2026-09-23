import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin, student and parent logins
  const adminPassword = await bcryptjs.hash("admin123", 10);
  const studentPassword = await bcryptjs.hash("student123", 10);
  const parentPassword = await bcryptjs.hash("parent123", 10);

  const admin = await prisma.userProfile.upsert({
    where: { profileName: "admin" },
    update: {},
    create: {
      profileName: "admin",
      profilePassword: adminPassword,
      fName: "Admin",
      lName: "User",
      userType: "ADMIN",
      isActive: true,
      personalDetails: {
        create: { emailAddress: "admin@tasteurknowledge.com" },
      },
    },
  });

  const student = await prisma.userProfile.upsert({
    where: { profileName: "student" },
    update: {},
    create: {
      profileName: "student",
      profilePassword: studentPassword,
      fName: "Test",
      lName: "Student",
      userType: "STUDENT",
      isActive: true,
      personalDetails: {
        create: { emailAddress: "student@tasteurknowledge.com" },
      },
    },
  });

  const parent = await prisma.userProfile.upsert({
    where: { profileName: "parent" },
    update: {},
    create: {
      profileName: "parent",
      profilePassword: parentPassword,
      fName: "Test",
      lName: "Parent",
      userType: "PARENT",
      // Points at the student login this parent oversees
      studentParentRef: "student",
      isActive: true,
      personalDetails: {
        create: { emailAddress: "parent@tasteurknowledge.com" },
      },
    },
  });

  // Create Years
  const year4 = await prisma.year.upsert({
    where: { name: "Year 4" },
    update: {},
    create: {
      name: "Year 4",
      order: 1,
    },
  });

  const year5 = await prisma.year.upsert({
    where: { name: "Year 5" },
    update: {},
    create: {
      name: "Year 5",
      order: 2,
    },
  });

  // Create subjects for each year
  const subjectNames = ["English", "Maths", "Verbal", "Non-Verbal"];

  for (const year of [year4, year5]) {
    for (let i = 0; i < subjectNames.length; i++) {
      await prisma.subject.upsert({
        where: {
          yearId_name: {
            yearId: year.id,
            name: subjectNames[i],
          },
        },
        update: {},
        create: {
          yearId: year.id,
          name: subjectNames[i],
          order: i + 1,
        },
      });
    }
  }

  // Get all subjects to add days and questions
  const subjects = await prisma.subject.findMany({
    include: { year: true },
  });

  // Sample questions for each day
  const questionSets = [
    [
      {
        text: "What is the capital of France?",
        optionA: "London",
        optionB: "Paris",
        optionC: "Berlin",
        optionD: "Madrid",
        correctOption: "B",
      },
      {
        text: "Which planet is closest to the Sun?",
        optionA: "Venus",
        optionB: "Mercury",
        optionC: "Earth",
        optionD: "Mars",
        correctOption: "B",
      },
      {
        text: "What is 12 × 8?",
        optionA: "86",
        optionB: "94",
        optionC: "96",
        optionD: "98",
        correctOption: "C",
      },
      {
        text: "Who wrote Romeo and Juliet?",
        optionA: "Jane Austen",
        optionB: "William Shakespeare",
        optionC: "Charles Dickens",
        optionD: "Mark Twain",
        correctOption: "B",
      },
      {
        text: "What is the chemical symbol for Gold?",
        optionA: "Gd",
        optionB: "Go",
        optionC: "Au",
        optionD: "Gl",
        correctOption: "C",
      },
    ],
    [
      {
        text: "What is the largest ocean on Earth?",
        optionA: "Atlantic Ocean",
        optionB: "Indian Ocean",
        optionC: "Arctic Ocean",
        optionD: "Pacific Ocean",
        correctOption: "D",
      },
      {
        text: "How many continents are there?",
        optionA: "5",
        optionB: "6",
        optionC: "7",
        optionD: "8",
        correctOption: "C",
      },
      {
        text: "What is 25 ÷ 5?",
        optionA: "3",
        optionB: "5",
        optionC: "7",
        optionD: "9",
        correctOption: "B",
      },
      {
        text: "Which country is known as the Land of Thousand Lakes?",
        optionA: "Norway",
        optionB: "Finland",
        optionC: "Sweden",
        optionD: "Canada",
        correctOption: "B",
      },
      {
        text: "What does HTTP stand for?",
        optionA: "Hyper Text Transfer Protocol",
        optionB: "High Transfer Text Protocol",
        optionC: "Hyper Transfer Text Process",
        optionD: "Home Text Transfer Protocol",
        correctOption: "A",
      },
    ],
    [
      {
        text: "What is the smallest prime number?",
        optionA: "0",
        optionB: "1",
        optionC: "2",
        optionD: "3",
        correctOption: "C",
      },
      {
        text: "Which is the longest river in the world?",
        optionA: "Amazon",
        optionB: "Nile",
        optionC: "Yangtze",
        optionD: "Mississippi",
        correctOption: "B",
      },
      {
        text: "What is 50% of 200?",
        optionA: "50",
        optionB: "100",
        optionC: "150",
        optionD: "200",
        correctOption: "B",
      },
      {
        text: "Who painted the Mona Lisa?",
        optionA: "Vincent van Gogh",
        optionB: "Leonardo da Vinci",
        optionC: "Pablo Picasso",
        optionD: "Michelangelo",
        correctOption: "B",
      },
      {
        text: "What is the boiling point of water in Celsius?",
        optionA: "90",
        optionB: "100",
        optionC: "110",
        optionD: "120",
        correctOption: "B",
      },
    ],
  ];

  // Create comprehensions and their questions for each subject.
  // The quiz reads gsEnglishComp / gsEnglishQuestions, which key off the
  // year and subject *names* rather than a foreign key.
  for (const subject of subjects) {
    for (let dayNum = 1; dayNum <= 3; dayNum++) {
      const label = `Day ${dayNum}`;

      const existing = await prisma.gsEnglishComp.findFirst({
        where: {
          yearName: subject.year.name,
          subjectName: subject.name,
          label,
        },
        select: { id: true },
      });

      if (existing) continue;

      const questionsForDay = questionSets[dayNum - 1] || questionSets[0];

      await prisma.gsEnglishComp.create({
        data: {
          label,
          yearName: subject.year.name,
          subjectName: subject.name,
          difficultyLevel: "Medium",
          questions: {
            create: questionsForDay.map((q) => ({
              quest: q.text,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              ansChoice: q.correctOption,
            })),
          },
        },
      });
    }
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📝 Default Admin User:");
  console.log(`   User ID: ${admin.profileName}`);
  console.log(`   Password: admin123`);
  console.log("\n👤 Default Student User:");
  console.log(`   User ID: ${student.profileName}`);
  console.log(`   Password: student123`);
  console.log("\n👪 Default Parent User:");
  console.log(`   User ID: ${parent.profileName}`);
  console.log(`   Password: parent123`);
  console.log("\n🚀 Start the dev server with: npm run dev");
  console.log("   Then visit: http://localhost:3000\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
