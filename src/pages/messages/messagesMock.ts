export type ChatMessage = {
  id: string;
  from: "store" | "customer";
  text: string;
  time: string;
};

export type ChatThread = {
  id: string;
  name: string;
  status: string;
  preview: string;
  time: string;
  unread?: number;
  messages: ChatMessage[];
};

export const mockThreads: ChatThread[] = [
  {
    id: "support",
    name: "Atendimento Mais Burguer",
    status: "Online agora",
    preview: "Seu pedido já está em preparo.",
    time: "18:42",
    unread: 2,
    messages: [
      {
        id: "support-1",
        from: "store",
        text: "Olá! Recebemos seu pedido e a cozinha já foi avisada.",
        time: "18:31",
      },
      {
        id: "support-2",
        from: "customer",
        text: "Perfeito, obrigado. Dá para mandar sem cebola?",
        time: "18:33",
      },
      {
        id: "support-3",
        from: "store",
        text: "Dá sim. Anotamos aqui: sem cebola no lanche principal.",
        time: "18:35",
      },
      {
        id: "support-4",
        from: "store",
        text: "Seu pedido já está em preparo.",
        time: "18:42",
      },
    ],
  },
  {
    id: "delivery",
    name: "Entrega",
    status: "Previsão: 25 min",
    preview: "O motoboy sai assim que o pedido ficar pronto.",
    time: "18:18",
    messages: [
      {
        id: "delivery-1",
        from: "customer",
        text: "Boa noite, qual a previsão de entrega?",
        time: "18:10",
      },
      {
        id: "delivery-2",
        from: "store",
        text: "Boa noite! A previsão atual é de 25 minutos.",
        time: "18:12",
      },
      {
        id: "delivery-3",
        from: "store",
        text: "O motoboy sai assim que o pedido ficar pronto.",
        time: "18:18",
      },
    ],
  },
  {
    id: "coupons",
    name: "Cupons e promoções",
    status: "Resposta automática",
    preview: "Use BURGUER10 na próxima compra.",
    time: "Ontem",
    messages: [
      {
        id: "coupons-1",
        from: "store",
        text: "Você ganhou um cupom de 10% para usar na próxima compra.",
        time: "Ontem",
      },
      {
        id: "coupons-2",
        from: "store",
        text: "Use BURGUER10 no checkout antes de finalizar o pedido.",
        time: "Ontem",
      },
    ],
  },
];

export function getThreadById(threadId?: string) {
  return mockThreads.find((thread) => thread.id === threadId);
}
