import { MessageGenerator } from '@/components/message-generator';
import { Bot } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary font-headline">VendaZap AI</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <MessageGenerator />
      </main>
      <footer className="bg-card border-t py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} VendaZap AI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
