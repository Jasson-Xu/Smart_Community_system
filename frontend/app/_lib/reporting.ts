export type Category = { id: string; slug: string; name: string; description: string };
export type ReportSummary = {
  reference: string;
  category: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  statusCode: string;
  status: string;
  submittedAt: string;
};
export type StatusHistory = { status: string; changedAt: string; note: string | null };
export type ReportComment = { id: string; authorName: string; body: string; createdAt: string };
export type StatusCount = { code: string; name: string; count: number };
export type ResidentDashboard = {
  totalReports: number;
  statusCounts: StatusCount[];
  recentReports: ReportSummary[];
};
export type ReportDetail = ReportSummary & {
  categorySlug: string;
  description: string;
  googlePlaceId: string | null;
  history: StatusHistory[];
};

export function formatReportDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value));
}
