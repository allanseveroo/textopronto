
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://textopronto.com"; // Substitua pelo seu domínio quando tiver um

export const metadata: Metadata = {
  // Título bem construído com keywords comerciais
  title: "TextoPronto: Gerador de Textos para Vendas no WhatsApp",
  // Descrição focada em intenção de busca
  description: "Crie mensagens e textos prontos para vendas no WhatsApp grátis. Use nosso gerador com IA para fechar mais vendas, fazer follow-up, prospecção e muito mais.",
  
  // Palavras-chave long tail usadas naturalmente
  keywords: [
    "mentor para vendas no whatsapp",
    "texto mensagens prontas whatsapp",
    "vendas no whatsapp",
    "como vender pelo whatsapp",
    "texto pronto para vendas no whatsapp grátis",
    "como fechar vendas pelo whatsapp",
    "como definir horário de atendimento no whatsapp business",
    "app whatsapp business"
  ],

  // Robots liberado para indexação
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Open Graph para redes sociais
  openGraph: {
    title: "TextoPronto: Textos de Vendas para WhatsApp em Segundos",
    description: "Transforme sua prospecção e vendas no WhatsApp com mensagens prontas geradas por IA.",
    url: siteUrl,
    siteName: 'TextoPronto',
    images: [
      {
        url: `${siteUrl}/og-image.png`, // Imagem para compartilhamento
        width: 1200,
        height: 630,
        alt: "Logo do TextoPronto com a chamada para ação",
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },

  // Canonical (evita duplicidade)
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Schema JSON-LD completo
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TextoPronto',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* Usa Inter via preconnect (melhor desempenho) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
