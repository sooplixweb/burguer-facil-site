import { useMemo, useRef, useState } from "react";
import {
  Beef,
  CupSoda,
  Heart,
  Plus,
  Search,
  ShoppingBasket,
  Star,
} from "lucide-react";
import styles from "./Favorites.module.css";

const favorites = [
  {
    name: "Monster Bacon",
    desc: "Hambúrguer artesanal 160g, cheddar, bacon, alface, tomate e molho especial.",
    price: "R$ 34,90",
    rating: "4,8",
    category: "Sanduíches",
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Classic Salad",
    desc: "Pão brioche, blend 160g, queijo, alface, tomate e molho especial.",
    price: "R$ 28,90",
    rating: "4,7",
    category: "Sanduíches",
    img: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Combo Artesanal",
    desc: "1 Sanduíche artesanal, 1 batata média e 1 bebida.",
    price: "R$ 54,90",
    rating: "4,9",
    category: "Combos",
    img: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Batata Cheddar",
    desc: "Batata crocante com cheddar cremoso e bacon em cubos.",
    price: "R$ 16,90",
    rating: "4,6",
    category: "Bebidas",
    img: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=700&q=80",
  },
];

const filters = [
  { label: "Todos", icon: null },
  { label: "Sanduíches", icon: Beef },
  { label: "Bebidas", icon: CupSoda },
  { label: "Combos", icon: ShoppingBasket },
];

export default function Favorites() {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  const filteredFavorites = useMemo(() => {
    const q = search.trim().toLowerCase();

    return favorites.filter((item) => {
      const matchesFilter = filter === "Todos" || item.category === filter;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <h1 className={styles.title}>Favoritos</h1>

        <div className={styles.searchInputWrap}>
          <Search size={20} />
          <input
            ref={searchRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar favoritos..."
            autoComplete="off"
            inputMode="search"
          />
        </div>

        <div className={styles.filters}>
          {filters.map((item) => {
            const Icon = item.icon;
            const active = filter === item.label;

            return (
              <button
                key={item.label}
                className={active ? styles.activeFilter : styles.filterButton}
                type="button"
                onClick={() => setFilter(item.label)}
              >
                {Icon && <Icon size={18} />}
                {item.label}
              </button>
            );
          })}
        </div>

        <section className={styles.grid}>
          {filteredFavorites.map((item) => (
            <article className={styles.favoriteCard} key={item.name}>
              <div className={styles.imageWrap}>
                <img src={item.img} alt={item.name} />
                <button type="button" aria-label={`Remover ${item.name}`}>
                  <Heart size={20} fill="currentColor" />
                </button>
              </div>

              <div className={styles.cardBody}>
                <h2>{item.name}</h2>
                <p>{item.desc}</p>
                <div className={styles.cardBottom}>
                  <strong>{item.price}</strong>
                  <span>
                    <Star size={15} fill="currentColor" />
                    {item.rating}
                  </span>
                  <button type="button" aria-label={`Adicionar ${item.name}`}>
                    <Plus size={24} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className={styles.suggestion}>
          <h2>Você também pode gostar</h2>
          <article className={styles.suggestionCard}>
            <img
              src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&q=80"
              alt="BBQ Burger"
            />
            <div>
              <h3>BBQ Burger</h3>
              <p>Hambúrguer 160g, queijo, onion rings, molho BBQ e alface.</p>
              <span>
                <strong>R$ 32,90</strong>
                <Star size={15} fill="currentColor" />
                4,7
              </span>
            </div>
            <button type="button" aria-label="Adicionar BBQ Burger">
              <Plus size={24} />
            </button>
          </article>
        </section>
      </main>
    </div>
  );
}
