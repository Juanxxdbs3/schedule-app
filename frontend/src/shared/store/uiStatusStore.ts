import { create } from "zustand";

export type UiStatus = "idle" | "loading" | "saving" | "success" | "error";

const DEFAULT_AUTO_HIDE_MS = 3000;

interface UiStatusState {
  status: UiStatus;
  message: string | null;
  setStatus: (status: UiStatus, message?: string, autoHideMs?: number) => void;
  clear: () => void;
}

let timer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutoHide(clearStatus: () => void, autoHideMs?: number) {
  if (timer) clearTimeout(timer);
  if (autoHideMs !== undefined && autoHideMs > 0) {
    timer = setTimeout(clearStatus, autoHideMs);
  }
}

export const useUiStatusStore = create<UiStatusState>((set) => ({
  status: "idle",
  message: null,

  setStatus: (status, message = null, autoHideMs) => {
    const hideMs =
      autoHideMs !== undefined
        ? autoHideMs
        : status === "success" || status === "error"
          ? DEFAULT_AUTO_HIDE_MS
          : undefined;
    scheduleAutoHide(() => set({ status: "idle", message: null }), hideMs);
    set({ status, message });
  },

  clear: () => {
    if (timer) clearTimeout(timer);
    set({ status: "idle", message: null });
  },
}));