import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return session;
}

export async function requireAuth() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function getOptionalSession() {
  return await auth();
}
