import { ensureDemoSeed } from "../src/services/demo-seed-service.js";
import { prisma } from "../src/lib/prisma.js";

try {
  const seed = await ensureDemoSeed();
  console.log(JSON.stringify(seed, null, 2));
} finally {
  await prisma.$disconnect();
}
