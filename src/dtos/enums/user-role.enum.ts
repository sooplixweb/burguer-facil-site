export const UserRole = {
  ADMIN: "admin",
  CUSTOMER: "customer",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
