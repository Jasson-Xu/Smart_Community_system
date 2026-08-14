import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account | Smart Community",
  description: "Create a resident account to submit and track local community issues.",
};

export default function RegisterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
