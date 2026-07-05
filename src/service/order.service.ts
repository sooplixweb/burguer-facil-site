import type { OrderRequestDto } from "../dtos/request/order-request.dto";
import type { OrderResponseDto } from "../dtos/response/order-response.dto";
import api from "./api";

export const OrderService = {
  create: async (payload: OrderRequestDto): Promise<OrderResponseDto> => {
    const response = await api.post<OrderResponseDto>("/orders", payload);
    return response.data;
  },

  findAll: async (): Promise<OrderResponseDto[]> => {
    const response = await api.get<OrderResponseDto[]>("/orders/find-all");
    return response.data;
  },

  findById: async (id: string): Promise<OrderResponseDto> => {
    const response = await api.get<OrderResponseDto>(`/orders/${id}`);
    return response.data;
  },

  cancel: async (id: string): Promise<OrderResponseDto> => {
    const response = await api.patch<OrderResponseDto>(`/orders/${id}`, {
      status: "CANCELED",
    });
    return response.data;
  },
};
