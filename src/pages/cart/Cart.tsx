import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import styles from "./Cart.module.css";
import Colors from "../../themes/Colors";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  StickyNote,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useStoreStatus } from "../../hooks/useStoreStatus";
import {
  makeCartMergeKey,
  type StoredCartItem,
} from "../../utils/cartStorage";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  subtitle?: string;
  image: string;
};

type CartCssVars = CSSProperties & {
  "--bgPrimary": string;
  "--bgSecondary": string;
  "--highlight": string;
  "--textPrimary": string;
  "--textSecondary": string;
};

function parseStoredCartItems(): CartItem[] {
  const raw = localStorage.getItem("food");
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const mergedMap: Record<string, CartItem> = {};

    for (const value of arr) {
      if (!value || typeof value !== "object") continue;
      const product = value as StoredCartItem;
      const key = makeCartMergeKey(product);
      const safeId = String(product.id ?? "").trim();

      const qty = Number(product.qty ?? product.quantity ?? 1);
      const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;

      const name = String(product.name ?? "Item");
      const price = Number(product.price ?? 0);
      const image = String(product.image ?? product.img ?? "");

      if (!mergedMap[key]) {
        mergedMap[key] = {
          id: safeId,
          name,
          price,
          qty: safeQty,
          note: product.note ? String(product.note) : undefined,
          subtitle: product.subtitle ? String(product.subtitle) : undefined,
          image,
        };
      } else {
        mergedMap[key].qty += safeQty;

        if (!mergedMap[key].image && image) mergedMap[key].image = image;
        if (!mergedMap[key].subtitle && product.subtitle) {
          mergedMap[key].subtitle = String(product.subtitle);
        }
        if (!mergedMap[key].note && product.note) {
          mergedMap[key].note = String(product.note);
        }
      }
    }

    return Object.values(mergedMap);
  } catch (error) {
    console.error("Erro lendo localStorage product:", error);
    return [];
  }
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>(parseStoredCartItems);
  const navigation = useNavigate();
  const [orderObs, setOrderObs] = useState("");
  const deliveryFee = 5;
  const storeStatus = useStoreStatus();

  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + it.price * it.qty, 0);
  }, [items]);

  const total = subtotal + (items.length ? deliveryFee : 0);

  const persist = (next: CartItem[]) => {
    setItems(next);
    if (!next.length) localStorage.removeItem("food");
    else localStorage.setItem("food", JSON.stringify(next));
  };

  const getKeyFromItem = (it: CartItem) => {
    const id = String(it.id ?? "").trim();
    if (id) return `id:${id}`;
    return `name:${String(it.name ?? "").trim().toLowerCase()}`;
  };

  const dec = (target: CartItem) => {
    const key = getKeyFromItem(target);
    persist(
      items.map((it) =>
        getKeyFromItem(it) === key
          ? { ...it, qty: Math.max(1, it.qty - 1) }
          : it
      )
    );
  };

  const inc = (target: CartItem) => {
    const key = getKeyFromItem(target);
    persist(
      items.map((it) =>
        getKeyFromItem(it) === key ? { ...it, qty: it.qty + 1 } : it
      )
    );
  };

  const remove = (target: CartItem) => {
    const key = getKeyFromItem(target);
    persist(items.filter((it) => getKeyFromItem(it) !== key));
  };

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const openNow = storeStatus.openNow;

  return (
    <div className={styles.wrap}>
      <ToastContainer position="top-center" />
      <div
        className={styles.screen}
        style={
          {
            "--bgPrimary": Colors.Background.primary,
            "--bgSecondary": Colors.Background.secondary,
            "--highlight": Colors.Highlight.primary,
            "--textPrimary": Colors.Texts.primary,
            "--textSecondary": Colors.Texts.secondary,
          } as CartCssVars
        }
      >
        <div className={styles.content}>
          <header className={styles.header}>
            <button
              className={styles.iconBtn}
              aria-label="Voltar"
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={20} color={Colors.Texts.primary} />
            </button>

            <h1 className={styles.title}>Seu Pedido</h1>

            {items.length > 0 && (
              <div className={styles.linkBtn} onClick={() => navigation("/")}>
                Continuar comprando
              </div>
            )}
          </header>

          <div className={styles.list}>
            {items.length > 0 ? (
              items.map((it) => (
                <div key={getKeyFromItem(it)} className={styles.card}>
                  <div className={styles.thumbWrap}>
                    <img className={styles.thumb} src={it.image} alt={it.name} />
                  </div>

                  <div className={styles.cardInfo}>
                    <div className={styles.nameRow}>
                      <div className={styles.nameCol}>
                        <div className={styles.itemName}>{it.name}</div>
                        <div className={styles.itemPrice}>{brl(it.price)}</div>
                      </div>

                      <div className={styles.qtyArea}>
                        <div className={styles.qtyBox}>
                          <button className={styles.qtyBtn} onClick={() => dec(it)}>
                            <Minus size={16} />
                          </button>

                          <div className={styles.qtyValue}>{it.qty}</div>

                          <button
                            className={`${styles.qtyBtn} ${styles.qtyBtnPlus}`}
                            onClick={() => inc(it)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button className={styles.trashBtn} onClick={() => remove(it)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {it.subtitle && <div className={styles.subLine}>{it.subtitle}</div>}
                    {it.note && <div className={styles.noteLine}>{it.note}</div>}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <h3>Você ainda não possui pedidos</h3>
                <button className={styles.emptyButton} onClick={() => navigation("/")}>
                  Fazer pedido
                </button>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <section className={styles.obsSection}>
              <div className={styles.obsHeader}>
                <StickyNote size={18} />
                <span>Observações do pedido</span>
              </div>

              <textarea
                className={styles.textarea}
                value={orderObs}
                onChange={(e) => setOrderObs(e.target.value)}
              />
            </section>
          )}

          <section className={styles.summary}>
            <div className={styles.sumRow}>
              <span>Subtotal</span>
              <span>{brl(subtotal)}</span>
            </div>

            <div className={styles.sumRow}>
              <span>Taxa de entrega</span>
              <span>{items.length ? brl(deliveryFee) : brl(0)}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{brl(total)}</span>
            </div>
          </section>
        </div>

        <div className={styles.bottomBar}>
          <button
            className={styles.checkoutBtn}
            disabled={items.length === 0}
            onClick={() => {
              if (storeStatus.loading) {
                toast.info("Verificando horário de funcionamento...", {
                  autoClose: 1800,
                });
                return;
              }

              if (!openNow) {
                const left = storeStatus.hoursToOpen;
                toast.error(
                  `Fechado, abrimos em ${left} ${left === 1 ? "hora" : "horas"}`,
                  { autoClose: 2500 }
                );
                return;
              }

              navigation("/checkout", {
                state: { items, orderObs, deliveryFee, subtotal, total },
              });
            }}
          >
            <span>Finalizar Pedido</span>
            <span>
              {brl(total)} <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
