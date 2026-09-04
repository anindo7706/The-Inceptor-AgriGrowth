import { route, ok } from "@/lib/api/respond";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/categories — §36.
 *
 * Public: the category list is not sensitive, and the buyer wizard needs it
 * before sign-in on the marketing pages.
 *
 * Proves the API layer end to end: envelope, error wrapper, Prisma client.
 */
export const GET = route(async () => {
  const categories = await prisma.cropCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { crops: true } },
    },
  });

  return ok(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      cropCount: category._count.crops,
    })),
  );
});
