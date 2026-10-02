import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiaGo",
  description: "LiaGo — Tu negocio en movimiento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
