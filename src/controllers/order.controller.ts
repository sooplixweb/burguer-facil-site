import type { OrderRequestDto } from "../dtos/request/order-request.dto";
import type { OrderResponseDto } from "../dtos/response/order-response.dto";
import { OrderService } from "../service/order.service";

export const OrderController = {
  create: async (payload: OrderRequestDto): Promise<OrderResponseDto> => {
    return OrderService.create(payload);
  },

  findById: async (id: string): Promise<OrderResponseDto | null> => {
    return OrderService.findById(id);
  },

  cancel: async (id: string): Promise<OrderResponseDto> => {
    return OrderService.cancel(id);
  },
};
