import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  Check,
  ChefHat,
  Home,
  Map,
} from "lucide-react";
import { Header } from "../../components/Header/Header";
import type { OrderResponseDto } from "../../dtos/response/order-response.dto";
import { OrderService } from "../../service/order.service";
import { formatOrderCode } from "../../utils/formatOrderCode";
import styles from "./Orders.module.css";

type TabKey = "active" | "finished" | "canceled";

type OrderStep = "received" | "preparing" | "route" | "delivered";

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Recebido",
  PREPARING: "Preparando",
  ON_ROUTE: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

const STATUS_STEP: Record<string, OrderStep> = {
  RECEIVED: "received",
  PREPARING: "preparing",
  ON_ROUTE: "route",
  DELIVERED: "delivered",
};

function getOrderCode(order: OrderResponseDto) {
  return formatOrderCode(order.code);
}

function formatMoney(value: string | number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getItemDescription(item: OrderResponseDto["items"][number]) {
  const parts = [
    item.description,
    item.addons?.length
      ? item.addons.map((addon) => `+ ${addon.name}`).join(", ")
      : "",
    item.observations ? `Obs: ${item.observations}` : "",
  ].filter(Boolean);

  return parts.join(" • ");
}

function getFirstImage(order: OrderResponseDto) {
  return (
    order.items.find((item) => item.imageUrl)?.imageUrl ||
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=240&q=80"
  );
}

function getActiveStep(status: string): OrderStep {
  return STATUS_STEP[status] || "received";
}

function isStepDone(step: OrderStep, activeStep: OrderStep) {
  const order = ["received", "preparing", "route", "delivered"];
  return order.indexOf(step) <= order.indexOf(activeStep);
}

function getTabFromStatus(status: string): TabKey {
  if (status === "DELIVERED") return "finished";
  if (status === "CANCELED") return "canceled";
  return "active";
}

function getStatusTone(status: string) {
  if (status === "DELIVERED") return "done";
  if (status === "CANCELED") return "canceled";
  if (status === "ON_ROUTE") return "route";
  return "active";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`${styles.statusBadge} ${
        styles[`status_${getStatusTone(status)}`]
      }`}
    >
      <ChefHat size={17} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Timeline({ status }: { status: string }) {
  const activeStep = getActiveStep(status);
  const steps: { key: OrderStep; label: string; icon: React.ReactNode }[] = [
    { key: "received", label: "Recebido", icon: <Check size={20} /> },
    { key: "preparing", label: "Preparando", icon: <ChefHat size={20} /> },
    { key: "route", label: "Saiu para entrega", icon: <Bike size={20} /> },
    { key: "delivered", label: "Entregue", icon: <Home size={20} /> },
  ];

  return (
    <div className={styles.timeline} data-active-step={activeStep}>
      {steps.map((step) => {
        const done = isStepDone(step.key, activeStep);
        return (
          <div
            key={step.key}
            className={done ? styles.stepDone : styles.stepMuted}
          >
            <span>{step.icon}</span>
            <strong>{step.label}</strong>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  order,
  onDetails,
}: {
  order: OrderResponseDto;
  onDetails: () => void;
}) {
  return (
    <section className={styles.currentOrder}>
      <div className={styles.orderTop}>
        <div>
          <h2>Pedido {getOrderCode(order)}</h2>
          <p>
            <strong>{STATUS_LABELS[order.status] || order.status}</strong>
            <span>• Status do pedido</span>
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== "CANCELED" && <Timeline status={order.status} />}

      <div className={styles.items}>
        {order.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className={styles.orderItem}>
            <img src={item.imageUrl || getFirstImage(order)} alt={item.name} />
            <div>
              <strong>{item.name}</strong>
              <p>{getItemDescription(item)}</p>
            </div>
            <span>x{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className={styles.total}>
        <span>Total</span>
        <strong>{formatMoney(order.total)}</strong>
      </div>

      {order.status !== "DELIVERED" && order.status !== "CANCELED" && (
        <button className={styles.trackButton} type="button" onClick={onDetails}>
          <Map size={20} />
          Acompanhar pedido
        </button>
      )}

      <button className={styles.detailsButton} type="button" onClick={onDetails}>
        Ver detalhes
      </button>
    </section>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponseDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const data = await OrderService.findAll();
        if (!active) return;

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setOrders(sorted);
        setError("");
      } catch {
        if (active) setError("Não foi possível carregar seus pedidos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOrders();
    const intervalId = window.setInterval(loadOrders, 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => getTabFromStatus(order.status) === activeTab);
  }, [activeTab, orders]);

  const goOrderDetails = (orderId: string) => {
    navigate("/order-inform", {
      state: {
        orderId,
      },
    });
  };

  return (
    <div className={styles.screen}>
      <Header showSearch={false} onCartClick={() => navigate("/cart")} />

      <main className={styles.content}>
        <h1 className={styles.title}>Pedidos</h1>

        <div className={styles.tabs}>
          <button
            className={activeTab === "active" ? styles.activeTab : ""}
            type="button"
            onClick={() => setActiveTab("active")}
          >
            Em andamento
          </button>
          <button
            className={activeTab === "finished" ? styles.activeTab : ""}
            type="button"
            onClick={() => setActiveTab("finished")}
          >
            Finalizados
          </button>
          <button
            className={activeTab === "canceled" ? styles.activeTab : ""}
            type="button"
            onClick={() => setActiveTab("canceled")}
          >
            Cancelados
          </button>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Carregando pedidos...</div>
        ) : error ? (
          <div className={styles.emptyState}>{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>Nenhum pedido nesta categoria.</div>
        ) : (
          <div className={styles.ordersList}>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onDetails={() => goOrderDetails(order.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
