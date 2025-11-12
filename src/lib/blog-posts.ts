export type BlogPost = {
  title: string;
  description: string;
  slug: string;
};

export const blogPosts: BlogPost[] = [
  {
    title: '5 Dicas Infalíveis para Vender Mais no WhatsApp',
    description: 'Aprenda 5 dicas práticas e essenciais para alavancar suas vendas usando o WhatsApp de forma estratégica.',
    slug: 'sample-post',
  },
  // Adicione novas postagens aqui
  // {
  //   title: 'Como Criar um Funil de Vendas no WhatsApp',
  //   description: 'Descubra o passo a passo para construir um funil de vendas eficiente e automatizado no WhatsApp.',
  //   slug: 'funil-de-vendas-whatsapp',
  // },
];
