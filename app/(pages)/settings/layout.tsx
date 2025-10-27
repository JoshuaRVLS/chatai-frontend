import type { Metadata } from "next";
import { useQuery } from "@tanstack/react-query";

export const metadata: Metadata = {
  title: "Settings",
  description: "Settings",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
