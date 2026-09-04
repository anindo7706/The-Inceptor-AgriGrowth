import { z } from "zod";
import { ok, parseBody, route } from "@/lib/api/respond";
import { ApiError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { SELF_SERVICE_ROLES } from "@/lib/auth/roles";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  // The allowlist IS the enforcement (§29A.1). INSPECTOR and ADMIN are
  // absent by construction, so a crafted request cannot ask for them.
  role: z.enum(SELF_SERVICE_ROLES),
});

/**
 * Creates the `public.User` row after a first sign-in.
 *
 * The id is taken from the verified Supabase session, never from the request
 * body — otherwise anyone could create a profile against another user's uuid.
 */
export const POST = route(async (request: Request) => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) throw ApiError.unauthenticated();

  const { fullName, role } = await parseBody(request, schema);

  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict("This account already has a profile.");
  }

  // One transaction: a User without a UserRole is a user who can sign in and
  // do nothing, with no route to fix itself.
  const created = await prisma.$transaction(async (tx) => {
    const profile = await tx.user.create({
      data: {
        id: authUser.id,
        email: authUser.email ?? null,
        phone: authUser.phone ?? null,
        fullName,
      },
    });

    await tx.userRole.create({ data: { userId: profile.id, role } });

    await tx.auditLog.create({
      data: {
        actorId: profile.id,
        entityType: "User",
        entityId: profile.id,
        action: "PROFILE_CREATED",
        toState: role,
        reason: "Self-service signup",
      },
    });

    return profile;
  });

  return ok({ id: created.id, fullName: created.fullName, roles: [role] });
});
