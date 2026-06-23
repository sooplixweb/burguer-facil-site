import { Plus } from "lucide-react";
import styles from "./FoodCard.module.css";
import { toast } from "react-toastify";
import Colors from "../../themes/Colors";

type FoodCardProps = {
  id?: string;
  name?: string;
  desc?: string;
  price?: number;
  originalPrice?: number;
  img?: string;
  badge?: string;
  onDetails?: () => void;
  functions?: () => void;
};

function formatMoney(value?: number) {
  if (value === undefined) return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function makeMergeKey(item: any) {
  if (item?.id !== undefined && item?.id !== null && String(item.id).trim() !== "") {
    return `id:${String(item.id)}`;
  }
  const name = String(item?.name ?? "").trim().toLowerCase();
  return `name:${name || "unknown"}`;
}

export function addCart(item: any) {
  const raw = localStorage.getItem("food");
  let arr: any[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed].filter(Boolean);
    } catch {
      arr = [];
    }
  }

  const qtyToAddRaw = Number(item?.qty ?? 1);
  const qtyToAdd = Number.isFinite(qtyToAddRaw) && qtyToAddRaw > 0 ? qtyToAddRaw : 1;

  const mergeKey = makeMergeKey(item);
  const idx = arr.findIndex((p) => makeMergeKey(p) === mergeKey);

  if (idx >= 0) {
    const prevQty = Number(arr[idx]?.qty ?? arr[idx]?.quantity ?? 1);
    arr[idx] = {
      ...arr[idx],
      ...item,
      qty: prevQty + qtyToAdd,
      image: String(item?.image ?? item?.img ?? arr[idx]?.image ?? arr[idx]?.img ?? ""),
      img: String(item?.img ?? item?.image ?? arr[idx]?.img ?? arr[idx]?.image ?? ""),
    };
  } else {
    arr.push({
      ...item,
      qty: qtyToAdd,
      image: String(item?.image ?? item?.img ?? ""),
      img: String(item?.img ?? item?.image ?? ""),
    });
  }

  localStorage.setItem("food", JSON.stringify(arr));
}

export function FoodCard({
  id,
  name,
  functions,
  desc,
  price,
  originalPrice,
  img,
  badge,
  onDetails,
}: FoodCardProps) {
  const oldPrice =
    originalPrice !== undefined && price !== undefined && originalPrice > price
      ? originalPrice
      : undefined;

  const item = {
    id,
    name,
    price,
    img,
    badge,
    qty: 1,
    image: img,
  };

  return (
    <article
      onClick={onDetails}
      className={styles.card}
      style={
        {
          ["--bestSellerBg" as any]: Colors.Status.bestSellerBg,
          ["--bestSellerBorder" as any]: Colors.Status.bestSellerBorder,
          ["--bestSellerText" as any]: Colors.Status.bestSellerText,
          ["--bestSellerGlow" as any]: Colors.Status.bestSellerGlow,
        } as React.CSSProperties
      }
    >
      {!!badge && <div className={styles.badge}>{badge}</div>}

      <div className={styles.imgWrap}>
        <img src={img} alt={name} className={styles.img} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addCart(item);
            toast.success("Produto adicionado ao carrinho", { autoClose: 1500 });
            functions?.();
          }}
          className={styles.addBtn}
          aria-label="Adicionar ao carrinho"
        >
          <Plus size={22} />
        </button>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.desc}>{desc}</p>

        <div className={styles.bottom}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {oldPrice !== undefined && (
              <span className={styles.minPrice}>{formatMoney(oldPrice)}</span>
            )}
            <span className={styles.price}>{formatMoney(price)}</span>
          </div>
          <button type="button" className={styles.button} onClick={onDetails}>
            Ver detalhes
          </button>
        </div>
      </div>
    </article>
  );
}
