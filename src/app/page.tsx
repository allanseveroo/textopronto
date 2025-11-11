'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateWhatsAppMessage,
} from '@/ai/flows/generate-whatsapp-message';
import TextareaAutosize from 'react-textarea-autosize';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowUp, Check, Copy, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';

const formSchema = z.object({
  salesTag: z.string().default('Saudação'),
  nicheDetails: z.string().min(1, 'Escreva sobre seu negócio.'),
});

type GeneratedMessage = {
  message: string;
  salesTag: string;
};

const salesTags = [
  { value: 'Saudação', label: '👋 Saudação' },
  { value: 'Prospecção em Grupos', label: '👥 Prospecção em Grupos' },
  { value: 'Contorno de Objeções', label: '🤔 Contorno de Objeções' },
  { value: 'Follow-up', label: '🔄 Follow-up' },
  { value: 'Promoção', label: '🎉 Promoção' },
  { value: 'Recuperação de Vendas', label: '🛒 Recuperação de Vendas' },
  { value: 'Cobrança', label: '💰 Cobrança' },
  { value: 'Agendamento', label: '📅 Agendamento' },
  { value: 'Pós-venda', label: '👍 Pós-venda' },
  { value: 'Pesquisa de Satisfação', label: '🌟 Pesquisa de Satisfação' },
  { value: 'Divulgação de Novidades', label: '🚀 Divulgação de Novidades' },
  { value: 'Agradecimento', label: '🙏 Agradecimento' },
  { value: 'Lembrete de Evento', label: '🔔 Lembrete de Evento' },
  { value: 'Outros', label: '💬 Outros' },
];

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.015 34.823 44 29.833 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);


const GeneratedMessageCard = ({ message, salesTag, index }: { message: string; salesTag: string; index: number }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    toast({
      description: 'A mensagem foi copiada para a área de transferência.',
    });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const tagLabel = salesTags.find(tag => tag.value === salesTag)?.label || salesTag;

  return (
    <Card className="text-left max-w-2xl w-full mx-auto transition-all duration-500 animate-in fade-in-0 zoom-in-95 bg-card shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="font-bold text-lg">Sua Mensagem #{index} - ({tagLabel})</CardTitle>
        <Button variant="ghost" size="sm" onClick={copyToClipboard} className="shrink-0 bg-secondary hover:bg-secondary/80">
          {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {isCopied ? 'Copiado!' : 'Copiar'}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="whitespace-normal break-words text-foreground/90 leading-relaxed pt-2">
          {message}
        </p>
      </CardContent>
    </Card>
  );
};


export default function Home() {
  const [isGenerating, startTransition] = useTransition();
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesTag: 'Saudação',
      nicheDetails: '',
    },
  });

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Serviço de autenticação ou banco de dados não disponível.' });
      return;
    }
    setIsAuthLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = doc(firestore, "users", user.uid);
      const userDocSnap = await getDoc(userDoc);

      if (!userDocSnap.exists()) {
        await setDoc(userDoc, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          messageCount: 0
        });
      }
      setShowLoginModal(false);
      toast({
        title: 'Login realizado com sucesso!',
        description: `Bem-vindo(a), ${user.displayName}!`,
      });
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({
              variant: "destructive",
              title: "Erro de autenticação",
              description: "Não foi possível fazer login com o Google. Por favor, tente novamente.",
          });
      }
    } finally {
      setIsAuthLoading(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (userDocRef) {
        try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().messageCount >= 5) {
                toast({
                    variant: 'destructive',
                    title: 'Limite atingido',
                    description: 'Você já gerou 5 mensagens. Para gerar mais, por favor, entre em contato.',
                });
                return;
            }
        } catch(e) {
            console.error("Error checking user message count", e);
            toast({
                variant: 'destructive',
                title: 'Erro ao verificar o limite',
                description: 'Não foi possível verificar seu limite de mensagens. Tente novamente.',
            });
            return;
        }

    }

    startTransition(async () => {
      try {
        const result = await generateWhatsAppMessage({
          salesTag: values.salesTag,
          nicheDetails: values.nicheDetails,
        });
        setGeneratedMessages(prev => [{ message: result.message, salesTag: values.salesTag }, ...prev]);

        if (userDocRef) {
            await setDoc(userDocRef, { messageCount: increment(1) }, { merge: true });
        }

        form.reset({
          salesTag: values.salesTag,
          nicheDetails: '',
        });
      } catch (error) {
        console.error('Failed to generate message:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar mensagem',
          description:
            'Ocorreu um problema com a IA. Por favor, tente novamente.',
        });
      }
    });
  }

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setGeneratedMessages([]);
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
       <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <h1 className="text-2xl font-bold text-foreground">TextoPronto</h1>
           {user && (
            <Button variant="ghost" onClick={handleLogout} disabled={isUserLoading}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center px-4 pt-8">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
          <div className="flex-grow space-y-6">
            {generatedMessages.length === 0 && !isGenerating && (
              <div className="text-center">
                <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Crie textos prontos de vendas para WhatsApp personalizados para seu negócio.
                </h2>
              </div>
            )}

            {isGenerating && generatedMessages.length === 0 && (
              <Card className="text-left max-w-2xl mx-auto bg-card shadow-lg">
                <CardHeader>
                  <CardTitle className="font-bold text-lg">
                    Gerando sua mensagem...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 pt-2">
                    <div className="bg-muted animate-pulse h-4 w-full rounded-md" />
                    <div className="bg-muted animate-pulse h-4 w-5/6 rounded-md" />
                    <div className="bg-muted animate-pulse h-4 w-full rounded-md" />
                    <div className="bg-muted animate-pulse h-4 w-3/4 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            )}

            {generatedMessages.length > 0 &&
              generatedMessages.map((msg, i) => (
                <GeneratedMessageCard
                  key={i}
                  message={msg.message}
                  salesTag={msg.salesTag}
                  index={generatedMessages.length - i}
                />
              ))}
          </div>

          <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm py-8 mt-12">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="relative w-full max-w-xl mx-auto rounded-full bg-white p-3 shadow-[0_4px_16px_rgba(0,0,0,0.05)] border"
              >
                <div className="flex items-center">
                  <FormField
                    control={form.control}
                    name="salesTag"
                    render={({ field }) => (
                      <FormItem className="flex-shrink-0">
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-neutral-100 rounded-full border-none shadow-sm pr-8 text-neutral-600">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salesTags.map(tag => (
                              <SelectItem key={tag.value} value={tag.value}>
                                {tag.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nicheDetails"
                    render={({ field }) => (
                      <FormItem className="flex-grow ml-2">
                        <FormControl>
                          <TextareaAutosize
                            placeholder="Escreva sobre seu negócio aqui"
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-base placeholder:text-neutral-400 leading-tight py-2"
                            minRows={1}
                            maxRows={5}
                            {...field}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(onSubmit)();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="ml-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0"
                    disabled={isGenerating || isUserLoading}
                  >
                    {isGenerating || isUserLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ArrowUp className="h-5 w-5" />
                    )}
                    <span className="sr-only">Gerar</span>
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
      <footer className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-neutral-500">
          <p>Produto do Revizap</p>
        </div>
      </footer>
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro Grátis</DialogTitle>
            <DialogDescription>
              Entre com sua conta do Google para começar a usar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <Button onClick={handleGoogleSignIn} className="w-full" disabled={isAuthLoading}>
                {isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Entrar com Google
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
