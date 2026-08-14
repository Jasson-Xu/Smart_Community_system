import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Smart Community",
  description: "Sign in to follow community reports and council updates.",
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
