"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateWhatsAppMessage } from "@/ai/flows/generate-whatsapp-message";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowUp, Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  salesTag: z.string().default("Saudação"),
  nicheDetails: z.string().min(1, "Escreva sobre seu negócio."),
});

type GeneratedMessage = {
  message: string;
  salesTag: string;
};

const salesTags = [
  { value: "Saudação" },
  { value: "Prospecção em Grupos" },
  { value: "Contorno de Objeções" },
  { value: "Follow-up" },
  { value: "Promoção" },
  { value: "Recuperação de Vendas" },
  { value: "Cobrança" },
  { value: "Agendamento" },
  { value: "Pós-venda" },
  { value: "Pesquisa de Satisfação" },
  { value: "Outros" },
];

const GeneratedMessageCard = ({ message, salesTag, index }: { message: string; salesTag: string; index: number }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    toast({
      description: "A mensagem foi copiada para a área de transferência.",
    });
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <Card className="text-left max-w-xl w-full mx-auto transition-all duration-500 animate-in fade-in-0 zoom-in-95 bg-card shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="font-bold text-lg">Sua Mensagem #{index} - ({salesTag})</CardTitle>
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
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesTag: "Saudação",
      nicheDetails: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const result = await generateWhatsAppMessage({
          salesTag: values.salesTag,
          nicheDetails: values.nicheDetails,
        });
        setGeneratedMessages(prev => [{ message: result.message, salesTag: values.salesTag }, ...prev]);
        form.reset({
          salesTag: values.salesTag,
          nicheDetails: "",
        });
      } catch (error) {
        console.error("Failed to generate message:", error);
        toast({
          variant: "destructive",
          title: "Erro ao gerar mensagem",
          description: "Ocorreu um problema com a IA. Por favor, tente novamente.",
        });
      }
    });
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start h-20">
          <h1 className="text-2xl font-bold text-foreground">TextoPronto</h1>
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

            {generatedMessages.length > 0 &&
              generatedMessages.map((msg, i) => (
                <GeneratedMessageCard key={i} message={msg.message} salesTag={msg.salesTag} index={generatedMessages.length - i} />
              ))}
          </div>

          <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm py-8 mt-12">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="relative w-full max-w-xl mx-auto rounded-full bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
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
                            {salesTags.map((tag) => (
                              <SelectItem key={tag.value} value={tag.value}>
                                {tag.value}
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
