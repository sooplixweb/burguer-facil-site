import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import Colors from "../themes/Colors";
import { OrderController } from "../controllers/order.controller";
import type { PaymentMethodEnum } from "../dtos/enums/payment-method.enum";
import type { OrderResponseDto } from "../dtos/response/order-response.dto";
import { formatOrderCode } from "../utils/formatOrderCode";

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

function useIsMobile() {
  const getIsMobile = () => {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    return viewportWidth <= 1180;
  };
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  return isMobile;
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

export default function OrderInform() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const state = (location.state || {}) as OrderState;
  const [order, setOrder] = useState<OrderResponseDto | null>(null);

  useEffect(() => {
    if (!state.orderId && !state.orderNumber) return;

    let active = true;
    const lookup = state.orderId || state.orderNumber || "";

    const loadOrder = () => {
      OrderController.findById(lookup)
        .then((data) => {
          if (active) setOrder(data);
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
    [items, order, state.subtotal]
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
  const addressLine = order?.addressStreet || stateAddressLine || "Nao informado";
  const addressSub = order?.addressCityState || stateAddressSub;

  const yellow = Colors.Highlight.primary;
  const green = "#2ecc71";
  const activeStatus = statusIndex(order?.status);
  const statuses = [
    { status: "RECEIVED", label: "Pedido enviado", icon: Check },
    { status: "PREPARING", label: "Em preparacao", icon: CookingPot },
    { status: "ON_ROUTE", label: "Saiu para entrega", icon: Bike },
    { status: "DELIVERED", label: "Entregue", icon: Home },
  ];
  const progressPercent = (activeStatus / (statuses.length - 1)) * 75;

  const s = {
    page: {
      minHeight: "100vh",
      width: "100%",
      background:
        "radial-gradient(circle at 20% 0%, rgba(255,215,0,.08), transparent 26%), linear-gradient(180deg, #0b0b0b 0%, #050505 100%)",
      color: Colors.Texts.primary,
      fontFamily: "var(--font-primary)",
      padding: isMobile ? "12px 10px 76px" : "14px 24px 22px",
      overflowX: "hidden",
    } as React.CSSProperties,
    shell: {
      width: "100%",
      maxWidth: isMobile ? 430 : 980,
      margin: "0 auto",
    } as React.CSSProperties,
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: isMobile ? 8 : 12,
      marginBottom: isMobile ? 8 : 10,
      minWidth: 0,
    } as React.CSSProperties,
    headerTitle: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 9 : 10,
      minWidth: 0,
    } as React.CSSProperties,
    headerIcon: {
      width: isMobile ? 34 : 42,
      height: isMobile ? 34 : 42,
      borderRadius: "50%",
      border: "1px solid rgba(255,215,0,.28)",
      background: "rgba(255,255,255,.035)",
      display: "grid",
      placeItems: "center",
      color: yellow,
      boxShadow: "0 0 18px rgba(255,215,0,.1)",
      flex: "0 0 auto",
    } as React.CSSProperties,
    h1: {
      margin: 0,
      fontSize: isMobile ? 13 : 21,
      lineHeight: 1.05,
      fontWeight: 900,
      letterSpacing: 0,
    } as React.CSSProperties,
    subtitle: {
      marginTop: isMobile ? 2 : 4,
      fontSize: isMobile ? 8 : 11,
      lineHeight: 1.25,
      fontWeight: 700,
      color: "rgba(255,255,255,.66)",
    } as React.CSSProperties,
    homeButton: {
      height: isMobile ? 30 : 34,
      padding: isMobile ? "0 9px" : "0 12px",
      borderRadius: isMobile ? 6 : 7,
      border: "1px solid rgba(255,215,0,.45)",
      background: "rgba(255,215,0,.04)",
      color: yellow,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: isMobile ? 5 : 7,
      fontSize: isMobile ? 8 : 11,
      fontWeight: 900,
      whiteSpace: "nowrap",
      cursor: "pointer",
      flex: "0 0 auto",
    } as React.CSSProperties,
    panel: {
      background: "linear-gradient(135deg, rgba(255,255,255,.055), rgba(255,255,255,.02))",
      border: "1px solid rgba(255,255,255,.14)",
      borderRadius: isMobile ? 6 : 8,
      boxShadow: "0 8px 20px rgba(0,0,0,.22)",
    } as React.CSSProperties,
    statusPanel: {
      padding: isMobile ? "10px 8px 7px" : "14px 28px 12px",
      marginBottom: isMobile ? 8 : 10,
    } as React.CSSProperties,
    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(300px, .82fr) minmax(390px, 1.18fr)",
      gap: isMobile ? 8 : 12,
      alignItems: "start",
      width: "100%",
    } as React.CSSProperties,
    card: {
      ...({
        background: "linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.018))",
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: isMobile ? 6 : 8,
        boxShadow: "0 8px 20px rgba(0,0,0,.22)",
      } as React.CSSProperties),
      padding: isMobile ? 8 : 13,
    } as React.CSSProperties,
    sectionTitle: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 6 : 8,
      fontSize: isMobile ? 9 : 15,
      fontWeight: 900,
      marginBottom: isMobile ? 8 : 12,
      color: "rgba(255,255,255,.94)",
    } as React.CSSProperties,
    yellowIcon: {
      color: yellow,
      flex: "0 0 auto",
    } as React.CSSProperties,
    item: {
      display: "grid",
      gridTemplateColumns: isMobile ? "46px minmax(0, 1fr) auto" : "58px 1fr auto",
      gap: isMobile ? 8 : 11,
      alignItems: "center",
      marginBottom: isMobile ? 8 : 10,
    } as React.CSSProperties,
    thumb: {
      width: isMobile ? 46 : 58,
      height: isMobile ? 46 : 52,
      borderRadius: isMobile ? 5 : 6,
      objectFit: "cover",
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(255,255,255,.06)",
    } as React.CSSProperties,
    thumbPlaceholder: {
      width: isMobile ? 46 : 58,
      height: isMobile ? 46 : 52,
      borderRadius: isMobile ? 5 : 6,
      border: "1px solid rgba(255,255,255,.12)",
      background: "rgba(255,255,255,.045)",
      color: "rgba(255,255,255,.38)",
      display: "grid",
      placeItems: "center",
    } as React.CSSProperties,
    itemName: {
      fontSize: isMobile ? 10 : 13,
      fontWeight: 900,
      lineHeight: 1.2,
      marginBottom: isMobile ? 2 : 3,
    } as React.CSSProperties,
    itemDesc: {
      color: "rgba(255,255,255,.62)",
      fontSize: isMobile ? 8 : 10,
      lineHeight: 1.35,
      fontWeight: 700,
      maxWidth: isMobile ? "100%" : 320,
    } as React.CSSProperties,
    itemPrice: {
      color: yellow,
      fontSize: isMobile ? 10 : 13,
      fontWeight: 900,
      whiteSpace: "nowrap",
    } as React.CSSProperties,
    divider: {
      height: 1,
      background: "rgba(255,255,255,.1)",
      margin: isMobile ? "8px 0" : "10px 0",
    } as React.CSSProperties,
    totalLine: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      fontSize: isMobile ? 8 : 11,
      fontWeight: 800,
      color: "rgba(255,255,255,.62)",
      marginTop: isMobile ? 4 : 6,
    } as React.CSSProperties,
    totalStrong: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      fontSize: isMobile ? 10 : 14,
      fontWeight: 900,
      marginTop: isMobile ? 8 : 10,
    } as React.CSSProperties,
    totalValue: {
      color: yellow,
      fontSize: isMobile ? 12 : 17,
      fontWeight: 900,
      whiteSpace: "nowrap",
    } as React.CSSProperties,
  };

  return (
    <main style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <div style={s.headerTitle}>
            <div style={s.headerIcon}>
              <Send size={isMobile ? 19 : 23} strokeWidth={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={s.h1}>Pedido enviado</h1>
              <div style={s.subtitle}>Acompanhe o status do seu pedido em tempo real.</div>
            </div>
          </div>
          <button type="button" onClick={() => navigate("/")} style={s.homeButton}>
            <Home size={isMobile ? 13 : 15} />
            Inicio
          </button>
        </header>

        <section style={{ ...s.panel, ...s.statusPanel }}>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div
              style={{
                position: "absolute",
                left: "12.5%",
                width: "75%",
                top: isMobile ? 15 : 22,
                height: isMobile ? 2 : 3,
                background: "rgba(255,255,255,.32)",
                transform: "translateY(-50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "12.5%",
                width: `${progressPercent}%`,
                top: isMobile ? 15 : 22,
                height: isMobile ? 2 : 3,
                background: yellow,
                boxShadow: "0 0 14px rgba(255,215,0,.38)",
                transform: "translateY(-50%)",
                transition: "width .28s ease",
              }}
            />

            {statuses.map((step, index) => {
              const Icon = step.icon;
              const active = index === activeStatus;
              const completed = index < activeStatus;
              const stepColor = completed ? green : active ? yellow : "rgba(255,255,255,.54)";
              return (
                <div key={step.label} style={{ position: "relative", textAlign: "center", zIndex: 1 }}>
                  <div
                    style={{
                      width: isMobile ? 32 : 44,
                      height: isMobile ? 32 : 44,
                      borderRadius: "50%",
                      margin: "0 auto",
                      display: "grid",
                      placeItems: "center",
                      background: completed ? green : active ? yellow : "rgba(10,10,10,.82)",
                      border: completed
                        ? `1px solid ${green}`
                        : active
                        ? `1px solid ${yellow}`
                        : "1px dashed rgba(255,255,255,.36)",
                      color: completed || active ? "#050505" : "rgba(255,255,255,.78)",
                      boxShadow: active
                        ? "0 0 16px rgba(255,215,0,.42)"
                        : completed
                        ? "0 0 12px rgba(46,204,113,.24)"
                        : "none",
                    }}
                  >
                    <Icon size={isMobile ? 17 : 22} strokeWidth={completed || active ? 3 : 2.2} />
                  </div>
                  <div
                    style={{
                      color: stepColor,
                      fontSize: isMobile ? 7 : 12,
                      fontWeight: 900,
                      lineHeight: 1,
                      marginTop: isMobile ? 4 : 6,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      color: stepColor,
                      fontSize: isMobile ? 6 : 10,
                      fontWeight: 900,
                      lineHeight: 1.18,
                      marginTop: isMobile ? 2 : 5,
                    }}
                  >
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div style={s.grid}>
          <section style={s.card}>
            <div style={{ ...s.sectionTitle, justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: isMobile ? 5 : 12 }}>
                <ReceiptText size={isMobile ? 11 : 18} style={s.yellowIcon} />
                Resumo do pedido
              </span>
              {!isMobile ? (
                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,.16)",
                    background: "transparent",
                    color: yellow,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Ver detalhes <ChevronRight size={13} />
                </button>
              ) : null}
            </div>

            {items.length ? (
              items.map((item, index) => (
                <div key={`${item.id}-${index}`} style={s.item}>
                  {item.image ? (
                    <img style={s.thumb} src={item.image} alt={item.name} />
                  ) : (
                    <div style={s.thumbPlaceholder}>
                      <ReceiptText size={isMobile ? 16 : 20} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={s.itemName}>
                      {item.qty}x&nbsp; {item.name}
                    </div>
                    <div style={s.itemDesc}>{item.subtitle}</div>
                  </div>
                  <div style={s.itemPrice}>{brl(item.price * item.qty)}</div>
                </div>
              ))
            ) : (
              <div style={{ color: "rgba(255,255,255,.62)", fontSize: isMobile ? 8 : 11, fontWeight: 800 }}>
                Nenhum item encontrado.
              </div>
            )}

            {!isMobile ? (
              <>
                <div style={s.divider} />
                <div style={s.totalLine}>
                  <span>Subtotal</span>
                  <span>{brl(subtotal)}</span>
                </div>
                <div style={s.totalLine}>
                  <span>Taxa de entrega</span>
                  <span>{brl(deliveryFee)}</span>
                </div>
              </>
            ) : null}

            <div style={isMobile ? { ...s.totalStrong, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 7 } : s.totalStrong}>
              <span>Total do pedido</span>
              <span style={s.totalValue}>{brl(total)}</span>
            </div>
          </section>

          <div style={{ display: "grid", gap: isMobile ? 8 : 12, minWidth: 0, width: "100%" }}>
            <section style={s.card}>
              <div style={s.sectionTitle}>
                <MapPin size={isMobile ? 11 : 18} style={s.yellowIcon} />
                Entrega
              </div>

              {[
                {
                  icon: MapPin,
                  label: "Endereco",
                  value: `${addressLine}${!isMobile && addressSub ? `\n${addressSub}` : ""}`,
                  action: addressLine !== "Nao informado" ? "Ver no mapa" : undefined,
                  actionIcon: Map,
                },
                { icon: ReceiptText, label: "Pagamento", value: orderPaymentLabel, payment: true },
                { icon: Clock, label: "Previsao de entrega", value: "35-45 min", yellow: true },
                {
                  icon: Hash,
                  label: "Numero do pedido",
                  value: orderNumber,
                  yellow: true,
                  action: !isMobile && orderNumber !== "Nao informado" ? "Copiar numero" : undefined,
                  actionIcon: Copy,
                },
              ].map((row, index) => {
                const Icon = row.icon;
                const ActionIcon = row.actionIcon;
                return (
                  <div
                    key={row.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile
                        ? "16px 68px minmax(0, 1fr) auto"
                        : "20px 102px 1fr auto",
                      alignItems: "center",
                      gap: isMobile ? 5 : 8,
                      minHeight: isMobile ? 22 : 34,
                      padding: isMobile ? "6px 0" : "0 6px",
                      borderTop: index ? "1px solid rgba(255,255,255,.08)" : "none",
                      color: "rgba(255,255,255,.74)",
                    }}
                  >
                    <Icon size={isMobile ? 10 : 15} />
                    <div style={{ fontSize: isMobile ? 8 : 10, fontWeight: 800, minWidth: 0 }}>{row.label}</div>
                    <div
                      style={{
                        whiteSpace: "pre-line",
                        fontSize: isMobile ? 7 : 11,
                        lineHeight: 1.35,
                        fontWeight: 800,
                        color: row.yellow ? yellow : "rgba(255,255,255,.8)",
                        minWidth: 0,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {row.value}
                      {isMobile && index === 0 && addressSub ? <div>{addressSub}</div> : null}
                    </div>
                    {row.action ? (
                      <button
                        type="button"
                        style={{
                          border: `1px solid rgba(255,215,0,.6)`,
                          background: "rgba(255,215,0,.03)",
                          color: yellow,
                          borderRadius: isMobile ? 4 : 6,
                          height: isMobile ? 22 : 28,
                          padding: isMobile ? "0 7px" : "0 9px",
                          fontSize: isMobile ? 7 : 10,
                          fontWeight: 900,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: isMobile ? 3 : 5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ActionIcon ? <ActionIcon size={isMobile ? 8 : 12} /> : null}
                        {row.action}
                      </button>
                    ) : row.payment ? (
                      <div
                        style={{
                          color: orderPaymentMethod === "PIX" ? "#79ddd4" : yellow,
                          fontSize: isMobile ? 16 : 18,
                          fontWeight: 900,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 5,
                          textTransform: orderPaymentMethod === "PIX" ? "lowercase" : "none",
                        }}
                      >
                        {orderPaymentMethod === "PIX" ? <span>pix</span> : null}
                        <PaymentStatusIcon size={isMobile ? 15 : 18} strokeWidth={2.4} />
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                );
              })}
            </section>

            <section style={s.card}>
              <div style={s.sectionTitle}>
                <Clock size={isMobile ? 11 : 18} style={s.yellowIcon} />
                Acompanhe seu pedido
              </div>

              {statuses.map((step, index) => {
                const active = index === activeStatus;
                const completed = index < activeStatus;
                const done = completed || active;
                const historyItem = order?.history?.find(
                  (item) => item.status === step.status,
                );
                const timelineColor = completed ? green : active ? yellow : "rgba(255,255,255,.5)";
                return (
                  <div
                    key={step.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "18px 34px minmax(0, 1fr)" : "20px 42px 1fr auto",
                      alignItems: "center",
                      gap: isMobile ? 7 : 8,
                      minHeight: isMobile ? 24 : 30,
                      color: timelineColor,
                      fontSize: isMobile ? 8 : 11,
                      fontWeight: 900,
                      position: "relative",
                    }}
                  >
                    <div style={{ position: "relative", height: "100%", display: "grid", placeItems: "center" }}>
                      {index < statuses.length - 1 ? (
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            bottom: isMobile ? -13 : -10,
                            left: "50%",
                            width: 2,
                            background: index < activeStatus ? green : "rgba(255,255,255,.32)",
                            transform: "translateX(-50%)",
                          }}
                        />
                      ) : null}
                      <span
                        style={{
                          position: "relative",
                          width: isMobile ? 10 : 11,
                          height: isMobile ? 10 : 11,
                          borderRadius: "50%",
                          background: timelineColor,
                          boxShadow: active ? "0 0 12px rgba(255,215,0,.6)" : "none",
                        }}
                      />
                    </div>
                    <span style={{ color: done ? "rgba(255,255,255,.82)" : "rgba(255,255,255,.5)" }}>
                      {done ? formatTime(historyItem?.createdAt) : "--:--"}
                    </span>
                    <span style={{ minWidth: 0 }}>{active ? historyItem?.label || step.label : step.label}</span>
                    {active ? (
                      <span
                        style={{
                          display: isMobile ? "none" : "inline-block",
                          color: yellow,
                          border: "1px solid rgba(255,215,0,.5)",
                          borderRadius: 999,
                          padding: isMobile ? "3px 6px" : "5px 8px",
                          fontSize: isMobile ? 6 : 10,
                          whiteSpace: "nowrap",
                          background: "rgba(255,215,0,.06)",
                        }}
                      >{order?.status === "PREPARING" ? "Em preparacao" : order?.status === "ON_ROUTE" ? "Saiu para entrega" : order?.status === "DELIVERED" ? "Entregue" : "Aguardando confirmacao"}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      </div>

      {isMobile ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            height: 58,
            background: "rgba(6,6,6,.96)",
            borderTop: "1px solid rgba(255,255,255,.12)",
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
            alignItems: "center",
            padding: "8px 14px",
            zIndex: 20,
          }}
        >
          <div>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 7, fontWeight: 800 }}>Total do pedido</div>
            <div style={{ color: yellow, fontSize: 15, fontWeight: 900 }}>{brl(total)}</div>
          </div>
          <div style={{ height: 34, background: "rgba(255,255,255,.12)" }} />
          <button
            type="button"
            style={{
              background: "transparent",
              border: 0,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 8,
              fontWeight: 900,
            }}
          >
            <MessageCircle size={18} color={yellow} />
            <span>Suporte<br />Fale conosco</span>
          </button>
        </div>
      ) : null}
    </main>
  );
}
