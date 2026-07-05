import type { PaymentMethodEnum } from "../enums/payment-method.enum";
import type { OrderItem } from "../../types/order-item.type";

export interface OrderRequestDto {
  paymentMethod: PaymentMethodEnum;
  customerName: string;
  customerPhone: string;
  addressId: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  items: OrderItem[];
}
