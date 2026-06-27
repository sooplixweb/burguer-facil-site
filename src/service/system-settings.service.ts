import type { SystemSettingsResponse } from "../dtos/response/system-settings-response.dto";
import api from "./api";

export const SystemSettingsService = {
  orderingAvailability: async (): Promise<SystemSettingsResponse> => {
    const response = await api.get<SystemSettingsResponse>(
      "/system-settings/ordering-availability",
    );
    return response.data;
  },
};
