import type { CSSProperties } from "react";
import { useMemo, useState, useEffect, useCallback } from "react";
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
import type { FoodResponseDto } from "../../dtos/Food-Response.Dto";
import { toast, ToastContainer } from "react-toastify";
import Colors from "../../themes/Colors";
import { addCart } from "../../utils/cartStorage";

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

type FoodDetailsNavState = {
  item?: FoodResponseDto;
  productsMock?: FoodResponseDto[];
};

type CheckoutItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  subtitle?: string;
  image: string;
};

type FoodDetailsCssVars = CSSProperties & {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--highlight": string;
};

const BRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FoodDetails() {
  const navigation = useNavigate();
  const location = useLocation();
  const initialState = (location.state || {}) as FoodDetailsNavState;
  const initialProduct = initialState.item ?? null;

  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [cartActived, setCartActivedCart] = useState(false);
  const [products, setProducts] = useState<FoodResponseDto | null>(
    initialProduct,
  );
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedDrinkOption, setSelectedDrinkOption] = useState<string | null>(
    null,
  );
  const [complements] = useState<FoodResponseDto[]>(
    Array.isArray(initialState.productsMock) ? initialState.productsMock : [],
  );
  const [productStack, setProductStack] = useState<FoodResponseDto[]>(
    initialProduct ? [initialProduct] : [],
  );

  const resetForNewProduct = () => {
    setQty(1);
    setNote("");
    setSelectedAddons({});
    setSelectedDrinkOption(null);
  };

  useEffect(() => {
    if (initialProduct) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [initialProduct]);

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

  const visibleComplements = useMemo(() => {
    const currentProductId = products?.id ? String(products.id) : "";
    return complements.filter((item) => String(item.id) !== currentProductId);
  }, [complements, products?.id]);

  const goDetails = (item: FoodResponseDto) => {
    setProductStack((prev) => {
      const last = prev[prev.length - 1];
      if (last?.id === item.id) return prev;
      return [...prev, item];
    });

    setProducts(item);
    resetForNewProduct();
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleBack = useCallback(() => {
    if (productStack.length > 1) {
      const next = productStack.slice(0, -1);
      const prevProduct = next[next.length - 1] || null;

      setProductStack(next);
      setProducts(prevProduct);
      resetForNewProduct();
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    navigation(-1);
  }, [navigation, productStack]);

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
  }, [
    products,
    qty,
    note,
    selectedAddonList,
    addonsTotal,
    selectedDrinkOption,
  ]);

  const checkoutItem = useMemo(() => {
    if (!cartItem) return null;
    return {
      id: String(cartItem.id || ""),
      name: String(cartItem.name || ""),
      price: Number(cartItem.price || 0),
      qty: Number(cartItem.qty || 1),
      note: cartItem.note,
      subtitle: cartItem.subtitle,
      image: String(cartItem.img || ""),
    } satisfies CheckoutItem;
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
        } as FoodDetailsCssVars
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

          <button type="button" className={styles.backBtn} onClick={handleBack}>
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
        <div className={styles.purchasePanel}>
          <div className={styles.purchaseTop}>
            <div className={styles.stepper}>
              <button
                className={styles.stepBtn}
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                type="button"
                aria-label="Diminuir quantidade"
              >
                <Minus size={16} />
              </button>

              <div className={styles.stepValue}>{qty}</div>

              <button
                className={styles.stepBtn}
                onClick={() => setQty((v) => v + 1)}
                type="button"
                aria-label="Aumentar quantidade"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className={styles.purchaseTotal}>
              <span>Total</span>
              <strong>{BRL(total)}</strong>
            </div>
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
              <ShoppingCart size={18} />
              <span>Adicionar</span>
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
              <Check size={18} />
              <span>Pedir agora</span>
            </button>
          </div>
        </div>
      </div>

      {visibleComplements.length > 0 ? (
        <div className={styles.complementsSection}>
          <h2 className={styles.sectionTitle}>Complementos</h2>

          <div className={styles.complements}>
            {visibleComplements.map((c) => (
              <article
                key={c.id}
                className={styles.compItem}
                onClick={() => goDetails(c)}
              >
                <img className={styles.compImg} src={c.img} alt={c.name} />
                <div className={styles.compBody}>
                  <div>
                    <h3 className={styles.compTitle}>{c.name}</h3>
                    <p className={styles.compDesc}>{c.desc}</p>
                  </div>
                  <div className={styles.compFooter}>
                    <strong>{BRL(c.price)}</strong>
                    <button
                      type="button"
                      className={styles.compAddBtn}
                      aria-label="Adicionar complemento"
                      onClick={(event) => {
                        event.stopPropagation();
                        addCart({
                          ...c,
                          qty: 1,
                          image: c.img,
                        });
                        toast.success("Produto adicionado ao carrinho", {
                          autoClose: 1500,
                        });
                        activedCart();
                      }}
                    >
                      <Plus size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
