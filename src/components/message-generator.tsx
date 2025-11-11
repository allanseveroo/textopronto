"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateWhatsAppMessage } from "@/ai/flows/generate-whatsapp-message";
import { suggestNicheDetails } from "@/ai/flows/suggest-niche-details";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Check, Wand2, Handshake, Users, ShieldOff, PhoneForwarded, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  salesTag: z.string({
    required_error: "Por favor, selecione uma tag de vendas.",
  }),
  nicheDetails: z
    .string()
    .min(10, "Por favor, forneça detalhes sobre seu nicho (mínimo 10 caracteres)."),
});

const salesTags = [
  { value: "greeting", label: "Saudação", icon: Handshake },
  { value: "groups", label: "Prospecção em Grupos", icon: Users },
  { value: "objections", label: "Contorno de Objeções", icon: ShieldOff },
  { value: "follow-up", label: "Follow-up", icon: PhoneForwarded },
  { value: "promotion", label: "Promoção", icon: Megaphone },
];

export function MessageGenerator() {
  const [isGenerating, startTransition] = useTransition();
  const [suggestionIsLoading, setSuggestionIsLoading] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [nicheSuggestion, setNicheSuggestion] = useState("Ex: Venda de cursos de marketing digital para afiliados iniciantes.");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salesTag: "",
      nicheDetails: "",
    },
  });

  const salesTagValue = form.watch("salesTag");

  useEffect(() => {
    if (salesTagValue) {
      setSuggestionIsLoading(true);
      suggestNicheDetails({ salesTag: salesTagValue })
        .then(result => setNicheSuggestion(result.suggestedDetails))
        .catch(error => {
          console.error("Failed to suggest niche details:", error);
          setNicheSuggestion("Ex: Venda de cursos de marketing digital para afiliados iniciantes.");
        })
        .finally(() => setSuggestionIsLoading(false));
    }
  }, [salesTagValue]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setGeneratedMessage("");
    startTransition(async () => {
      try {
        const result = await generateWhatsAppMessage(values);
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-3xl mx-auto grid gap-8">
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl font-headline tracking-tight">Gerador de Mensagens IA</CardTitle>
              <CardDescription>
                Selecione uma tag, descreva seu nicho e deixe nossa IA criar a mensagem de vendas perfeita para seu WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="salesTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tag de Vendas</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um objetivo de mensagem..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salesTags.map((tag) => (
                              <SelectItem key={tag.value} value={tag.value}>
                                <div className="flex items-center gap-2">
                                  <tag.icon className="h-4 w-4 text-muted-foreground" />
                                  <span>{tag.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nicheDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seu Nicho e Detalhes da Oferta</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={suggestionIsLoading ? "Buscando sugestões..." : nicheSuggestion}
                            className="resize-y"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Seja o mais específico possível para um melhor resultado.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isGenerating} className="w-full text-lg py-6 font-bold">
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-5 w-5" />
                    )}
                    Gerar Mensagem
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {(isGenerating || generatedMessage) && (
            <Card className="shadow-lg border-primary/20 transition-all duration-500 animate-in fade-in-0 zoom-in-95">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="font-headline text-xl">Sua Mensagem</CardTitle>
                {!isGenerating && generatedMessage && (
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="shrink-0 bg-accent text-accent-foreground hover:bg-green-400/80">
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
      </div>
  );
}
