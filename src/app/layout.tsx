import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AuthInitializer from "@/app/components/auth/AuthInitializer";
import FavoritesInitializer from "@/app/components/favorites/FavoritesInitializer";
import ToastViewport from "@/app/components/ui/ToastViewport";
import { uiClassNames } from "@/app/lib/styles";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Airbnb Việt Nam",
    template: "%s | Airbnb Việt Nam",
  },
  description:
    "Khám phá và đặt những không gian lưu trú đáng nhớ trên khắp Việt Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=localStorage.getItem('theme');if(e){c.add(e)}else{var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';c.add(p);e=p;}d.setAttribute('data-theme',e);d.style.colorScheme=e;}catch(t){}}();`,
          }}
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.3.0/css/all.min.css"
          integrity="sha512-ApSLB1Pd3/bZN8fWB/RG9YhN/7bd9Hkf3AGaE2mPfebjrxagjuBtx2GcgdqIlJkUzwylBo61r9Xa9NmgBI0swA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`flex min-h-full flex-col bg-white text-gray-900 selection:bg-rose-500/20 ${uiClassNames.globalInteractions}`}
      >
        <AuthInitializer />
        <FavoritesInitializer />
        <ToastViewport />
        {children}
      </body>
    </html>
  );
}
