import { getServerSession } from "next-auth";
import { authOptions } from "./auth.config";
import type { UserRole } from "@/types";
export { canEdit, isAdmin } from "@/lib/role-utils";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("No autorizado");
  }
  return user;
}
