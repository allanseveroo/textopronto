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

const salesTags = [
  { value: "Saudação" },
  { value: "Prospecção em Grupos" },
  { value: "Contorno de Objeções" },
  { value: "Follow-up" },
  { value: "Promoção" },
];

export default function Home() {
  const [isGenerating, startTransition] = useTransition();
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesTag: "Saudação",
      nicheDetails: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setGeneratedMessage("");
    startTransition(async () => {
      try {
        const result = await generateWhatsAppMessage({
          salesTag: values.salesTag,
          nicheDetails: values.nicheDetails,
        });
        setGeneratedMessage(result.message);
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

  const copyToClipboard = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setIsCopied(true);
    toast({
      description: "A mensagem foi copiada para a área de transferência.",
    });
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start h-20">
          <h1 className="text-2xl font-bold text-foreground">TextoPronto</h1>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="w-full max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
            Crie textos prontos de vendas para{" "}
            <span className="text-green-500">WhatsApp</span> personalizados para
            seu negócio.
          </h2>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="relative w-full max-w-xl mx-auto rounded-full bg-secondary/50 p-2 shadow-inner"
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
                          <SelectTrigger className="bg-background rounded-full border-none shadow-sm pr-8">
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
                          className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="ml-2 rounded-full bg-green-500 hover:bg-green-600 text-white flex-shrink-0"
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

          {(isGenerating || generatedMessage) && (
            <Card className="mt-12 text-left max-w-xl mx-auto transition-all duration-500 animate-in fade-in-0 zoom-in-95">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="font-bold text-lg">Sua Mensagem</CardTitle>
                {!isGenerating && generatedMessage && (
                   <Button variant="ghost" size="sm" onClick={copyToClipboard} className="shrink-0 bg-secondary hover:bg-secondary/80">
                    {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {isCopied ? 'Copiado!' : 'Copiar'}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="space-y-3 pt-2">
                    <div className="bg-muted animate-pulse h-4 w-full rounded-md" />
                    <div className="bg-muted animate-pulse h-4 w-5/6 rounded-md" />
                    <div className="bg-muted animate-pulse h-4 w-full rounded-md" />
                    <div className="bg-muted animate-pulse h-4 w-3/4 rounded-md" />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed pt-2">
                    {generatedMessage}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </main>
      <footer className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>Produto do Revizap</p>
        </div>
      </footer>
    </div>
  );
}
