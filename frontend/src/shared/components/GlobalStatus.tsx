import { useEffect, useRef } from "react";
import { useAppStatusStore } from "../store/appStatusStore.ts";

export default function GlobalStatus() {
  const { type, message, action, clear } = useAppStatusStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (type === "success") {
      timerRef.current = setTimeout(() => clear(), 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [type, message, clear]);

  if (type === "idle") return null;

  const bgMap: Record<string, string> = {
    processing: "bg-primary",
    success: "bg-success",
    error: "bg-danger",
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] ${bgMap[type]} text-white px-4 py-2 flex items-center justify-between gap-3 shadow-lg transition-all duration-200`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {type === "processing" && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {type === "success" && <span className="shrink-0">✓</span>}
        {type === "error" && <span className="shrink-0">✕</span>}
        <span className="text-sm truncate">{message}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="px-2 py-0.5 text-xs bg-white/20 rounded-sm cursor-pointer border-none text-white font-medium hover:bg-white/30"
          >
            {action.label}
          </button>
        )}
        {type !== "processing" && (
          <button
            type="button"
            onClick={clear}
            className="p-0.5 text-white/80 cursor-pointer border-none bg-transparent hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
