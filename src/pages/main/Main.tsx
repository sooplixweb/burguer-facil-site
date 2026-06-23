import type { CSSProperties } from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import Colors from "../../themes/Colors";
import styles from "./Main.module.css";
import { FoodCard } from "../../components/food/FoodCard";
import {
  PlusCircle,
  CupSoda,
  IceCream,
  ShoppingCart,
  HamburgerIcon,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import whatsapp from "../../assets/whatsapp.png";
import whatsappred from "../../assets/whatsappred.png";
import { Header } from "../../components/Header/Header";

import { MainSkeleton } from "../../components/skeletons/main/MainSkeleton";
import type { FoodResponseDto } from "../../dtos/Food-Response.Dto";
import { toast, ToastContainer } from "react-toastify";
import { useStoreStatus } from "../../hooks/useStoreStatus";
import { ProductService } from "../../service/product.service";

type MainCssVars = CSSProperties & {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--highlight": string;
};

const categoryIcons: Record<string, LucideIcon> = {
  Sanduíches: HamburgerIcon,
  Bebidas: CupSoda,
  Adicionais: PlusCircle,
  Sobremesas: IceCream,
};

export default function Main() {
  const [category, setCategory] = useState<string | null>(null);
  const navigation = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<FoodResponseDto[]>([]);
  const [productsError, setProductsError] = useState("");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [cartActived, setCartActivedCart] = useState(false);
  const storeStatus = useStoreStatus();
  const openNow = storeStatus.openNow;

  const handleWatsappClick = () => {
    if (storeStatus.loading) {
      toast.info("Verificando horário de funcionamento...", {
        autoClose: 1800,
      });
      return;
    }

    if (openNow) {
      const phone = "5564999663524";
      const text = "Olá! 👋 Vim pelo site e gostaria de fazer um pedido.";
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
    } else {
      const left = storeStatus.hoursToOpen;
      toast.error(
        `Fechado, abrimos em ${left} ${left === 1 ? "hora" : "horas"}`,
        { autoClose: 2500 }
      );
    }
  };

  function activedCart() {
    setCartActivedCart(true);
    setTimeout(() => {
      setCartActivedCart(false);
    }, 7000);
  }
  useEffect(() => {
    let active = true;

    ProductService.findAll()
      .then((data) => {
        if (!active) return;
        setProducts(data);
        setProductsError("");
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setProductsError("Não foi possível carregar os produtos agora.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);
  const left = storeStatus.hoursToOpen;

  useEffect(() => {
    if (storeStatus.loading) return;

    const KEY = "mb_store_toast_shown_v1";
    try {
      const already = localStorage.getItem(KEY);
      if (!already) {
        if (openNow) {
          toast.success("Estabelecimento aberto", { autoClose: 2500 });
        } else {
          const left = storeStatus.hoursToOpen;
          toast.error(
            `Fechado, abrimos em ${left} ${left === 1 ? "hora" : "horas"}`,
            { autoClose: 2500 }
          );
        }
        localStorage.setItem(KEY, "1");
      }
    } catch {
      // Ignore storage access errors.
    }
  }, [openNow, storeStatus.hoursToOpen, storeStatus.loading]);

  useEffect(() => {
    searchRef.current?.blur();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).map(
      (name) => ({
        name,
        icon: categoryIcons[name],
      })
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.desc || "").toLowerCase();
      const cat = p.category.toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }, [products, search]);

  const groupedProducts = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      (acc[product.category] ||= []).push(product);
      return acc;
    }, {} as Record<string, FoodResponseDto[]>);
  }, [filteredProducts]);

  const goDetails = (item: FoodResponseDto) => {
    navigation(`/foodDetails?id=${item.id}`, {
      state: {
        item,
        productsMock: products,
      },
    });
  };

  return (
    <div
      className={styles.screen}
      style={
        {
          "--bg-primary": Colors.Background.primary,
          "--bg-secondary": Colors.Background.secondary,
          "--text-primary": Colors.Texts.primary,
          "--text-secondary": Colors.Texts.secondary,
          "--highlight": Colors.Highlight.primary,
        } as MainCssVars
      }
    >
      <div className={styles.page}>
        <ToastContainer position="top-right" />
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

        <Header
          search={search}
          searchRef={searchRef}
          onCartClick={() => navigation("/cart")}
          onSearchChange={setSearch}
          onClearSearch={() => {
            setSearch("");
            searchRef.current?.blur();
          }}
        />

        <div className={styles.whatsappFloat} onClick={handleWatsappClick}>
          {openNow ? (
            <img src={openNow ? whatsapp : whatsappred} alt="WhatsApp" />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img src={openNow ? whatsapp : whatsappred} alt="WhatsApp" />
              <span style={{ fontWeight: "500" }}> Fechado</span>
            </div>
          )}
        </div>

        {loading ? (
          <div
            style={
              {
                "--bg-primary": Colors.Background.primary,
                "--bg-secondary": Colors.Background.secondary,
                "--text-primary": Colors.Texts.primary,
                "--text-secondary": Colors.Texts.secondary,
                "--highlight": Colors.Highlight.primary,
              } as MainCssVars
            }
          >
            <MainSkeleton />
          </div>
        ) : (
          <div className={styles.containerSec}>
            <section className={styles.hero}>
              <div className={styles.heroOverlay} />
              <div className={styles.heroCenter}>
                <div className={styles.heroContent}>
                  <div className={styles.heroBadges}>
                    <span
                      className={styles.openBadge}
                      style={
                        openNow
                          ? undefined
                          : {
                              background: "rgba(255, 0, 0, 0.22)",
                              border: "1px solid rgba(255, 0, 0, 0.85)",
                              color: "rgba(255, 140, 140, 0.95)",
                            }
                      }
                    >
                      {openNow ? "ABERTO AGORA" : "FECHADO"}
                    </span>

                    <span className={styles.ratingBadge}>
                      4.8 <Star size={14} />
                    </span>
                    {!openNow && (
                      <span
                        className={styles.openBadgeHors}
                        style={
                          openNow
                            ? undefined
                            : {
                                color: "rgba(255, 255, 255, 0.78)",
                              }
                        }
                      >
                        Abrimos em {left} {left === 1 ? "hora" : "horas"}
                      </span>
                    )}
                  </div>
                  <div>
                    <h1 className={styles.heroTitle}>O Verdadeiro</h1>
                    <h2 className={styles.heroAccent}>Sabor Artesanal</h2>
                  </div>
                  <p className={styles.heroDesc}>
                    Ingredientes selecionados, carnes nobres e aquele molho
                    especial que você só encontra aqui.
                  </p>
                </div>
              </div>
            </section>

            <div className={styles.categoryRow}>
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`${styles.categoryPill} ${
                  category === null ? styles.categoryActive : ""
                }`}
              >
                Todos
              </button>

              {categories.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCategory(item.name)}
                    className={`${styles.categoryPill} ${
                      category === item.name ? styles.categoryActive : ""
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {productsError ? (
              <div className={styles.emptyState}>
                <h2>Produtos indisponíveis</h2>
                <p>{productsError}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <h2>Nenhum produto encontrado</h2>
                <p>
                  Cadastre produtos no admin para eles aparecerem aqui no
                  cardápio.
                </p>
              </div>
            ) : (
              Object.entries(
              category === null
                ? groupedProducts
                : { [category]: groupedProducts[category] }
            ).map(([cat, items = []]) => {
              const Icon = categoryIcons[cat];
              if (!items.length || !Icon) return null;
              return (
                <section key={cat} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionLeft}>
                      <Icon size={20} />
                      <h2 className={styles.sectionTitle}>{cat}</h2>
                    </div>
                    <span className={styles.sectionCount}>
                      <span className={styles.sectionQuant}>
                        {items.length}
                      </span>
                      <span> opções</span>
                    </span>
                  </div>

                  <div
                    className={cat === "Bebidas" ? styles.grid3 : styles.grid4}
                  >
                    {items.map((item) => (
                      <FoodCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        desc={item.desc}
                        price={item.price}
                        originalPrice={item.originalPrice}
                        img={item.img}
                        badge={item.badge}
                        onDetails={() => goDetails(item)}
                        functions={() => activedCart()}
                      />
                    ))}
                  </div>
                </section>
              );
            })
            )}
          </div>
        )}
        <footer className={styles.footer}>
          <span className={styles.footerText}>
            Desenvolvido por Anderson Mendes
          </span>
          <a
            className={styles.footerHandle}
            href="https://instagram.com/andersonmends__"
            target="_blank"
            rel="noreferrer"
          >
            @AndersonMends__
          </a>
        </footer>
      </div>
    </div>
  );
}
