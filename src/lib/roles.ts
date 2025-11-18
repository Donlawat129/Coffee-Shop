// src/lib/roles.ts
export type Role = "superadmin" | "admin" | "owner" | "staff";

// แก้ mapping นี้ได้ตามจริง
export const EMAIL_ROLE: Record<string, Role> = {
  "superadmin@gmail.com": "superadmin",
  "admin@gmail.com": "admin",
  "owner@gmail.com": "owner",
  "staff@gmail.com": "staff",
  "staff2@gmail.com": "staff",
};

export function roleOfEmail(email?: string | null): Role {
  if (!email) return "staff";
  const key = email.toLowerCase();
  return EMAIL_ROLE[key] ?? "staff";
}
