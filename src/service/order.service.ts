import type { OrderRequestDto } from "../dtos/request/order-request.dto";
import type { OrderResponseDto } from "../dtos/response/order-response.dto";
import { apiRequest } from "./api";

export const OrderService = {
  create: async (payload: OrderRequestDto): Promise<OrderResponseDto> => {
    return apiRequest<OrderResponseDto>("/orders", {
      method: "POST",
      body: payload,
    });
  },

  findAll: async (): Promise<OrderResponseDto[]> => {
    return apiRequest<OrderResponseDto[]>("/orders/find-all");
  },

  findById: async (id: string): Promise<OrderResponseDto> => {
    return apiRequest<OrderResponseDto>(`/orders/${id}`);
  },
};
