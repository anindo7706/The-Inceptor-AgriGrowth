import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST only — a GET sign-out can be triggered by an <img> tag on any site. */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
