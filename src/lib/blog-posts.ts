export type BlogPost = {
  title: string;
  description: string;
  slug: string;
};

export const blogPosts: BlogPost[] = [
  {
    title: 'O que é o TextoPronto? A Ferramenta de IA para Vendas no WhatsApp',
    description: 'Descubra como a IA do TextoPronto gera textos de vendas humanizados e pare de perder tempo e clientes.',
    slug: 'sample-post',
  },
  // Adicione novas postagens aqui
  // {
  //   title: 'Como Criar um Funil de Vendas no WhatsApp',
  //   description: 'Descubra o passo a passo para construir um funil de vendas eficiente e automatizado no WhatsApp.',
  //   slug: 'funil-de-vendas-whatsapp',
  // },
];
