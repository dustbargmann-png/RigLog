import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Every Supabase email link (signup confirmation, invite, password recovery)
// lands here with a one-time `code`. This exchanges it for a real session and
// forwards on — the alternative is what we had before: the code arrives at a
// plain page that can't write session cookies (only Route Handlers and
// Server Actions can) and it just sits there unused.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set(
    "error",
    "That link is invalid or has expired. Please request a new one.",
  );
  return NextResponse.redirect(loginUrl);
}
