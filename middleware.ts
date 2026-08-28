import { auth } from "./auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const publicPaths = ["/login", "/api/auth", "/_next", "/favicon.ico"];

  if (publicPaths.some((path) => pathname === path || pathname.startsWith(path))) {
    return;
  }

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
