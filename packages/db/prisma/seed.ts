import { prisma } from "../src/index";

async function main() {
  // Seed data is added phase by phase — see MELLOW_MVP_BUILD_PLAN.md.
  console.log("Nothing to seed yet.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
