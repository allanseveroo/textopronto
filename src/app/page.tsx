
'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateWhatsAppMessage,
} from '@/ai/flows/generate-whatsapp-message';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowUp, Check, Copy, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signOut, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';


const formSchema = z.object({
  salesTag: z.string().default('Saudação'),
  nicheDetails: z.string().min(1, 'Escreva sobre seu negócio.'),
});

const phoneSchema = z.object({
  phoneNumber: z.string().min(10, 'Número de telefone inválido.'),
});

const codeSchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos.'),
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
    <Card className="text-left max-w-xl w-full mx-auto transition-all duration-500 animate-in fade-in-0 zoom-in-95 bg-card shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="font-bold text-lg">Sua Mensagem #{index} - ({tagLabel})</CardTitle>
        <Button variant="ghost" size="sm" onClick={copyToClipboard} className="shrink-0 bg-secondary hover:bg-secondary/80">
          {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {isCopied ? 'Copiado!' : 'Copiar'}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed pt-2">
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
  const [messageCount, setMessageCount] = useState(0);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: ''
    }
  });

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
  });

  const fetchMessageCount = useCallback(async (uid: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setMessageCount(userDoc.data().messageCount || 0);
    }
  }, [firestore]);


  useEffect(() => {
    if (user) {
      fetchMessageCount(user.uid);
    }
  }, [user, fetchMessageCount]);


  useEffect(() => {
    if (!auth || !showLoginModal) return;
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    }
  }, [auth, showLoginModal]);

  const onSendCode = async (values: z.infer<typeof phoneSchema>) => {
    setIsSendingCode(true);
    try {
      if (!auth) {
        throw new Error('Serviço de autenticação não está pronto');
      }
      const verifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, values.phoneNumber, verifier);
      setConfirmationResult(result);
      toast({
        title: 'Código enviado!',
        description: 'Enviamos um código de verificação para o seu celular.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar código',
        description: error.message || 'Não foi possível enviar o código. Tente novamente.',
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const onVerifyCode = async (values: z.infer<typeof codeSchema>) => {
    if (!confirmationResult) return;
    setIsVerifyingCode(true);
    try {
      const credential = await confirmationResult.confirm(values.code);
      const newUser = credential.user;

      if (firestore && newUser) {
        const userDocRef = doc(firestore, 'users', newUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            id: newUser.uid,
            email: newUser.email,
            name: newUser.displayName,
            createdAt: serverTimestamp(),
            messageCount: 0,
          });
          setMessageCount(0);
        } else {
           setMessageCount(userDoc.data().messageCount || 0);
        }
      }

      toast({
        title: 'Login realizado com sucesso!',
      });
      setShowLoginModal(false);
      setConfirmationResult(null);
      phoneForm.reset();
      codeForm.reset();

    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro na verificação',
        description: 'O código inserido é inválido. Tente novamente.',
      });
    } finally {
      setIsVerifyingCode(false);
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
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if(messageCount >= 5) {
      toast({
        variant: "destructive",
        title: "Limite de mensagens atingido",
        description: "Você já gerou 5 mensagens gratuitas. Faça upgrade para continuar.",
      });
      return;
    }


    startTransition(async () => {
      try {
        const result = await generateWhatsAppMessage({
          salesTag: values.salesTag,
          nicheDetails: values.nicheDetails,
        });
        setGeneratedMessages(prev => [{ message: result.message, salesTag: values.salesTag }, ...prev]);
        
        if (firestore && user) {
          const newCount = messageCount + 1;
          const userDocRef = doc(firestore, 'users', user.uid);
          await setDoc(userDocRef, { messageCount: newCount }, { merge: true });
          setMessageCount(newCount);
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
    if (!auth) return;
    await signOut(auth);
    setGeneratedMessages([]);
    setMessageCount(0);
    setConfirmationResult(null);
    phoneForm.reset();
    codeForm.reset();
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
       <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <h1 className="text-2xl font-bold text-foreground">TextoPronto</h1>
          {user && (
            <Button variant="ghost" onClick={handleLogout}>
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
              <Card className="text-left max-w-xl mx-auto bg-card shadow-lg">
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
                className="relative w-full max-w-xl mx-auto rounded-full bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.05)] border"
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
                          <Input
                            placeholder="Escreva sobre seu negócio aqui"
                            className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-neutral-400"
                            {...field}
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
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Cadastre-se Grátis</DialogTitle>
            <DialogDescription>
              {confirmationResult
                ? 'Digite o código que enviamos para o seu WhatsApp.'
                : 'Insira seu número de WhatsApp para gerar até 5 mensagens grátis.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
          {!confirmationResult ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onSendCode)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="+55 (XX) XXXXX-XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSendingCode}>
                  {isSendingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Código
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...codeForm}>
              <form onSubmit={codeForm.handleSubmit(onVerifyCode)} className="space-y-4">
                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Verificação</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isVerifyingCode}>
                  {isVerifyingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verificar e Entrar
                </Button>
                 <Button variant="link" size="sm" onClick={() => {
                   setConfirmationResult(null);
                   phoneForm.reset();
                   codeForm.reset();
                  }}>
                    Usar outro número
                  </Button>
              </form>
            </Form>
          )}
          </div>
          <div id="recaptcha-container" className="flex justify-center"></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

    