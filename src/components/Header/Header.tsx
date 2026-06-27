import { useEffect, useState, type CSSProperties, type RefObject } from "react";
import { Search, ShoppingCart, X } from "lucide-react";
import styles from "./Header.module.css";
import { useNavigate } from "react-router-dom";

type HeaderProps = {
  search?: string;
  searchRef?: RefObject<HTMLInputElement | null>;
  cartCount?: number;
  searchPlaceholder?: string;
  showSearch?: boolean;
  onCartClick: () => void;
  onSearchChange?: (value: string) => void;
  onClearSearch?: () => void;
};

const headerStyle: CSSProperties = {
  width: "100%",
  padding: "14px 14px 12px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
};

const headerContentStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 44px",
  gridTemplateAreas: '"brand cart" "auth auth"',
  alignItems: "center",
  gap: "10px 8px",
  width: "100%",
  marginBottom: 10,
};

const desktopHeaderContentStyle: CSSProperties = {
  ...headerContentStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto 44px",
  gridTemplateAreas: '"brand auth cart"',
};

const brandStyle: CSSProperties = {
  gridArea: "brand",
  display: "flex",
  minWidth: 0,
  alignItems: "center",
  gap: 10,
};

const brandLogoStyle: CSSProperties = {
  width: 38,
  height: 38,
  flex: "0 0 38px",
  borderRadius: "50%",
  border: "2px solid #ffd400",
  objectFit: "cover",
  display: "block",
};

const brandNameStyle: CSSProperties = {
  minWidth: 0,
  whiteSpace: "nowrap",
  color: "#fff",
  fontSize: 18,
  fontWeight: 800,
  lineHeight: 1.1,
};

const authActionsStyle: CSSProperties = {
  gridArea: "auth",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  width: "100%",
  gap: 8,
};

const desktopAuthActionsStyle: CSSProperties = {
  ...authActionsStyle,
  width: 224,
};

const authButtonStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 36,
  padding: "0 10px",
  border: "1px solid rgba(255, 255, 255, 0.16)",
  borderRadius: 8,
  background: "#f4f4f4",
  color: "#111",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const authPrimaryStyle: CSSProperties = {
  ...authButtonStyle,
  borderColor: "#ffd400",
  background: "#ffd400",
};

const cartButtonStyle: CSSProperties = {
  gridArea: "cart",
  justifySelf: "end",
  position: "relative",
  display: "grid",
  width: 44,
  height: 44,
  placeItems: "center",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 16,
  background: "rgba(255, 255, 255, 0.05)",
  color: "rgba(255, 255, 255, 0.9)",
  cursor: "pointer",
};

const cartBadgeStyle: CSSProperties = {
  position: "absolute",
  top: -8,
  right: -7,
  display: "grid",
  minWidth: 19,
  height: 19,
  placeItems: "center",
  padding: "0 6px",
  borderRadius: 999,
  background: "#ffd400",
  color: "#111",
  fontSize: 11,
  fontWeight: 900,
  lineHeight: 1,
};

const searchWrapStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  minHeight: 48,
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  border: "1px solid rgba(255, 255, 255, 0.09)",
  borderRadius: 18,
  background: "rgba(255, 255, 255, 0.05)",
  color: "rgba(255, 255, 255, 0.72)",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: 0,
  outline: 0,
  background: "transparent",
  color: "#fff",
  fontSize: 14,
};

const searchClearStyle: CSSProperties = {
  display: "inline-flex",
  width: 24,
  height: 24,
  flex: "0 0 24px",
  alignItems: "center",
  justifyContent: "center",
  border: 0,
  background: "transparent",
  color: "rgba(255, 255, 255, 0.72)",
  cursor: "pointer",
};

function useDesktopHeader() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 641px)").matches;
  });

  useEffect(() => {
    const query = window.matchMedia("(min-width: 641px)");
    const update = () => setIsDesktop(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function Header({
  search = "",
  searchRef,
  cartCount = 2,
  searchPlaceholder = "Buscar itens...",
  showSearch = true,
  onCartClick,
  onSearchChange,
  onClearSearch,
}: HeaderProps) {
  const isDesktopHeader = useDesktopHeader();
  const navigate = useNavigate();

  return (
    <header className={styles.header} style={headerStyle}>
      <div
        className={styles.headerContent}
        style={isDesktopHeader ? desktopHeaderContentStyle : headerContentStyle}
      >
        <div className={styles.brand} style={brandStyle}>
          <img
            className={styles.brandLogo}
            style={brandLogoStyle}
            src="/hamburguer.png"
            alt="Logo Mais Burguer"
          />
          <span className={styles.brandName} style={brandNameStyle}>
            Mais Burguer
          </span>
        </div>

        <div
          className={styles.authActions}
          style={isDesktopHeader ? desktopAuthActionsStyle : authActionsStyle}
        >
          <button
            type="button"
            className={`${styles.authButton} ${styles.authPrimary}`}
            style={authPrimaryStyle}
            onClick={() => navigate("/login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={styles.authButton}
            style={authButtonStyle}
            onClick={() => navigate("/register")}
          >
            Criar conta
          </button>
        </div>

        <button
          className={styles.cartButton}
          style={cartButtonStyle}
          type="button"
          onClick={onCartClick}
          aria-label="Abrir carrinho"
        >
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className={styles.cartBadge} style={cartBadgeStyle}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {showSearch && (
        <div className={styles.searchInputWrap} style={searchWrapStyle}>
          <Search size={18} />
          <input
            ref={searchRef}
            className={styles.searchInput}
            style={searchInputStyle}
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            inputMode="search"
          />
          {search && (
            <button
              type="button"
              className={styles.searchClear}
              style={searchClearStyle}
              onClick={onClearSearch}
              aria-label="Limpar busca"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}
    </header>
  );
}
