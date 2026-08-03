import { create } from "zustand";
import api from "../utils/api";

const usePricingStore = create((set) => ({
  config: null,
  loading: false,
  error: null,
  saving: false,

  fetchPricingConfig: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/pricing-config");
      set({ config: res.data.data, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || "Não foi possível carregar a configuração de preços",
      });
    }
  },

  updatePricingConfig: async (data) => {
    set({ saving: true, error: null });
    try {
      const res = await api.put("/pricing-config", data);
      set({ config: res.data.data, saving: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Não foi possível atualizar a configuração de preços";
      set({ saving: false, error: message });
      return { success: false, error: message };
    }
  },
}));

export default usePricingStore;
