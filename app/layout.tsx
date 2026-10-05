import type { Metadata } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ConnectivityBanner } from "@/components/pwa/connectivity-banner";

export const metadata: Metadata = {
  title: "LiaGo",
  description: "LiaGo — Tu negocio en movimiento",
  manifest: "/manifest.webmanifest",
  themeColor: "#2563eb",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "LiaGo",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <ServiceWorkerRegister />
        <ConnectivityBanner />
        {children}
      </body>
    </html>
  );
}
