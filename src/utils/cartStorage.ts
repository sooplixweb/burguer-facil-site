export type StoredCartItem = {
  id?: string;
  name?: string;
  price?: number;
  qty?: number;
  quantity?: number;
  note?: string;
  subtitle?: string;
  image?: string;
  img?: string;
  badge?: string;
  [key: string]: unknown;
};

export function makeCartMergeKey(item: StoredCartItem) {
  const id = String(item.id ?? "").trim();
  if (id) return `id:${id}`;

  const name = String(item.name ?? "").trim().toLowerCase();
  return `name:${name || "unknown"}`;
}

export function addCart(item: StoredCartItem | null) {
  if (!item) return;

  const raw = localStorage.getItem("food");
  let items: StoredCartItem[] = [];

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      items = Array.isArray(parsed)
        ? parsed.filter(Boolean)
        : [parsed].filter(Boolean);
    } catch {
      items = [];
    }
  }

  const qtyToAddRaw = Number(item.qty ?? item.quantity ?? 1);
  const qtyToAdd =
    Number.isFinite(qtyToAddRaw) && qtyToAddRaw > 0 ? qtyToAddRaw : 1;

  const mergeKey = makeCartMergeKey(item);
  const index = items.findIndex((product) => makeCartMergeKey(product) === mergeKey);

  if (index >= 0) {
    const current = items[index];
    const prevQty = Number(current.qty ?? current.quantity ?? 1);

    items[index] = {
      ...current,
      ...item,
      qty: prevQty + qtyToAdd,
      image: String(item.image ?? item.img ?? current.image ?? current.img ?? ""),
      img: String(item.img ?? item.image ?? current.img ?? current.image ?? ""),
    };
  } else {
    items.push({
      ...item,
      qty: qtyToAdd,
      image: String(item.image ?? item.img ?? ""),
      img: String(item.img ?? item.image ?? ""),
    });
  }

  localStorage.setItem("food", JSON.stringify(items));
}
