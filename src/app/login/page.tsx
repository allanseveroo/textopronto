'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useUser } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const phoneSchema = z.object({
  phoneNumber: z.string().min(10, 'Número de telefone inválido.'),
});

const codeSchema = z.object({
  code: z.string().length(6, 'O código deve ter 6 dígitos.'),
});

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
  });

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!auth) return;
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      },
    });
    return () => {
      window.recaptchaVerifier.clear();
    }
  }, [auth]);

  const onSendCode = async (values: z.infer<typeof phoneSchema>) => {
    setIsSendingCode(true);
    try {
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
      await confirmationResult.confirm(values.code);
      toast({
        title: 'Login realizado com sucesso!',
      });
      router.push('/');
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
  
  if (isUserLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            {confirmationResult
              ? 'Digite o código que enviamos para o seu celular.'
              : 'Insira seu número de celular para continuar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmationResult ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onSendCode)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Celular</FormLabel>
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
                 <Button variant="link" size="sm" onClick={() => setConfirmationResult(null)}>
                    Usar outro número
                  </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      <div id="recaptcha-container"></div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}
