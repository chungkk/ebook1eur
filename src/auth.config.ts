import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === "admin";

      const protectedRoutes = ["/account", "/checkout"];
      const adminRoutes = ["/admin"];
      const authRoutes = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ];

      const isProtectedRoute = protectedRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );
      const isAdminRoute = adminRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );
      const isAuthRoute = authRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );

      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        if (!isAdmin) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (isProtectedRoute) {
        return isLoggedIn;
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
