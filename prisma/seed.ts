/**
 * Seed: crop categories, crops, crop plans with stages, every platform config
 * row, and one demo user per role.
 *
 * Idempotent — safe to re-run. Everything is upserted on a stable key.
 *
 * Demo rows carry `isDemo: true` so the UI can distinguish demo data from
 * real data, which §48 requires.
 *
 * Note on demo users: these rows exist in `public.User` only. They have no
 * `auth.users` counterpart and therefore cannot log in. Creating auth users
 * needs the service-role key and is done by a separate script once
 * credentials are in place — the seed must not depend on network access.
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { CONFIG_KEYS, CONFIG_KEY_LIST } from "../src/lib/config/keys";

const prisma = new PrismaClient();

// Fixed uuids so re-seeding does not create duplicates and so tests can
// reference known ids.
const DEMO_USERS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    fullName: "Demo Buyer (Harvest Foods Pvt Ltd)",
    email: "buyer@demo.agrigrowth.test",
    roles: ["BUYER"],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    fullName: "Demo Landowner",
    email: "landowner@demo.agrigrowth.test",
    roles: ["LANDOWNER"],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    fullName: "Demo Worker",
    phone: "+910000000003",
    roles: ["WORKER"],
  },
  {
    // R-18 in the seed data itself: the smallholder who owns land and also
    // works a neighbour's field. If the role model regresses to a single
    // column, this row stops being representable and the seed breaks loudly.
    id: "00000000-0000-4000-8000-000000000004",
    fullName: "Demo Smallholder (owns land, also works)",
    phone: "+910000000004",
    roles: ["LANDOWNER", "WORKER"],
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    fullName: "Demo Inspector",
    email: "inspector@demo.agrigrowth.test",
    roles: ["INSPECTOR"],
  },
  {
    id: "00000000-0000-4000-8000-000000000006",
    fullName: "Demo Admin",
    email: "admin@demo.agrigrowth.test",
    roles: ["ADMIN"],
  },
] as const;

const CATEGORIES = [
  { slug: "grains", name: "Grains / Crops", sortOrder: 1 },
  { slug: "vegetables", name: "Vegetables", sortOrder: 2 },
  { slug: "fruits", name: "Fruits", sortOrder: 3 },
  { slug: "flowers", name: "Flowers", sortOrder: 4 },
  { slug: "commercial", name: "Commercial Crops", sortOrder: 5 },
] as const;

/**
 * Yields are conservative planning figures for Indian conditions, and are
 * starting points for an agronomist to correct — not authoritative data.
 *
 * planningYield < forecastYield deliberately (R-8): the first sizes land with
 * the safety margin baked in, the second is the realistic expectation.
 */
const CROPS = [
  {
    slug: "paddy",
    name: "Paddy",
    category: "grains",
    planningYieldPerAcreKg: 1_600,
    forecastYieldPerAcreKg: 1_850,
    durationDays: 120,
    preparationLeadDays: 10,
  },
  {
    slug: "wheat",
    name: "Wheat",
    category: "grains",
    planningYieldPerAcreKg: 1_400,
    forecastYieldPerAcreKg: 1_600,
    durationDays: 140,
    preparationLeadDays: 12,
  },
  {
    slug: "maize",
    name: "Maize",
    category: "grains",
    planningYieldPerAcreKg: 2_200,
    forecastYieldPerAcreKg: 2_500,
    durationDays: 100,
    preparationLeadDays: 8,
  },
  {
    slug: "potato",
    name: "Potato",
    category: "vegetables",
    planningYieldPerAcreKg: 8_000,
    forecastYieldPerAcreKg: 9_200,
    durationDays: 90,
    preparationLeadDays: 7,
  },
  {
    slug: "tomato",
    name: "Tomato",
    category: "vegetables",
    planningYieldPerAcreKg: 10_000,
    forecastYieldPerAcreKg: 12_000,
    durationDays: 110,
    preparationLeadDays: 7,
  },
  {
    slug: "onion",
    name: "Onion",
    category: "vegetables",
    planningYieldPerAcreKg: 7_000,
    forecastYieldPerAcreKg: 8_200,
    durationDays: 130,
    preparationLeadDays: 9,
  },
] as const;

type StageSeed = {
  kind: Prisma.CropStageCreateManyPlanInput["kind"];
  name: string;
  startDayOffset: number;
  endDayOffset: number;
  workerFactorPerAcre: number;
  taskFactor?: number;
  requiresEvidence?: boolean;
  requiresGpsCheckIn?: boolean;
};

/**
 * §16 is explicit that crops must not share a fixed schedule. Paddy and
 * tomato below have genuinely different stage counts, durations and labour
 * curves — the Phase 6 test asserts they produce different timelines.
 *
 * Worker factors follow §19's shape: preparation, planting and harvest are
 * labour-heavy; the growing stages are not.
 */
