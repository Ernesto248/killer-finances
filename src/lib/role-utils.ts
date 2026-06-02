import type { UserRole } from "@/types";

export function canEdit(role: UserRole): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}
