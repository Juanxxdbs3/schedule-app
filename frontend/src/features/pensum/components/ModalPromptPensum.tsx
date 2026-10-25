import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import Modal from "../../../shared/components/Modal.tsx";
import { copiarTexto } from "../../../shared/utils/copiarTexto.ts";
import { useUiStatusStore } from "../../../shared/store/uiStatusStore.ts";
import { PROMPT_GENERAR_PENSUM } from "../constants/promptGenerarPensum.ts";

interface ModalPromptPensumProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalPromptPensum({ isOpen, onClose }: ModalPromptPensumProps) {
  const [copiado, setCopiado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setCopiado(false);
    }
  }, [isOpen]);

  async function handleCopiar() {
    const ok = await copiarTexto(PROMPT_GENERAR_PENSUM);

    if (!ok) {
      useUiStatusStore
        .getState()
        .setStatus("error", "No se pudo copiar el prompt. Selecciona el texto y cópialo a mano.");
      return;
    }

    setCopiado(true);
    useUiStatusStore.getState().setStatus("success", "Prompt copiado al portapapeles");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopiado(false);
      timerRef.current = null;
    }, 2000);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cómo generar tu JSON">
      <div className="flex flex-col gap-3 pr-1">
        <ol className="list-decimal pl-5 m-0 flex flex-col gap-1 text-sm text-muted">
          <li>Copia el prompt de abajo.</li>
          <li>
            Pégalo en una IA (ChatGPT, Gemini, Claude...) y adjunta tu plan de estudios: imagen,
            captura, PDF, Word o texto.
          </li>
          <li>
            Copia o descarga el JSON que te devuelva y pégalo o súbelo aquí, en "Cargar pensum".
          </li>
        </ol>

        <pre className="m-0 bg-bg border border-border rounded-md p-3 text-xs font-mono whitespace-pre-wrap break-words max-h-[40vh] overflow-y-auto overscroll-contain touch-pan-y text-text">
          {PROMPT_GENERAR_PENSUM}
        </pre>

        <button
          type="button"
          onClick={handleCopiar}
          className={`btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-none rounded-md cursor-pointer text-white ${
            copiado ? "bg-success" : "bg-primary"
          }`}
        >
          {copiado ? (
            <>
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              ¡Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" aria-hidden="true" />
              Copiar prompt
            </>
          )}
        </button>

        <section className="border-t border-border pt-3">
          <h3 className="text-sm font-semibold m-0 mb-2">Cuando la IA responda</h3>
          <ul className="list-disc pl-5 m-0 flex flex-col gap-1 text-sm text-muted">
            <li>Copia solo el bloque JSON, no las Notas.</li>
            <li>Lee las Notas: indican códigos inventados o prerrequisitos inciertos.</li>
            <li>
              Si la app marca error, dirá qué materia falla: pídele a la IA que corrija exactamente
              eso.
            </li>
            <li>
              Luego de cargar puedes ajustar estados en el dashboard y añadir materias con
              "+ Agregar materia".
            </li>
          </ul>
        </section>
      </div>
    </Modal>
  );
}