const PLANS: Record<string, StageSeed[]> = {
  paddy: [
    { kind: "PREPARATION", name: "Land preparation & puddling", startDayOffset: -10, endDayOffset: -1, workerFactorPerAcre: 3.5 },
    { kind: "PLANTING", name: "Transplanting", startDayOffset: 0, endDayOffset: 5, workerFactorPerAcre: 4.0 },
    { kind: "EARLY_GROWTH", name: "Tillering & first weeding", startDayOffset: 15, endDayOffset: 30, workerFactorPerAcre: 1.2 },
    { kind: "VEGETATIVE_GROWTH", name: "Vegetative growth & fertiliser", startDayOffset: 31, endDayOffset: 55, workerFactorPerAcre: 0.8 },
    { kind: "REPRODUCTIVE", name: "Panicle initiation & flowering", startDayOffset: 56, endDayOffset: 85, workerFactorPerAcre: 0.6 },
    { kind: "MATURITY", name: "Grain filling & maturity", startDayOffset: 86, endDayOffset: 110, workerFactorPerAcre: 0.4, requiresGpsCheckIn: false },
    { kind: "HARVEST", name: "Harvest", startDayOffset: 111, endDayOffset: 120, workerFactorPerAcre: 4.5 },
  ],
  wheat: [
    { kind: "PREPARATION", name: "Ploughing & field preparation", startDayOffset: -12, endDayOffset: -1, workerFactorPerAcre: 2.8 },
    { kind: "PLANTING", name: "Sowing", startDayOffset: 0, endDayOffset: 4, workerFactorPerAcre: 2.5 },
    { kind: "EARLY_GROWTH", name: "Crown root initiation & irrigation", startDayOffset: 18, endDayOffset: 35, workerFactorPerAcre: 1.0 },
    { kind: "VEGETATIVE_GROWTH", name: "Tillering & top dressing", startDayOffset: 36, endDayOffset: 70, workerFactorPerAcre: 0.7 },
    { kind: "REPRODUCTIVE", name: "Heading & flowering", startDayOffset: 71, endDayOffset: 100, workerFactorPerAcre: 0.5 },
    { kind: "MATURITY", name: "Grain filling", startDayOffset: 101, endDayOffset: 130, workerFactorPerAcre: 0.3, requiresGpsCheckIn: false },
    { kind: "HARVEST", name: "Harvest & threshing", startDayOffset: 131, endDayOffset: 140, workerFactorPerAcre: 3.8 },
  ],
  maize: [
    { kind: "PREPARATION", name: "Field preparation", startDayOffset: -8, endDayOffset: -1, workerFactorPerAcre: 2.5 },
    { kind: "PLANTING", name: "Sowing", startDayOffset: 0, endDayOffset: 3, workerFactorPerAcre: 2.2 },
    { kind: "VEGETATIVE_GROWTH", name: "Knee-high & weeding", startDayOffset: 20, endDayOffset: 45, workerFactorPerAcre: 1.4 },
    { kind: "REPRODUCTIVE", name: "Tasselling & silking", startDayOffset: 46, endDayOffset: 70, workerFactorPerAcre: 0.6 },
    { kind: "MATURITY", name: "Grain filling", startDayOffset: 71, endDayOffset: 92, workerFactorPerAcre: 0.4, requiresGpsCheckIn: false },
    { kind: "HARVEST", name: "Harvest", startDayOffset: 93, endDayOffset: 100, workerFactorPerAcre: 3.5 },
  ],
  potato: [
    { kind: "PREPARATION", name: "Ridging & bed preparation", startDayOffset: -7, endDayOffset: -1, workerFactorPerAcre: 3.0 },
    { kind: "PLANTING", name: "Tuber planting", startDayOffset: 0, endDayOffset: 4, workerFactorPerAcre: 4.5 },
    { kind: "EARLY_GROWTH", name: "Sprouting & earthing up", startDayOffset: 15, endDayOffset: 35, workerFactorPerAcre: 2.0 },
    { kind: "VEGETATIVE_GROWTH", name: "Canopy growth & blight watch", startDayOffset: 36, endDayOffset: 60, workerFactorPerAcre: 1.0 },
    { kind: "MATURITY", name: "Tuber bulking & haulm cutting", startDayOffset: 61, endDayOffset: 82, workerFactorPerAcre: 0.8 },
    { kind: "HARVEST", name: "Digging & grading", startDayOffset: 83, endDayOffset: 90, workerFactorPerAcre: 5.0 },
  ],
  tomato: [
    { kind: "PREPARATION", name: "Nursery & bed preparation", startDayOffset: -7, endDayOffset: -1, workerFactorPerAcre: 3.2 },
    { kind: "PLANTING", name: "Transplanting", startDayOffset: 0, endDayOffset: 5, workerFactorPerAcre: 4.2 },
    { kind: "EARLY_GROWTH", name: "Staking & training", startDayOffset: 12, endDayOffset: 30, workerFactorPerAcre: 2.4 },
    { kind: "VEGETATIVE_GROWTH", name: "Pruning & pest management", startDayOffset: 31, endDayOffset: 55, workerFactorPerAcre: 1.8 },
    { kind: "REPRODUCTIVE", name: "Flowering & fruit set", startDayOffset: 56, endDayOffset: 75, workerFactorPerAcre: 1.2 },
    { kind: "HARVEST", name: "Staggered picking", startDayOffset: 76, endDayOffset: 110, workerFactorPerAcre: 3.0, taskFactor: 1.4 },
  ],
  onion: [
    { kind: "PREPARATION", name: "Nursery & field preparation", startDayOffset: -9, endDayOffset: -1, workerFactorPerAcre: 3.0 },
    { kind: "PLANTING", name: "Transplanting", startDayOffset: 0, endDayOffset: 6, workerFactorPerAcre: 5.0 },
    { kind: "EARLY_GROWTH", name: "Establishment & weeding", startDayOffset: 18, endDayOffset: 40, workerFactorPerAcre: 2.2 },
    { kind: "VEGETATIVE_GROWTH", name: "Bulb initiation", startDayOffset: 41, endDayOffset: 80, workerFactorPerAcre: 1.0 },
    { kind: "MATURITY", name: "Bulb development & neck fall", startDayOffset: 81, endDayOffset: 118, workerFactorPerAcre: 0.6, requiresGpsCheckIn: false },
    { kind: "HARVEST", name: "Lifting & curing", startDayOffset: 119, endDayOffset: 130, workerFactorPerAcre: 4.0 },
  ],
};

