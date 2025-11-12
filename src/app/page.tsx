'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  generateWhatsAppMessage,
} from '@/ai/flows/generate-whatsapp-message';
import TextareaAutosize from 'react-textarea-autosize';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
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
import { useAuth, useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase'; 
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, query, orderBy, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';

const formSchema = z.object({
  salesTag: z.string().default('Saudação'),
  nicheDetails: z.string().min(1, 'Escreva sobre seu negócio.'),
});

type GeneratedMessage = {
  id: string;
  message: string;
  salesTag: string;
  createdAt: Timestamp;
};

type UserProfile = {
    userId: string;
    email: string;
    plan: 'free' | 'pro';
    messageCount: number;
}

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

const FREE_PLAN_LIMIT = 5;

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
        <p className="whitespace-pre-wrap break-words text-foreground/90 leading-relaxed pt-2">
          {message}
        </p>
      </CardContent>
    </Card>
  );
};


export default function Home() {
  const [isGenerating, startTransition] = useTransition();
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  const formValuesRef = useRef<z.infer<typeof formSchema> | null>(null);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (uid: string) => {
    if (!firestore) return;
    setIsProfileLoading(true);
    const docRef = doc(firestore, 'users', uid);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUserProfile(profile);
        return profile;
      } else {
        setUserProfile(null);
        return null;
      }
    } catch (error) {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'get'
      }));
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  }, [firestore]);

  const fetchMessages = useCallback(async (uid: string) => {
      if (!firestore) return;
      const messagesRef = collection(firestore, 'users', uid, 'messages');
      try {
          const q = query(messagesRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedMessage));
          setGeneratedMessages(messages);
      } catch (error) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: messagesRef.path,
            operation: 'list'
          }));
      }
  }, [firestore]);


  useEffect(() => {
    if (user) {
      fetchUserProfile(user.uid);
      fetchMessages(user.uid);
    } else if (!isAuthLoading) {
      // Reset states only when auth has loaded and there's no user
      setUserProfile(null);
      setGeneratedMessages([]);
      setIsProfileLoading(false);
    }
  }, [user, isAuthLoading, fetchUserProfile, fetchMessages]);

  const manageUserProfile = async (currentUser: import('firebase/auth').User): Promise<UserProfile | null> => {
    if (!firestore || !currentUser.email) return null;
  
    const docRef = doc(firestore, 'users', currentUser.uid);
    
    try {
      const docSnap = await getDoc(docRef);
    
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      } else {
        const newProfile: UserProfile = {
          userId: currentUser.uid,
          email: currentUser.email,
          plan: 'free',
          messageCount: 0,
        };
        // Use a .catch block for permission errors during creation
        await setDoc(docRef, newProfile).catch(() => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'create',
            requestResourceData: newProfile
          }));
        });
        return newProfile;
      }
    } catch (error) {
      // This will catch read errors (getDoc)
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'get'
      }));
      return null;
    }
  };
  
  const runGeneration = async (values: z.infer<typeof formSchema>) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado. Por favor, faça login novamente.' });
      return;
    }

    const userProfileRef = doc(firestore, 'users', user.uid);
    
    startTransition(async () => {
      let latestProfile: UserProfile | null = null;
      try {
        const latestProfileSnap = await getDoc(userProfileRef);
        if (latestProfileSnap.exists()) {
          latestProfile = latestProfileSnap.data() as UserProfile;
        }
      } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'get'
        }));
        return; // Stop execution if profile can't be read
      }

      if (!latestProfile) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Perfil de usuário não encontrado. Tente novamente.' });
          return;
      }

      if (latestProfile.plan === 'free' && latestProfile.messageCount >= FREE_PLAN_LIMIT) {
        toast({
          variant: 'destructive',
          title: 'Limite Atingido',
          description: 'Você atingiu o limite de mensagens do plano gratuito.',
        });
        return;
      }

      try {
        const result = await generateWhatsAppMessage({
          salesTag: values.salesTag,
          nicheDetails: values.nicheDetails,
        });

        const messagesRef = collection(firestore, 'users', user.uid, 'messages');
        const newMessageDoc = doc(messagesRef);

        const newMessageData = {
          message: result.message,
          salesTag: values.salesTag,
          createdAt: serverTimestamp(),
        };

        const batch = writeBatch(firestore);

        batch.set(newMessageDoc, newMessageData);
        batch.update(userProfileRef, { messageCount: increment(1) });
        
        await batch.commit().catch(error => {
            // Emitting a contextual error for the batch write
            errorEmitter.emit(
              'permission-error',
              new FirestorePermissionError({
                path: `batch write to /users/${user.uid} and /users/${user.uid}/messages`,
                operation: 'write', 
                requestResourceData: {
                  newMessage: newMessageData,
                  profileUpdate: { messageCount: 'increment(1)'}
                },
              })
            );
        });

        const finalMessage: GeneratedMessage = {
          ...newMessageData,
          id: newMessageDoc.id,
          createdAt: new Timestamp(Date.now() / 1000, 0),
        };
        
        setGeneratedMessages(prev => [finalMessage, ...prev]);

        // Optimistically update local profile state
        setUserProfile(prev => prev ? { ...prev, messageCount: prev.messageCount + 1 } : null);

        form.reset({ salesTag: values.salesTag, nicheDetails: '' });

      } catch (error: any) {
        // This will catch errors from generateWhatsAppMessage or other unexpected issues.
        // Permission errors from Firestore are handled by the .catch() on the commit.
        if (!error.name.includes('FirebaseError')) {
          console.error('Failed to generate message:', error);
          toast({ variant: 'destructive', title: 'Erro', description: error.message || 'Ocorreu um problema com a IA.' });
        }
      }
    });
  };

  const handleSignIn = async () => {
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;
      
      setIsProfileLoading(true);
      const profile = await manageUserProfile(currentUser);
      
      if (profile) {
        setUserProfile(profile);
        await fetchMessages(currentUser.uid); // Fetch messages after successful profile management
      }
      
      setIsProfileLoading(false);
      setIsLoginModalOpen(false);

      // If there was a pending generation, run it now
      if (formValuesRef.current) {
        runGeneration(formValuesRef.current);
        formValuesRef.current = null; // Clear the ref
      }

    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error('Error signing in with Google', error);
        toast({ variant: 'destructive', title: 'Erro de Login', description: 'Não foi possível entrar com o Google. Tente novamente.' });
      }
      setIsProfileLoading(false);
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { salesTag: 'Saudação', nicheDetails: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      formValuesRef.current = values;
      setIsLoginModalOpen(true);
      return;
    }
    runGeneration(values);
  }

  const isLoading = isAuthLoading || isProfileLoading;
  
  const siteUrl = "https://textopronto.com";
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
    <div className="flex flex-col min-h-screen font-sans bg-white">
       <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
       <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <h1 className="text-2xl font-bold text-foreground">TextoPronto</h1>
           {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground/80 hidden sm:inline">Olá, {user.displayName || user.email}</span>
              <Button variant="outline" size="sm" onClick={() => auth && signOut(auth)}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
           )}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center px-4 pt-4 md:pt-8">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col">
          <Form {...form}>
            <div className="flex-grow space-y-4 md:space-y-6 pb-4">
              
              {(generatedMessages.length === 0 && !isGenerating) && (
                <div className="text-center pt-8 md:pt-0">
                  {isLoading ? (
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                  ) : (
                    <>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Crie textos de vendas para WhatsApp para o seu negócio.
                      </h2>
                      {user && userProfile && userProfile.plan === 'free' && (
                        <p className="mt-4 text-muted-foreground">
                          Você usou {userProfile.messageCount} de {FREE_PLAN_LIMIT} mensagens do seu plano gratuito.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {isGenerating && (
                <Card className="text-left max-w-2xl mx-auto bg-card shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-bold text-lg">Gerando sua mensagem...</CardTitle>
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

              {generatedMessages.map((msg, i) => (
                <GeneratedMessageCard
                  key={msg.id}
                  message={msg.message}
                  salesTag={msg.salesTag}
                  index={generatedMessages.length - i}
                />
              ))}
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm pt-2 pb-4 md:pt-4 md:pb-6 mt-auto">
                <div className="pb-3 px-1">
                  <FormField
                    control={form.control}
                    name="salesTag"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-auto h-auto px-3 py-1 text-xs rounded-full border-zinc-200 bg-zinc-100/80">
                              <SelectValue placeholder="Selecione..." />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                      control={form.control}
                      name="nicheDetails"
                      render={({ field }) => (
                          <FormItem>
                              <FormControl>
                                  <div className="relative w-full">
                                      <TextareaAutosize
                                          placeholder="Ex: Vendo um curso de inglês online para iniciantes por R$997"
                                          className="w-full bg-zinc-100 border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm sm:text-base placeholder:text-neutral-400 leading-tight p-4 pr-14"
                                          minRows={2}
                                          maxRows={5}
                                          {...field}
                                          onKeyDown={e => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                  e.preventDefault();
                                                  form.handleSubmit(onSubmit)();
                                              }
                                          }}
                                      />
                                      <Button
                                          type="submit"
                                          size="icon"
                                          className="absolute right-3 bottom-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg w-9 h-9"
                                          disabled={isGenerating || isLoading}
                                      >
                                          {isGenerating ? (
                                              <Loader2 className="h-5 w-5 animate-spin" />
                                          ) : (
                                              <ArrowUp className="h-5 w-5" />
                                          )}
                                          <span className="sr-only">Gerar</span>
                                      </Button>
                                  </div>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                </form>
            </div>
          </Form>
        </div>
      </main>

       <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Faça login para continuar</DialogTitle>
            <DialogDescription>Para gerar sua mensagem personalizada, você precisa entrar com sua conta Google.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center pt-4">
            <Button onClick={handleSignIn} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar com Google
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <footer className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-neutral-500">
          <p>Produto do Revizap</p>
        </div>
      </footer>
    </div>
  );
}
