import type { AddressRequestDto } from "../dtos/request/address-request.dto";
import type { AddressResponseDto } from "../dtos/response/address-response.dto";
import api from "./api";

export const AddressService = {
  create: async (payload: AddressRequestDto): Promise<AddressResponseDto> => {
    const response = await api.post<AddressResponseDto>("/addresses", payload);
    return response.data;
  },

  findAll: async (): Promise<AddressResponseDto[]> => {
    const response = await api.get<AddressResponseDto[]>("/addresses/find-all");
    return response.data;
  },

  findById: async (id: string): Promise<AddressResponseDto> => {
    const response = await api.get<AddressResponseDto>(`/addresses/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    payload: AddressRequestDto,
  ): Promise<AddressResponseDto> => {
    const response = await api.put<AddressResponseDto>(
      `/addresses/${id}`,
      payload,
    );
    return response.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/addresses/${id}`);
    return response.data;
  },
};
