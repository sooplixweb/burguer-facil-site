export interface FoodAddonDto {
  id: string;
  name: string;
  desc?: string;
  price: number;
}

export interface FoodResponseDto {
  id: string;
  name: string;
  desc?: string;
  price: number;
  originalPrice?: number;
  img: string;
  badge?: string;
  category: string;
  addons?: FoodAddonDto[];
};
