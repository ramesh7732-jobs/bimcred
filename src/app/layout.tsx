import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "BIMcred — Verified BIM talent, scored",
    template: "%s · BIMcred",
  },
  description:
    "BIMcred scores BIM professionals on a 100-500 Level of Competence scale so US employers can hire on proof instead of claims.",
  applicationName: "BIMcred",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
