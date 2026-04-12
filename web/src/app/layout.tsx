import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { TelegramInit } from "@/components/ui/TelegramInit";
import BottomNav from "@/components/ui/BottomNav";
import LiquidBackground from "@/components/ui/LiquidBackground";

export const metadata: Metadata = {
  title: "РискЛаб — Симулятор страхования",
  description: "Интерактивный симулятор жизни подростка, обучающий страхованию",
  openGraph: {
    title: "РискЛаб — Научись страхованию за 5 минут",
    description: "50 000 руб, 6 месяцев виртуальной жизни, непредсказуемые события. Сможешь сохранить бюджет?",
    type: "website",
    locale: "ru_RU",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://st.max.ru/js/max-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TelegramInit />
        <LiquidBackground />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
