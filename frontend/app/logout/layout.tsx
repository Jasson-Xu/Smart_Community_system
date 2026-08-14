import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign out | Smart Community",
  description: "End your Smart Community account session securely.",
};

export default function LogoutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
