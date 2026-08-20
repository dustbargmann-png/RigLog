import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/join", "/auth", "/update-password", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  // A Supabase email link (confirmation, invite, password recovery) can land
  // its one-time `code` on whatever bare path the project's Site URL points
  // to — which isn't necessarily /auth/confirm, the only place that knows
  // how to exchange it. Catch it wherever it shows up and forward it there.
  if (request.nextUrl.searchParams.has("code") && !request.nextUrl.pathname.startsWith("/auth/confirm")) {
    const confirmUrl = request.nextUrl.clone();
    confirmUrl.pathname = "/auth/confirm";
    confirmUrl.searchParams.set("next", request.nextUrl.pathname === "/" ? "/" : request.nextUrl.pathname);
    return NextResponse.redirect(confirmUrl);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
