import { create } from "zustand";

export type StatusType = "idle" | "processing" | "success" | "error";

export interface StatusAction {
  label: string;
  onClick: () => void;
}

interface AppStatusState {
  type: StatusType;
  message: string | null;
  action: StatusAction | null;
  show: (type: StatusType, message: string, action?: StatusAction | null) => void;
  showProcessing: (message: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string, action?: StatusAction | null) => void;
  clear: () => void;
}

export const useAppStatusStore = create<AppStatusState>((set) => ({
  type: "idle",
  message: null,
  action: null,

  show: (type, message, action = null) => set({ type, message, action }),

  showProcessing: (message) => set({ type: "processing", message, action: null }),

  showSuccess: (message) => set({ type: "success", message, action: null }),

  showError: (message, action = null) => set({ type: "error", message, action }),

  clear: () => set({ type: "idle", message: null, action: null }),
}));
