import { z } from "zod";
import { ok, parseQuery, route } from "@/lib/api/respond";
import { prisma } from "@/lib/db/prisma";

const querySchema = z.object({
  category: z.string().min(1).max(64).optional(),
});

/**
 * GET /api/crops[?category=slug] — §36.
 *
 * Yields are returned so the buyer wizard can size land client-side for
 * responsiveness — but the server repeats that arithmetic on submit. Any
 * client-side calculation here is UX, never enforcement (CLAUDE.md §4.2).
 */
export const GET = route(async (request: Request) => {
  const { category } = parseQuery(request, querySchema);

  const crops = await prisma.crop.findMany({
    where: {
      isActive: true,
      ...(category ? { category: { slug: category } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      durationDays: true,
      planningYieldPerAcreKg: true,
      forecastYieldPerAcreKg: true,
      category: { select: { slug: true, name: true } },
    },
  });

  return ok(
    crops.map((crop) => ({
      id: crop.id,
      name: crop.name,
      slug: crop.slug,
      durationDays: crop.durationDays,
      category: crop.category,
      // Labelled at the edge so the UI cannot mistake these for guarantees
      // (§48, DESIGN.md §6).
      estimatedYield: {
        planningPerAcreKg: crop.planningYieldPerAcreKg,
        forecastPerAcreKg: crop.forecastYieldPerAcreKg,
        basis: "ESTIMATE",
      },
    })),
  );
});
