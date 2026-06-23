import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./FoodDetails.module.css";
import {
  Share2,
  Minus,
  Plus,
  Check,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import { addCart, FoodCard } from "../../components/food/FoodCard";
import type { FoodResponseDto } from "../../dtos/Food-Response.Dto";
import { toast, ToastContainer } from "react-toastify";
import Colors from "../../themes/Colors";

type Addon = {
  id: string;
  name: string;
  desc?: string;
  price: number;
};

type DrinkOption = {
  id: string;
  name: string;
};

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FoodDetails() {
  const navigation = useNavigate();
  const location = useLocation();

  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [cartActived, setCartActivedCart] = useState(false);
  const [products, setProducts] = useState<FoodResponseDto | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedDrinkOption, setSelectedDrinkOption] = useState<string | null>(
    null
  );
  const [complements, setComplements] = useState<FoodResponseDto[]>([]);
  const [productStack, setProductStack] = useState<FoodResponseDto[]>([]);

  const stackRef = useRef<FoodResponseDto[]>([]);
  const mountedRef = useRef(false);
  const prevScrollRestoration = useRef<string | null>(null);
  const ignoreNextPopRef = useRef(false);

  const resetForNewProduct = () => {
    setQty(1);
    setNote("");
    setSelectedAddons({});
    setSelectedDrinkOption(null);
  };

  const pushTrapHistoryState = () => {
    ignoreNextPopRef.current = true;
    window.history.pushState({ trap: true }, "", window.location.href);
    setTimeout(() => {
      ignoreNextPopRef.current = false;
    }, 0);
  };

  useEffect(() => {
    stackRef.current = productStack;
  }, [productStack]);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    prevScrollRestoration.current = window.history.scrollRestoration;
    try {
      window.history.scrollRestoration = "manual";
    } catch {}

    const state = (location.state || {}) as {
      item?: FoodResponseDto;
      productsMock?: FoodResponseDto[];
    };

    if (state.item) {
      setProducts(state.item);
      setProductStack([state.item]);
      setComplements(
        Array.isArray(state.productsMock) ? state.productsMock : []
      );
      resetForNewProduct();
      window.scrollTo({ top: 0, behavior: "auto" });

      pushTrapHistoryState();
    }

    return () => {
      try {
        if (prevScrollRestoration.current) {
          window.history.scrollRestoration = prevScrollRestoration.current as any;
        }
      } catch {}
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (ignoreNextPopRef.current) return;

      const stack = stackRef.current;

      if (stack.length > 1) {
        const next = stack.slice(0, -1);
        const prevProduct = next[next.length - 1] || null;

        setProductStack(next);
        setProducts(prevProduct);
        resetForNewProduct();
        window.scrollTo({ top: 0, behavior: "auto" });

        pushTrapHistoryState();
        return;
      }

      // quando só tem 1 produto, deixa o back do celular sair pra Main
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const drinkOptions: DrinkOption[] = [
    { id: "gelado", name: "Gelado" },
    { id: "natural", name: "Natural" },
  ];

  const productAddons: Addon[] = useMemo(() => {
    return (products?.addons || []).map((addon) => ({
      id: addon.id,
      name: addon.name,
      desc: addon.desc,
      price: addon.price,
    }));
  }, [products?.addons]);

  const goDetails = (item: FoodResponseDto) => {
    setProductStack((prev) => {
      const last = prev[prev.length - 1];
      if (last?.id === item.id) return prev;
      return [...prev, item];
    });

    setProducts(item);
    resetForNewProduct();
    window.scrollTo({ top: 0, behavior: "auto" });

    pushTrapHistoryState();
  };

  const handleBack = useCallback(() => {
    const stack = stackRef.current;

    if (stack.length > 1) {
      const next = stack.slice(0, -1);
      const prevProduct = next[next.length - 1] || null;

      setProductStack(next);
      setProducts(prevProduct);
      resetForNewProduct();
      window.scrollTo({ top: 0, behavior: "auto" });

      pushTrapHistoryState();
      return;
    }

    navigation(-1);
  }, [navigation]);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDrinkOption = (id: string) => {
    setSelectedDrinkOption((prev) => (prev === id ? null : id));
  };

  const selectedAddonList = useMemo(() => {
    return productAddons
      .filter((a) => selectedAddons[a.id])
      .map((a) => ({ id: a.id, name: a.name, price: a.price }));
  }, [productAddons, selectedAddons]);

  const addonsTotal = useMemo(() => {
    return selectedAddonList.reduce((acc, a) => acc + a.price, 0);
  }, [selectedAddonList]);

  const total = useMemo(() => {
    const base = products?.price ?? 0;
    return (base + addonsTotal) * qty;
  }, [products?.price, addonsTotal, qty]);

  const cartItem = useMemo(() => {
    if (!products) return null;

    const basePrice = products.price ?? 0;
    const unitPrice = basePrice + addonsTotal;

    const subtitleParts = [
      ...selectedAddonList.map((a) => `+ ${a.name}`),
      selectedDrinkOption ? selectedDrinkOption : null,
    ].filter(Boolean);

    return {
      ...products,
      id: products.id,
      price: unitPrice,
      qty,
      note: note.trim() || undefined,
      addons: selectedAddonList,
      unitPrice,
      totalPrice: unitPrice * qty,
      subtitle: subtitleParts.length ? subtitleParts.join(", ") : undefined,
    };
  }, [products, qty, note, selectedAddonList, addonsTotal, selectedDrinkOption]);

  const checkoutItem = useMemo(() => {
    if (!cartItem) return null;
    return {
      id: String((cartItem as any).id || ""),
      name: String((cartItem as any).name || ""),
      price: Number((cartItem as any).price || 0),
      qty: Number((cartItem as any).qty || 1),
      note: (cartItem as any).note,
      subtitle: (cartItem as any).subtitle,
      image: String((cartItem as any).img || (cartItem as any).image || ""),
    };
  }, [cartItem]);

  const checkoutState = useMemo(() => {
    if (!checkoutItem) return null;
    const items = [checkoutItem];
    const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
    const deliveryFee = 0;
    const total = subtotal + (items.length ? deliveryFee : 0);
    return {
      items,
      orderObs: "",
      deliveryFee,
      subtotal,
      total,
    };
  }, [checkoutItem]);

  if (!products) return null;

  function activedCart() {
    setCartActivedCart(true);
    setTimeout(() => setCartActivedCart(false), 7000);
  }

  return (
    <div
      className={styles.page}
      style={
        {
          "--bg-primary": Colors.Background.primary,
          "--bg-secondary": Colors.Background.secondary,
          "--text-primary": Colors.Texts.primary,
          "--text-secondary": Colors.Texts.secondary,
          "--highlight": Colors.Highlight.primary,
        } as React.CSSProperties
      }
    >
      <ToastContainer position="top-center" />

      {cartActived && (
        <div className={styles.cartFloat}>
          <button
            className={styles.headerCartActived}
            type="button"
            onClick={() => navigation("/cart")}
          >
            <ShoppingCart size={20} />
          </button>
        </div>
      )}

      <div className={styles.top}>
        <div className={styles.media}>
          <img
            className={styles.mediaImg}
            src={products.img}
            alt={products.name}
          />

          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBack}
          >
            <ArrowLeft size={18} />
          </button>

          <button type="button" className={styles.shareBtn}>
            <Share2 size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>{products.name}</h1>

            <div className={styles.priceRow}>
              <span className={styles.price}>{BRL(products.price)}</span>
              {products.badge && (
                <span className={styles.badge}>{products.badge}</span>
              )}
            </div>

            <p className={styles.desc}>{products.desc}</p>
          </div>

          {products.category === "Sanduíches" && productAddons.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Adicionais</h2>
                <span className={styles.sectionChip}>Opcional</span>
              </div>

              <div className={styles.addons}>
                {productAddons.map((a) => {
                  const active = !!selectedAddons[a.id];
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className={`${styles.addonRow} ${
                        active ? styles.addonActive : ""
                      }`}
                      onClick={() => toggleAddon(a.id)}
                    >
                      <span className={styles.toggle}>
                        <span
                          className={`${styles.toggleKnob} ${
                            active ? styles.toggleOn : ""
                          }`}
                        >
                          {active && <Check size={14} />}
                        </span>
                      </span>

                      <span className={styles.addonInfo}>
                        <span className={styles.addonName}>{a.name}</span>
                        {a.desc ? (
                          <span className={styles.addonDesc}>{a.desc}</span>
                        ) : null}
                      </span>

                      <span className={styles.addonPrice}>
                        + {BRL(a.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {products.category !== "Sanduíches" && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Como você prefere?</h2>
                <span className={styles.sectionChip}>Opcional</span>
              </div>

              <div className={styles.addons}>
                {drinkOptions.map((o) => {
                  const active = selectedDrinkOption === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className={`${styles.addonRow} ${
                        active ? styles.addonActive : ""
                      }`}
                      onClick={() => toggleDrinkOption(o.id)}
                    >
                      <span className={styles.toggle}>
                        <span
                          className={`${styles.toggleKnob} ${
                            active ? styles.toggleOn : ""
                          }`}
                        >
                          {active && <Check size={14} />}
                        </span>
                      </span>

                      <span className={styles.addonInfo}>
                        <span className={styles.addonName}>{o.name}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.stepperWrapper}>
          <div className={styles.stepper}>
            <button
              className={styles.stepBtn}
              onClick={() => setQty((v) => Math.max(1, v - 1))}
              type="button"
            >
              <Minus size={16} />
            </button>

            <div className={styles.stepValue}>{qty}</div>

            <button
              className={styles.stepBtn}
              onClick={() => setQty((v) => v + 1)}
              type="button"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className={styles.buttonsWrapper}>
            <button
              className={styles.addBtn}
              type="button"
              onClick={() => {
                if (!cartItem) return;
                addCart(cartItem);
                toast.success("Produto adicionado ao carrinho", {
                  autoClose: 2000,
                });
                activedCart();
                resetForNewProduct();
              }}
            >
              <span>Adicionar</span>
              <span className={styles.addBtnPrice}>{BRL(total)}</span>
            </button>

            <button
              className={styles.finilyBtn}
              type="button"
              onClick={() => {
                if (!checkoutState) return;
                resetForNewProduct();
                addCart(checkoutItem);
                navigation("/checkout", { state: checkoutState });
              }}
            >
              <span>Pedir</span>
              <span className={styles.addBtnPrice}>{BRL(total)}</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.complementsSection}>
        <h2 className={styles.sectionTitle}>Complementos</h2>

        <div className={styles.complements}>
          {complements.map((c) => (
            <div key={c.id} className={styles.compItem}>
              <FoodCard
                id={c.id}
                img={c.img}
                name={c.name}
                desc={c.desc}
                price={c.price}
                originalPrice={c.originalPrice}
                onDetails={() => goDetails(c)}
                functions={() => activedCart()}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
