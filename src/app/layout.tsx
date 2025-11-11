
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TextoPronto: Gerador de Textos de Vendas para WhatsApp",
  description: "Crie textos de vendas para WhatsApp em segundos com o TextoPronto. Nosso gerador de textos usa IA para criar mensagens personalizadas para seu negócio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
