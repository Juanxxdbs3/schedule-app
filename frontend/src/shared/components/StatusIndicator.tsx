import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useUiStatusStore } from "../store/uiStatusStore.ts";

const STYLE_BY_STATUS: Record<string, string> = {
  loading: "bg-primary text-white",
  saving: "bg-primary text-white",
  success: "bg-success text-white",
  error: "bg-danger text-white",
};

export default function StatusIndicator() {
  const { status, message } = useUiStatusStore();

  const visible = status !== "idle";
  const Icon = status === "success" ? CheckCircle2 : status === "error" ? XCircle : Loader2;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-[9999] flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-lg transition-all duration-200 ${
        STYLE_BY_STATUS[status] ?? "bg-primary text-white"
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${status === "loading" || status === "saving" ? "animate-spin" : ""}`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}