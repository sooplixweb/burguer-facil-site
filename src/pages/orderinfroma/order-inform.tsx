import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Bike,
  Check,
  ChevronRight,
  Clock,
  CookingPot,
  Copy,
  CreditCard,
  Hash,
  Home,
  Map,
  MapPin,
  MessageCircle,
  QrCode,
  ReceiptText,
  Send,
  XCircle,
} from "lucide-react";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { OrderController } from "../../controllers/order.controller";
import { ChatMessageSenderType } from "../../dtos/enums/chat-message-sender-type.enum";
import type { PaymentMethodEnum } from "../../dtos/enums/payment-method.enum";
import type { OrderResponseDto } from "../../dtos/response/order-response.dto";
import { ChatService } from "../../service/chat.service";
import { formatOrderCode } from "../../utils/formatOrderCode";
import { playNotificationSound } from "../../utils/notificationSound";
import styles from "./order-inform.module.css";
import type { ChatMessageResponseDto } from "../../dtos/response/chat-message-response.dto";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  subtitle?: string;
  image?: string;
};

type OrderState = {
  orderId?: string;
  items?: CartItem[];
  deliveryFee?: number;
  subtotal?: number;
  total?: number;
  payment?: PaymentMethodEnum;
  orderNumber?: string;
  address?: {
    street?: string;
    number?: string;
    district?: string;
    cep?: string;
    city?: string;
    state?: string;
  };
};

type StoredCartItem = Partial<CartItem> & {
  desc?: string;
  img?: string;
};

type DetailRow = {
  icon: LucideIcon;
  label: string;
  value: string;
  action?: string;
  actionIcon?: LucideIcon;
  desktopOnlyAction?: boolean;
  payment?: boolean;
  yellow?: boolean;
};

const statuses: Array<{ status: string; label: string; icon: LucideIcon }> = [
  { status: "RECEIVED", label: "Pedido enviado", icon: Check },
  { status: "PREPARING", label: "Em preparacao", icon: CookingPot },
  { status: "ON_ROUTE", label: "Saiu para entrega", icon: Bike },
  { status: "DELIVERED", label: "Entregue", icon: Home },
];

