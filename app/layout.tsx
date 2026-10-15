import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CallCatch — never lose a job to a missed call",
  description:
    "When you can't pick up, CallCatch texts the caller back in five seconds. For plumbers, trades and dental front desks.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
