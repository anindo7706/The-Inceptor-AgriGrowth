process.loadEnvFile(".env.local");
const { PrismaClient } = await import("@prisma/client");
const p = new PrismaClient();

const [config, users, roles, cats, crops, stages] = await Promise.all([
  p.platformConfig.count(), p.user.count(), p.userRole.count(),
  p.cropCategory.count(), p.crop.count(), p.cropStage.count(),
]);
console.log(`  PlatformConfig ${config}\n  User ${users}  UserRole ${roles}`);
console.log(`  CropCategory ${cats}  Crop ${crops}  CropStage ${stages}\n`);

const multi = await p.user.findMany({
  where: { roles: { some: { role: "LANDOWNER" } } },
  select: { fullName: true, roles: { select: { role: true } } },
});
const both = multi.filter(u => u.roles.length > 1);
console.log(`  R-18 multi-role user present: ${both.length > 0 ? "yes" : "NO"}`);
for (const u of both) console.log(`    ${u.fullName} -> ${u.roles.map(r => r.role).join(" + ")}`);

const paddy = await p.crop.findUnique({
  where: { slug: "paddy" },
  select: { planningYieldPerAcreKg: true, forecastYieldPerAcreKg: true,
            plan: { select: { stages: { select: { id: true } } } } },
});
const tomato = await p.crop.findUnique({
  where: { slug: "tomato" }, select: { plan: { select: { stages: { select: { id: true } } } } },
});
console.log(`\n  R-8 two distinct yields: planning ${paddy.planningYieldPerAcreKg} < forecast ${paddy.forecastYieldPerAcreKg} -> ${paddy.planningYieldPerAcreKg < paddy.forecastYieldPerAcreKg ? "ok" : "FAIL"}`);
console.log(`  §16 crop-specific plans: paddy ${paddy.plan.stages.length} stages, tomato ${tomato.plan.stages.length} stages`);

await p.$disconnect();
