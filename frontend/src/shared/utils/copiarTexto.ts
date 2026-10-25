/**
 * Copia texto al portapapeles con fallback para contextos no seguros
 * (http en LAN, WebViews viejos) donde `navigator.clipboard` no existe.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Permisos denegados o contexto no seguro: intenta el fallback.
    }
  }
  return copiarConTextarea(texto);
}

function copiarConTextarea(texto: string): boolean {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = texto;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);

  let copiado = false;
  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, texto.length);
    copiado = document.execCommand("copy");
  } catch {
    copiado = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return copiado;
}
