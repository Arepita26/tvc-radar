import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://tvc-radar.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TVC Radar | Monitor de Última Hora en Venezuela",
    template: "%s | TVC Radar",
  },
  description:
    "Sistema de Inteligencia Informativa y Monitoreo de Última Hora de La TV Calle. Cobertura en tiempo real de medios venezolanos, vocerías del Estado, servicios públicos y Derechos Humanos.",
  keywords: [
    "TVC Radar",
    "La TV Calle",
    "Noticias de Venezuela",
    "Última Hora Venezuela",
    "Monitoreo de Medios Venezuela",
    "Derechos Humanos Venezuela",
    "Servicios Públicos Venezuela",
    "Política Venezuela",
    "Radar Informativo",
    "Periodismo Venezuela",
  ],
  authors: [{ name: "La TV Calle", url: "https://latvcalle.com" }],
  creator: "La TV Calle",
  publisher: "La TV Calle",
  category: "news",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TVC Radar",
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: siteUrl,
    title: "TVC Radar | Monitor de Última Hora en Venezuela",
    description:
      "Sistema de Inteligencia Informativa y Monitoreo de Última Hora de La TV Calle. Cobertura en tiempo real sin censura.",
    siteName: "TVC Radar",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TVC Radar - Monitor de Última Hora",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TVC Radar | Monitor de Última Hora en Venezuela",
    description:
      "Monitoreo continuo de medios, vocerías del Estado, servicios públicos y DDHH en Venezuela por La TV Calle.",
    creator: "@latvcalle",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#F5F5F7" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NewsMediaOrganization",
      "@id": "https://tvc-radar.vercel.app/#organization",
      "name": "TVC Radar | La TV Calle",
      "url": "https://tvc-radar.vercel.app",
      "logo": "https://tvc-radar.vercel.app/icon-512.png",
      "sameAs": [
        "https://twitter.com/latvcalle",
        "https://latvcalle.com"
      ],
      "description": "Sistema de Inteligencia Informativa de Última Hora para periodistas y salas de redacción en Venezuela."
    },
    {
      "@type": "WebApplication",
      "@id": "https://tvc-radar.vercel.app/#webapp",
      "name": "TVC Radar",
      "url": "https://tvc-radar.vercel.app",
      "applicationCategory": "NewsApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdSchema),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('tvc_theme');
                  if (storedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] antialiased selection:bg-blue-500 selection:text-white dark:bg-[#000000] dark:text-[#F5F5F7]">
        {children}
      </body>
    </html>
  );
}
