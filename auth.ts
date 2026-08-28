import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  trustHost: true,
  providers: [GitHub],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async signIn({ user }: { user: { email?: string | null } }) {
      const allowedEmail = process.env.AUTH_ALLOWED_EMAIL?.trim().toLowerCase();
      if (!allowedEmail || !user.email) {
        return false;
      }

      return user.email.toLowerCase() === allowedEmail;
    },
    async authorized({ auth, request }: { auth: { user?: { email?: string | null } } | null; request: any }) {
      const { pathname } = request.nextUrl;
      const publicPaths = ["/login", "/api/auth", "/_next", "/favicon.ico"];

      if (publicPaths.some((path) => pathname === path || pathname.startsWith(path))) {
        return true;
      }

      return !!auth?.user;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
