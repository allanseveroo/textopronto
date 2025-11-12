import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog | TextoPronto',
  description: 'Artigos e dicas sobre vendas no WhatsApp.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="py-6 bg-gray-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className='flex justify-between items-center'>
                <h1 className="text-4xl font-bold">
                    <Link href="/blog">Blog do TextoPronto</Link>
                </h1>
                <Link href="/" className="text-primary hover:underline">Voltar ao App</Link>
            </div>
          <p className="mt-2 text-lg text-muted-foreground">
            Dicas, estratégias e novidades sobre vendas no WhatsApp.
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
       <footer className="py-8 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-neutral-500">
          <p>Produto do Revizap</p>
        </div>
      </footer>
    </div>
  );
}
