import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ConnectivityBanner } from "@/components/pwa/connectivity-banner";

export const metadata: Metadata = {
  metadataBase: new URL("https://liago.vercel.app"),
  applicationName: "LiaGo",
  title: {
    default: "LiaGo",
    template: "%s | LiaGo",
  },
  description: "LiaGo — Tu negocio en movimiento.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  keywords: [
    "gestión comercial",
    "ventas",
    "clientes",
    "inventario",
    "caja",
    "cuenta corriente",
    "LiaGo",
  ],
  authors: [{ name: "LiaGo" }],
  creator: "LiaGo",
  publisher: "LiaGo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_PY",
    url: "https://liago.vercel.app",
    siteName: "LiaGo",
    title: "LiaGo — Tu negocio en movimiento",
    description: "Gestioná clientes, productos, ventas, pagos e inventario desde un solo lugar.",
  },
  twitter: {
    card: "summary",
    title: "LiaGo — Tu negocio en movimiento",
    description: "Gestioná clientes, productos, ventas, pagos e inventario desde un solo lugar.",
  },
  appleWebApp: {
    capable: true,
    title: "LiaGo",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
