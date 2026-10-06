export type AdminCount = { name: string; count: number };
export type AuditEntry = {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
};
export type AdminDashboard = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  activeCategories: number;
  auditCount: number;
  roleCounts: AdminCount[];
  recentAudits: AuditEntry[];
};
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roles: string[];
  createdAt: string;
};
export type AdminRole = { name: string; description: string };
export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  reportCount: number;
};
export type SystemSetting = {
  key: string;
  value: string;
  description: string;
  version: number;
  updatedAt: string | null;
};
