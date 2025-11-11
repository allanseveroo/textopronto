'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
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
import { Loader2, ArrowUp, Check, Copy, LogIn, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  salesTag: z.string().default('Saudação'),
  nicheDetails: z.string().min(1, 'Escreva sobre seu negócio.'),
});

type GeneratedMessage = {
  id: number;
  message: string;
  salesTag: string;
};

type Profile = {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  message_count: number;
} | null;

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
  const [profile, setProfile] = useState<Profile>(null);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !isUserLoading) {
      const manageUserProfile = async () => {
        // 1. Check if user profile exists in Supabase
        let { data: userProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.uid)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
          console.error("Error fetching profile:", fetchError);
          toast({ variant: 'destructive', title: 'Erro ao buscar perfil', description: fetchError.message });
          return;
        }

        // 2. If profile doesn't exist, create it
        if (!userProfile) {
          const { data: newUserProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              { id: user.uid, email: user.email, plan: 'free', message_count: 0 },
            ])
            .select()
            .single();

          if (insertError) {
            console.error("Error creating profile:", insertError);
            toast({ variant: 'destructive', title: 'Erro ao criar perfil', description: insertError.message });
            return;
          }
          userProfile = newUserProfile;
        }

        setProfile(userProfile);
      };

      manageUserProfile();
    } else if (!user && !isUserLoading) {
        setProfile(null);
    }
  }, [user, isUserLoading, toast]);


  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      toast({
        variant: 'destructive',
        title: 'Erro de Login',
        description: 'Não foi possível entrar com o Google. Tente novamente.',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao Sair',
        description: 'Ocorreu um problema ao tentar sair. Tente novamente.',
      });
    }
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesTag: 'Saudação',
      nicheDetails: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !profile) {
      toast({
        variant: 'destructive',
        title: 'Acesso Negado',
        description: 'Você precisa estar logado para gerar mensagens.',
      });
      return;
    }

    if (profile.plan === 'free' && profile.message_count >= 5) {
      toast({
        title: 'Limite Atingido',
        description: 'Você atingiu o limite de 5 mensagens do plano gratuito. Faça upgrade para continuar!',
      });
      // Here you would trigger an upgrade modal
      return;
    }

    startTransition(async () => {
      try {
        const result = await generateWhatsAppMessage({
          salesTag: values.salesTag,
          nicheDetails: values.nicheDetails,
        });

        // Increment message count in Supabase
        const newCount = profile.message_count + 1;
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ message_count: newCount })
          .eq('id', user.uid)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        setProfile(updatedProfile);

        const newMessage: GeneratedMessage = {
          id: Date.now(),
          message: result.message,
          salesTag: values.salesTag,
        };

        setGeneratedMessages(prev => [newMessage, ...prev]);

        form.reset({
          salesTag: values.salesTag,
          nicheDetails: '',
        });

      } catch (error: any)
      {
        console.error('Failed to generate message:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description:
            error.message || 'Ocorreu um problema com a IA. Por favor, tente novamente.',
        });
      }
    });
  }

  const renderAuthSection = () => {
    if (isUserLoading) {
      return <Loader2 className="h-6 w-6 animate-spin" />;
    }

    if (user) {
      return (
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground/80 hidden sm:inline">Olá, {user.displayName || user.email}</span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      );
    }

    return (
      <Button onClick={handleSignIn} disabled={isUserLoading}>
        <LogIn className="mr-2 h-4 w-4" />
        Entrar com Google
      </Button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
       <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <h1 className="text-2xl font-bold text-foreground">TextoPronto</h1>
          {renderAuthSection()}
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
            
            {isGenerating && (
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
                  key={msg.id}
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
                className="relative w-full max-w-2xl mx-auto bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.05)] border rounded-xl overflow-hidden"
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
                            <SelectTrigger className="bg-neutral-100 border-none shadow-sm pr-8 text-neutral-600">
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
                    className="ml-2 bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0 rounded-lg"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
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
    </div>
  );
}
