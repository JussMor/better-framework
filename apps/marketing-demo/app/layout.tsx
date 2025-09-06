import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Framework Demo",
  description: "A demo application showcasing Better Framework features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-xl font-bold">Better Framework Demo</h1>
          </div>
        </nav>
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
