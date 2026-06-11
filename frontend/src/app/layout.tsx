import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus AI — Early Detection of Social Isolation",
  description:
    "An ML-powered campus wellness tool that analyzes academic workload and social density to detect isolation early. Get personalized, low-pressure recommendations for reconnecting with campus life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