const progressClasses = [
  styles.progress0,
  styles.progress25,
  styles.progress50,
  styles.progress75,
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseMoney(value: number | string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentLabel(method?: PaymentMethodEnum) {
  if (method === "CREDIT_CARD") return "Cartao de credito";
  if (method === "DEBIT_CARD") return "Cartao de debito";
  if (method === "CASH") return "Dinheiro";
  if (method === "PIX") return "Pix";
  return "Nao informado";
}

function paymentIcon(method?: PaymentMethodEnum) {
  if (method === "PIX") return QrCode;
  if (method === "CREDIT_CARD" || method === "DEBIT_CARD") return CreditCard;
  if (method === "CASH") return Banknote;
  return ReceiptText;
}

function statusIndex(status?: string) {
  if (status === "PREPARING") return 1;
  if (status === "ON_ROUTE") return 2;
  if (status === "DELIVERED") return 3;
  return 0;
}

function formatTime(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readCartFallback() {
  try {
    const raw = localStorage.getItem("food");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function sortChatMessages(messages: ChatMessageResponseDto[]) {
  return [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export default function OrderInform() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as OrderState;
  const [order, setOrder] = useState<OrderResponseDto | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [miniChatDraft, setMiniChatDraft] = useState("");
  const [miniChatMessages, setMiniChatMessages] = useState<
    ChatMessageResponseDto[]
  >([]);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const previousStatusRef = useRef<string | null>(null);
  const miniChatRef = useRef<HTMLElement | null>(null);
  const miniChatMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!state.orderId && !state.orderNumber) return;

    let active = true;
    const lookup = state.orderId || state.orderNumber || "";
    previousStatusRef.current = null;

    const loadOrder = () => {
      OrderController.findById(lookup)
        .then((data) => {
          if (!active) return;

          if (!data) {
            setOrder(null);
            return;
          }

          const previousStatus = previousStatusRef.current;

          setOrder(data);
          previousStatusRef.current = data.status;

          if (previousStatus && previousStatus !== data.status) {
            void playNotificationSound();
          }
        })
        .catch(() => {
          if (active) setOrder(null);
        });
    };

    loadOrder();
    const intervalId = window.setInterval(loadOrder, 6000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [state.orderId, state.orderNumber]);

  useEffect(() => {
    setMiniChatMessages(sortChatMessages(order?.chat?.messages || []));
  }, [order?.chat?.messages]);

  useEffect(() => {
    miniChatMessagesRef.current?.scrollTo({
      top: miniChatMessagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [miniChatMessages]);

  const items = useMemo(() => {
    if (order?.items?.length) {
      return order.items.map((item, index) => ({
        id: String(item.id || index + 1),
        name: item.name || "Item",
        price: parseMoney(item.unitPrice),
        qty: Number(item.quantity || 1),
        subtitle: item.description || item.observations || "",
        image: item.imageUrl || undefined,
      }));
    }

    const incoming = Array.isArray(state.items) ? state.items : [];
    const saved = readCartFallback();
    const source = incoming.length ? incoming : saved;
    return source.map((item: StoredCartItem, index: number) => ({
      id: String(item?.id ?? index + 1),
      name: String(item?.name ?? "Item"),
      price: Number(item?.price ?? 0),
      qty: Number(item?.qty ?? 1),
      subtitle: item?.subtitle || item?.desc || item?.note || "",
      image: item?.image || item?.img,
    }));
  }, [order, state.items]);

  const subtotal = useMemo(
    () =>
      order
        ? parseMoney(order.subtotal)
        : typeof state.subtotal === "number"
          ? state.subtotal
          : items.reduce((acc, item) => acc + item.price * item.qty, 0),
    [items, order, state.subtotal],
  );
  const deliveryFee = order
    ? parseMoney(order.deliveryFee)
    : typeof state.deliveryFee === "number"
      ? state.deliveryFee
      : 0;
  const total = order
    ? parseMoney(order.total)
    : typeof state.total === "number"
      ? state.total
      : subtotal + deliveryFee;
  const orderNumber = order?.code
    ? formatOrderCode(order.code)
    : state.orderNumber || "Nao informado";
  const orderPaymentMethod = order?.paymentMethod || state.payment;
  const orderPaymentLabel = paymentLabel(orderPaymentMethod);
  const PaymentStatusIcon = paymentIcon(orderPaymentMethod);
  const stateAddressLine = state.address?.street
    ? `${state.address.street}${state.address.number ? `, ${state.address.number}` : ""}`
    : "";
  const stateAddressSub = state.address?.district
    ? `${state.address.district}${state.address.city ? ` - ${state.address.city}` : ""}${state.address.state ? `/${state.address.state}` : ""}${state.address.cep ? ` - ${state.address.cep}` : ""}`
    : "";
  const orderAddressLine = order?.address
    ? `${order.address.street}, ${order.address.number}`
    : "";
  const orderAddressSub = order?.address
    ? [
        order.address.neighborhood,
        `${order.address.city}/${order.address.state}`,
        `CEP ${order.address.zipCode}`,
        order.address.complement,
      ]
        .filter(Boolean)
        .join(" - ")
    : "";
  const addressLine = orderAddressLine || stateAddressLine || "Nao informado";
  const addressSub = orderAddressSub || stateAddressSub;

  const activeStatus = statusIndex(order?.status);
  const isCanceled = order?.status === "CANCELED";
  const canCancel = !!order && order.status !== "DELIVERED" && !isCanceled;
  const isMiniChatReadOnly = order?.status === "DELIVERED" || isCanceled;
  const pageTitle = isCanceled
    ? "Pedido cancelado"
    : order?.status === "DELIVERED"
      ? "Pedido entregue"
      : "Pedido enviado";
  const pageSubtitle = isCanceled
    ? "Este pedido foi cancelado."
    : "Acompanhe o status do seu pedido em tempo real.";
  const detailRows: DetailRow[] = [
    {
      icon: MapPin,
      label: "Endereco",
      value: `${addressLine}${addressSub ? `\n${addressSub}` : ""}`,
      action: addressLine !== "Nao informado" ? "Ver no mapa" : undefined,
      actionIcon: Map,
    },
    {
      icon: ReceiptText,
      label: "Pagamento",
      value: orderPaymentLabel,
      payment: true,
    },
    {
      icon: Clock,
      label: "Previsao de entrega",
      value: "35-45 min",
      yellow: true,
    },
    {
      icon: Hash,
      label: "Numero do pedido",
      value: orderNumber,
      yellow: true,
      action: orderNumber !== "Nao informado" ? "Copiar numero" : undefined,
      actionIcon: Copy,
      desktopOnlyAction: true,
    },
  ];

  useEffect(() => {
    if (!canCancel && showCancelModal) {
      setShowCancelModal(false);
    }
  }, [canCancel, showCancelModal]);

  async function handleCancelOrder() {
    if (!order || !canCancel || isCanceling) return;

    setIsCanceling(true);

    try {
      const updatedOrder = await OrderController.cancel(order.id);
      setOrder(updatedOrder);
      previousStatusRef.current = updatedOrder.status;
      setShowCancelModal(false);
    } catch {
      window.alert("Não foi possível cancelar o pedido.");
    } finally {
      setIsCanceling(false);
    }
  }

  async function handleMiniChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = miniChatDraft.trim();
    if (!text || !order || isMiniChatReadOnly || isSendingChatMessage) return;

    setIsSendingChatMessage(true);

    try {
      const chat = order.chat?.id
        ? order.chat
        : await ChatService.create({ orderId: order.id });
      const createdMessage = await ChatService.createMessage({
        chatId: chat.id,
        text,
      });
      const nextMessages = sortChatMessages([
        ...(chat.messages || []),
        createdMessage,
      ]);

      setOrder((current) =>
        current
          ? {
              ...current,
              chatId: chat.id,
              chat: {
                ...chat,
                messages: nextMessages,
              },
            }
          : current,
      );
      setMiniChatMessages(nextMessages);
      setMiniChatDraft("");
    } catch {
      window.alert("Não foi possível enviar a mensagem.");
    } finally {
      setIsSendingChatMessage(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <div
              className={cx(
                styles.headerIcon,
                isCanceled && styles.headerIconCanceled,
              )}
            >
              {isCanceled ? (
                <XCircle strokeWidth={2.2} />
              ) : (
                <Send strokeWidth={2.2} />
              )}
            </div>
            <div className={styles.headerCopy}>
              <h1 className={styles.title}>{pageTitle}</h1>
              <div className={styles.subtitle}>{pageSubtitle}</div>
            </div>
          </div>
          <div className={styles.headerActions}>
            {canCancel ? (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={isCanceling}
                className={styles.cancelButton}
              >
                <XCircle />
                {isCanceling ? "Cancelando..." : "Cancelar"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate("/")}
              className={styles.homeButton}
            >
              <Home />
              Inicio
            </button>
          </div>
        </header>

        <section className={cx(styles.panel, styles.statusPanel)}>
          <div className={styles.statusTrack}>
            <div className={styles.statusTrackBase} />
            <div
              className={cx(
                styles.statusTrackFill,
                progressClasses[activeStatus],
              )}
            />

            {statuses.map((step, index) => {
              const Icon = step.icon;
              const active = index === activeStatus;
              const completed = index < activeStatus;

              return (
                <div
                  key={step.label}
                  className={cx(
                    styles.statusStep,
                    completed && styles.statusStepCompleted,
                    active && styles.statusStepActive,
                  )}
                >
                  <div
                    className={cx(
                      styles.statusStepIcon,
                      completed && styles.statusStepIconCompleted,
                      active && styles.statusStepIconActive,
                    )}
                  >
                    <Icon strokeWidth={completed || active ? 3 : 2.2} />
                  </div>
                  <div className={styles.statusStepIndex}>{index + 1}</div>
                  <div className={styles.statusStepLabel}>{step.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div
              className={cx(styles.sectionTitle, styles.sectionTitleBetween)}
            >
              <span className={styles.sectionTitleLabel}>
                <ReceiptText />
                Resumo do pedido
              </span>
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className={styles.detailsButton}
              >
                Ver detalhes <ChevronRight />
              </button>
            </div>

            {items.length ? (
              items.map((item, index) => (
                <div key={`${item.id}-${index}`} className={styles.item}>
                  {item.image ? (
                    <img
                      className={styles.thumb}
                      src={item.image}
                      alt={item.name}
                    />
                  ) : (
                    <div className={styles.thumbPlaceholder}>
                      <ReceiptText />
                    </div>
                  )}
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>
                      {item.qty}x&nbsp; {item.name}
                    </div>
                    <div className={styles.itemDesc}>{item.subtitle}</div>
                  </div>
                  <div className={styles.itemPrice}>
                    {brl(item.price * item.qty)}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyText}>Nenhum item encontrado.</div>
            )}

            <div className={cx(styles.divider, styles.desktopOnly)} />
            <div className={cx(styles.totalLine, styles.desktopOnly)}>
              <span>Subtotal</span>
              <span>{brl(subtotal)}</span>
            </div>
            <div className={cx(styles.totalLine, styles.desktopOnly)}>
              <span>Taxa de entrega</span>
              <span>{brl(deliveryFee)}</span>
            </div>

            <div className={styles.totalStrong}>
              <span>Total do pedido</span>
              <span className={styles.totalValue}>{brl(total)}</span>
            </div>
          </section>

          <div className={styles.sideGrid}>
            <section className={styles.card}>
              <div className={styles.sectionTitle}>
                <MapPin />
                Entrega
              </div>

              {detailRows.map((row) => {
                const Icon = row.icon;
                const ActionIcon = row.actionIcon;

                return (
                  <div key={row.label} className={styles.detailRow}>
                    <Icon className={styles.detailIcon} />
                    <div className={styles.detailLabel}>{row.label}</div>
                    <div
                      className={cx(
                        styles.detailValue,
                        row.yellow && styles.detailValueYellow,
                      )}
                    >
                      {row.value}
                    </div>
                    {row.action ? (
                      <button
                        type="button"
                        className={cx(
                          styles.detailActionButton,
                          row.desktopOnlyAction &&
                            styles.detailActionDesktopOnly,
                        )}
                      >
                        {ActionIcon ? <ActionIcon /> : null}
                        {row.action}
                      </button>
                    ) : row.payment ? (
                      <div
                        className={cx(
                          styles.paymentStatusIcon,
                          orderPaymentMethod === "PIX" &&
                            styles.paymentStatusPix,
                        )}
                      >
                        {orderPaymentMethod === "PIX" ? <span>pix</span> : null}
                        <PaymentStatusIcon strokeWidth={2.4} />
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                );
              })}
            </section>

            <section className={styles.card}>
              <div className={styles.sectionTitle}>
                <Clock />
                Acompanhe seu pedido
              </div>

              {statuses.map((step, index) => {
                const active = index === activeStatus;
                const completed = index < activeStatus;
                const done = completed || active;
                const historyItem = order?.history?.find(
                  (item) => item.status === step.status,
                );

                return (
                  <div
                    key={step.label}
                    className={cx(
                      styles.timelineItem,
                      completed && styles.timelineItemCompleted,
                      active && styles.timelineItemActive,
                    )}
                  >
                    <div className={styles.timelineMarker}>
                      {index < statuses.length - 1 ? (
                        <div
                          className={cx(
                            styles.timelineLine,
                            index < activeStatus &&
                              styles.timelineLineCompleted,
                          )}
                        />
                      ) : null}
                      <span className={styles.timelineDot} />
                    </div>
                    <span className={styles.timelineTime}>
                      {done ? formatTime(historyItem?.createdAt) : "--:--"}
                    </span>
                    <span className={styles.timelineLabel}>
                      {active ? historyItem?.label || step.label : step.label}
                    </span>
                    {active ? (
                      <span className={styles.timelineBadge}>
                        {order?.status === "PREPARING"
                          ? "Em preparacao"
                          : order?.status === "ON_ROUTE"
                            ? "Saiu para entrega"
                            : order?.status === "DELIVERED"
                              ? "Entregue"
                              : "Aguardando confirmacao"}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </section>
          </div>
        </div>

        <section ref={miniChatRef} className={styles.miniChatCard}>
          <div className={styles.miniChatHeader}>
            <div className={cx(styles.sectionTitle, styles.miniChatTitle)}>
              <MessageCircle />
              Chat do pedido
            </div>
            <span
              className={cx(
                styles.miniChatStatus,
                isMiniChatReadOnly && styles.miniChatStatusReadOnly,
              )}
            >
              {isMiniChatReadOnly ? "Somente leitura" : "Aberto"}
            </span>
          </div>

          <div
            ref={miniChatMessagesRef}
            className={styles.miniChatMessages}
            aria-label="Mensagens do pedido"
          >
            {miniChatMessages.length ? (
              miniChatMessages.map((message) => {
                const isMine =
                  message.senderType !== ChatMessageSenderType.SYSTEM &&
                  message.senderId === localStorage.getItem("userId");

                return (
                  <article
                    key={message.id}
                    className={cx(
                      styles.miniChatBubble,
                      isMine
                        ? styles.miniChatBubbleCustomer
                        : styles.miniChatBubbleStore,
                    )}
                  >
                    <div>{message.text}</div>
                    <span className={styles.miniChatTime}>
                      {formatTime(message.createdAt)}
                    </span>
                  </article>
                );
              })
            ) : (
              <div className={styles.emptyText}>
                Nenhuma mensagem encontrada.
              </div>
            )}
          </div>

          <form
            className={cx(
              styles.miniChatForm,
              isMiniChatReadOnly && styles.miniChatFormReadOnly,
            )}
            onSubmit={handleMiniChatSubmit}
          >
            <input
              className={styles.miniChatInput}
              value={isMiniChatReadOnly ? "" : miniChatDraft}
              disabled={isMiniChatReadOnly || isSendingChatMessage || !order}
              onChange={(event) => setMiniChatDraft(event.target.value)}
              placeholder={
                isMiniChatReadOnly
                  ? "Atendimento encerrado - apenas leitura"
                  : isSendingChatMessage
                    ? "Enviando mensagem..."
                  : "Digite sua mensagem"
              }
            />
            {!isMiniChatReadOnly ? (
              <button
                type="submit"
                className={styles.miniChatSendButton}
                aria-label="Enviar mensagem"
                disabled={isSendingChatMessage || !miniChatDraft.trim() || !order}
              >
                <Send />
              </button>
            ) : null}
          </form>
        </section>
      </div>

      <div className={styles.mobileBottomBar}>
        <div>
          <div className={styles.mobileBottomLabel}>Total do pedido</div>
          <div className={styles.mobileBottomTotal}>{brl(total)}</div>
        </div>
        <div className={styles.mobileBottomDivider} />
        <button
          type="button"
          onClick={() =>
            miniChatRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "end",
            })
          }
          className={styles.supportButton}
        >
          <MessageCircle />
          <span>
            Suporte
            <br />
            Fale conosco
          </span>
        </button>
      </div>

      {showCancelModal && (
        <ConfirmationModal
          icon={<XCircle size={26} />}
          title="Deseja cancelar?"
          description="O pedido será cancelado e não seguirá para preparo ou entrega."
          cancelLabel="Voltar"
          confirmLabel={isCanceling ? "Cancelando..." : "Cancelar"}
          isConfirming={isCanceling}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={handleCancelOrder}
        />
      )}
    </main>
  );
}
