import type { FoodResponseDto } from "../dtos/Food-Response.Dto";
import { API_BASE_URL, apiRequest } from "./api";

type ProductImageResponse = {
  id: string;
  fileName: string;
  url: string;
  isPrimary: boolean;
};

type ProductAddonResponse = {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  isActive?: boolean;
};

type ProductResponse = {
  id: string;
  name: string;
  description?: string;
  category: "FOOD" | "DRINK" | "ADDON" | "DESSERT";
  price: string | number;
  promoPrice?: string | number;
  isActive?: "ACTIVED" | "DISABLED";
  stockEnabled?: boolean;
  stock?: number;
  images?: ProductImageResponse[];
  addons?: ProductAddonResponse[];
};

const CATEGORY_LABELS: Record<ProductResponse["category"], string> = {
  FOOD: "Sanduíches",
  DRINK: "Bebidas",
  ADDON: "Adicionais",
  DESSERT: "Sobremesas",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80";

function moneyToNumber(value?: string | number) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveImageUrl(url?: string) {
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}/${url.replace(/^\/+/, "")}`;
}

function mapProduct(product: ProductResponse): FoodResponseDto {
  const basePrice = moneyToNumber(product.price) ?? 0;
  const promoPrice = moneyToNumber(product.promoPrice);
  const primaryImage =
    product.images?.find((image) => image.isPrimary) || product.images?.[0];

  return {
    id: product.id,
    name: product.name,
    desc: product.description || "",
    price: promoPrice ?? basePrice,
    originalPrice:
      promoPrice !== undefined && promoPrice < basePrice ? basePrice : undefined,
    badge:
      promoPrice !== undefined && promoPrice < basePrice ? "PROMOÇÃO" : undefined,
    img: resolveImageUrl(primaryImage?.url),
    category: CATEGORY_LABELS[product.category] || "Outros",
    addons: (product.addons || [])
      .filter((addon) => addon.isActive !== false)
      .map((addon) => ({
        id: addon.id,
        name: addon.name,
        desc: addon.description || "",
        price: moneyToNumber(addon.price) ?? 0,
      })),
  };
}

export const ProductService = {
  findAll: async (): Promise<FoodResponseDto[]> => {
    const products = await apiRequest<ProductResponse[]>("/products");
    return products.map(mapProduct);
  },

  findOne: async (id: string): Promise<FoodResponseDto> => {
    const product = await apiRequest<ProductResponse>(`/products/${id}`);
    return mapProduct(product);
  },
};