async function seedConfig() {
  for (const key of CONFIG_KEY_LIST) {
    const def = CONFIG_KEYS[key];
    await prisma.platformConfig.upsert({
      where: { key },
      // Never overwrite a value an admin has tuned. The seed establishes
      // defaults; it does not reset production.
      update: { description: def.description, prdSection: def.prdSection },
      create: {
        key,
        valueType: def.type,
        value: def.value,
        description: def.description,
        prdSection: def.prdSection,
      },
    });
  }
  return CONFIG_KEY_LIST.length;
}

async function seedUsers() {
  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { fullName: user.fullName },
      create: {
        id: user.id,
        fullName: user.fullName,
        email: "email" in user ? user.email : null,
        phone: "phone" in user ? user.phone : null,
        isDemo: true,
      },
    });
    for (const role of user.roles) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: user.id, role } },
        update: {},
        create: { userId: user.id, role },
      });
    }
  }
  return DEMO_USERS.length;
}

async function seedCrops() {
  const categoryIds = new Map<string, string>();
  for (const category of CATEGORIES) {
    const row = await prisma.cropCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder },
      create: category,
    });
    categoryIds.set(category.slug, row.id);
  }

  for (const crop of CROPS) {
    const categoryId = categoryIds.get(crop.category);
    if (!categoryId) throw new Error(`Unknown category: ${crop.category}`);

    const row = await prisma.crop.upsert({
      where: { slug: crop.slug },
      update: {
        name: crop.name,
        planningYieldPerAcreKg: crop.planningYieldPerAcreKg,
        forecastYieldPerAcreKg: crop.forecastYieldPerAcreKg,
        durationDays: crop.durationDays,
        preparationLeadDays: crop.preparationLeadDays,
      },
      create: {
        slug: crop.slug,
        name: crop.name,
        categoryId,
        planningYieldPerAcreKg: crop.planningYieldPerAcreKg,
        forecastYieldPerAcreKg: crop.forecastYieldPerAcreKg,
        durationDays: crop.durationDays,
        preparationLeadDays: crop.preparationLeadDays,
      },
    });

    const stages = PLANS[crop.slug];
    if (!stages) throw new Error(`Crop "${crop.slug}" has no plan.`);

    const plan = await prisma.cropPlan.upsert({
      where: { cropId: row.id },
      update: {},
      create: { cropId: row.id },
    });

    // Stages are replaced wholesale — offsets are only meaningful as a set.
    await prisma.cropStage.deleteMany({ where: { planId: plan.id } });
    await prisma.cropStage.createMany({
      data: stages.map((stage, index) => ({
        planId: plan.id,
        kind: stage.kind,
        name: stage.name,
        startDayOffset: stage.startDayOffset,
        endDayOffset: stage.endDayOffset,
        sortOrder: index,
        workerFactorPerAcre: stage.workerFactorPerAcre,
        taskFactor: stage.taskFactor ?? 1.0,
        requiresEvidence: stage.requiresEvidence ?? true,
        requiresGpsCheckIn: stage.requiresGpsCheckIn ?? true,
      })),
    });
  }

  return { categories: CATEGORIES.length, crops: CROPS.length };
}

async function main() {
  console.log("Seeding AgriGrowth…\n");

  const configCount = await seedConfig();
  console.log(`  config     ${configCount} platform rules`);

  const userCount = await seedUsers();
  console.log(`  users      ${userCount} demo users (isDemo = true)`);

  const { categories, crops } = await seedCrops();
  console.log(`  categories ${categories}`);
  console.log(`  crops      ${crops}, each with a stage-by-stage plan`);

  console.log("\nDone. Demo users exist in public.User only — they have no");
  console.log("auth.users row yet, so they cannot log in until Phase 2.");
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
