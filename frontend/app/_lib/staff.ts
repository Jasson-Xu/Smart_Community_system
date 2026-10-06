export type StaffCount = { code: string; name: string; count: number };
export type StaffReportSummary = {
  reference: string;
  category: string;
  location: string;
  priority: string;
  statusCode: string;
  status: string;
  assignedToName: string | null;
  submittedAt: string;
};
export type StaffDashboard = {
  totalReports: number;
  unassignedReports: number;
  urgentReports: number;
  submittedLast30Days: number;
  resolvedLast30Days: number;
  statusCounts: StaffCount[];
  priorityCounts: StaffCount[];
  recentReports: StaffReportSummary[];
};
export type StaffUser = { id: string; name: string; email: string; role: string };
export type StaffHistory = {
  statusCode: string;
  status: string;
  changedByName: string;
  note: string | null;
  changedAt: string;
};
export type Assignment = {
  id: string;
  assignedToUserId: string;
  assignedToName: string;
  assignedByName: string;
  assignedAt: string;
};
export type StaffComment = {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
};
export type DuplicateReview = {
  id: string;
  potentialDuplicateReference: string;
  markedByName: string;
  note: string | null;
  createdAt: string;
};
export type StaffReportDetail = {
  reference: string;
  residentName: string;
  residentEmail: string;
  category: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  priority: string;
  statusCode: string;
  status: string;
  submittedAt: string;
  currentAssignment: Assignment | null;
  assignments: Assignment[];
  history: StaffHistory[];
  comments: StaffComment[];
  duplicates: DuplicateReview[];
};
