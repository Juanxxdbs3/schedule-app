import { useState, useMemo, useEffect } from "react";
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { CheckCircle2, XCircle, Hand, Download, FileImage } from "lucide-react";
import type { Horario, Bloque, DiaSemana } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import type { Pensum } from "../../pensum/types.ts";
import type { ModoHorario } from "../types.ts";
import { useHorarioStore } from "../store/horarioStore.ts";
import { generarFilasHora } from "../utils/generarFilasHora.ts";
import { generarSvgHorario } from "../utils/exportHorarioSvg.ts";
import { filtrarMaterias } from "../../../shared/utils/filterMaterias.ts";
import Grid from "./Grid.tsx";
import ContadorCreditos from "./ContadorCreditos.tsx";
import EditBloqueModal from "./EditBloqueModal.tsx";
import DropZone from "./DropZone.tsx";
import MateriaBlock from "../../pensum/components/MateriaBlock.tsx";

const DIAS_COMPLETO: DiaSemana[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DOMINGO_STORAGE_KEY = "horario-app:domingo-visible";

class MousePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown",
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => nativeEvent.pointerType === "mouse",
    },
  ] as const;
}

interface HorarioScreenProps {
  modo: ModoHorario;
  horario: Horario;
  pensum: Pensum;
  onModoChange: (modo: ModoHorario) => void;
  onGuardar?: () => void;
  onEliminar?: () => void;
  guardarLoading?: boolean;
  eliminando?: boolean;
  eliminarDisabled?: boolean;
}

export default function HorarioScreen({ modo, horario, pensum, onModoChange, onGuardar, onEliminar, guardarLoading, eliminando, eliminarDisabled }: HorarioScreenProps) {
  const addBloqueLocal = useHorarioStore((s) => s.addBloqueLocal);
  const removeBloqueLocal = useHorarioStore((s) => s.removeBloqueLocal);
  const updateBloqueLocal = useHorarioStore((s) => s.updateBloqueLocal);
  const moveBloqueLocal = useHorarioStore((s) => s.moveBloqueLocal);
  const expandBloqueDown = useHorarioStore((s) => s.expandBloqueDown);
  const expandBloqueUp = useHorarioStore((s) => s.expandBloqueUp);
  const shrinkBloqueTop = useHorarioStore((s) => s.shrinkBloqueTop);
  const shrinkBloqueBottom = useHorarioStore((s) => s.shrinkBloqueBottom);
  const marcarResultado = useHorarioStore((s) => s.marcarResultado);
  const storeHorario = useHorarioStore((s) => s.horario);

  function aMinutos(h: string): number {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  }

  function fmt(m: number): string {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }

  function generarId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  const [activeMateria, setActiveMateria] = useState<Materia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editBloque, setEditBloque] = useState<Bloque | null>(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroSemestre, setFiltroSemestre] = useState<number | "">("");
  const [filtroCreditos, setFiltroCreditos] = useState<number | "">("");
  const [localActivos, setLocalActivos] = useState<Set<string>>(new Set());
  const [domingoVisible, setDomingoVisible] = useState(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(DOMINGO_STORAGE_KEY) : null;
    return stored !== "false";
  });

  useEffect(() => {
    localStorage.setItem(DOMINGO_STORAGE_KEY, String(domingoVisible));
  }, [domingoVisible]);

  const sensors = useSensors(
    useSensor(MousePointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const bloques = storeHorario?.bloques ?? [];
  const resultados = storeHorario?.resultados ?? {};
  const materiasTodas = pensum.materias;
  const todasResultadas = bloques.length > 0 && [...new Set(bloques.map((b) => b.materiaCodigo))].every((c) => resultados[c]);
  const codigosEnHorario = new Set(bloques.map((b) => b.materiaCodigo));

  const esEdicion = modo === "edicion";
  const diasVisibles = useMemo(() => {
    if (esEdicion) return DIAS_COMPLETO;
    const conMaterias = new Set(bloques.map((b) => b.dia));
    return DIAS_COMPLETO.filter((d) => conMaterias.has(d));
  }, [esEdicion, bloques]);

  const minWidthGrid = useMemo(() => {
    const count = domingoVisible ? diasVisibles.length : diasVisibles.filter((d) => d !== "domingo").length;
    return Math.max(600, 60 + count * 110);
  }, [diasVisibles, domingoVisible]);

  const materiasEnPool = useMemo(() => {
    const disponibles = materiasTodas
      .filter((m) => {
        const estadoEfectivo = localActivos.has(m.codigo) ? "activo" : m.estado;
        if (estadoEfectivo !== "activo") return false;
        if (codigosEnHorario.has(m.codigo)) return false;
        return true;
      })
      .map((m) => ({
        ...m,
        estado: (localActivos.has(m.codigo) ? "activo" : m.estado) as typeof m.estado,
      }));
    if (!filtroNombre && filtroSemestre === "" && filtroCreditos === "") return disponibles;
    return filtrarMaterias(disponibles, filtroNombre, filtroSemestre, filtroCreditos);
  }, [materiasTodas, codigosEnHorario, localActivos, filtroNombre, filtroSemestre, filtroCreditos]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "materia") setActiveMateria(data.materia as Materia);
    if (data?.type === "placed") setActiveMateria(data.materia as Materia);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveMateria(null);
    setError(null);
    const { active, over } = event;
    if (!over) return;
    const ad = active.data.current;
    const od = over.data.current;

    if (ad?.type === "materia" && od?.type === "cell") {
      const materia = ad.materia as Materia;
      const bloque: Bloque = {
        id: generarId(),
        materiaCodigo: materia.codigo,
        dia: od.dia,
        horaInicio: od.horaInicio,
        horaFin: od.horaFin,
      };
      const result = addBloqueLocal(bloque, materiasTodas);
      if (result.ok) setLocalActivos((p) => { const n = new Set(p); n.delete(materia.codigo); return n; });
      if (!result.ok) setError(result.error);
    }

    if (ad?.type === "placed" && od?.type === "cell") {
      const oldBloque = ad.bloque as Bloque;
      const oldDuration = aMinutos(oldBloque.horaFin) - aMinutos(oldBloque.horaInicio);
      const newBloque: Bloque = {
        ...oldBloque,
        dia: od.dia as DiaSemana,
        horaInicio: od.horaInicio as string,
        horaFin: fmt(aMinutos(od.horaInicio as string) + oldDuration),
      };
      const result = moveBloqueLocal(newBloque, materiasTodas);
      if (!result.ok) setError(result.error);
    }

    if (ad?.type === "placed" && od?.type === "pool") {
      const bloque = ad.bloque as Bloque;
      const materia = materiasTodas.find((m) => m.codigo === bloque.materiaCodigo);
      if (materia?.estado === "cursado") {
        setError(`No puedes quitar '${bloque.materiaCodigo}' porque ya está cursada. Deshaz su resultado primero.`);
        return;
      }
      removeBloqueLocal(bloque.id);
      setLocalActivos((p) => new Set(p).add(bloque.materiaCodigo));
    }
  }

  function handleRemoveBloque(bloqueId: string) {
    const bloque = bloques.find((b) => b.id === bloqueId);
    if (!bloque) return;
    const materia = materiasTodas.find((m) => m.codigo === bloque.materiaCodigo);
    if (materia?.estado === "cursado") {
      setError(`No puedes quitar '${bloque.materiaCodigo}' porque ya está cursada. Deshaz su resultado primero.`);
      return;
    }
    removeBloqueLocal(bloqueId);
    setLocalActivos((p) => new Set(p).add(bloque.materiaCodigo));
  }

  function handleEditSave(bloqueId: string, data: { nombrePersonalizado: string; profesor: string; salon: string }) {
    updateBloqueLocal(bloqueId, data);
  }

  function handleExpandDown(bloqueId: string) {
    const r = expandBloqueDown(bloqueId, materiasTodas);
    if (!r.ok && r.error) setError(r.error);
  }

  function handleExpandUp(bloqueId: string) {
    const r = expandBloqueUp(bloqueId, materiasTodas);
    if (!r.ok && r.error) setError(r.error);
  }

  function handleShrinkTop(bloqueId: string) {
    const r = shrinkBloqueTop(bloqueId, materiasTodas);
    if (!r.ok && r.error) setError(r.error);
  }

  function handleShrinkBottom(bloqueId: string) {
    const r = shrinkBloqueBottom(bloqueId, materiasTodas);
    if (!r.ok && r.error) setError(r.error);
  }

  function handleDuplicateBloque(bloque: Bloque) {
    const duracion = aMinutos(bloque.horaFin) - aMinutos(bloque.horaInicio);
    const filas = generarFilasHora(horario.unidadHoraMinutos);

    function celdaOcupada(dia: DiaSemana, inicio: string): boolean {
      const mIni = aMinutos(inicio);
      const mFin = mIni + duracion;
      return bloques.some((b) => {
        if (b.id === bloque.id) return false;
        if (b.dia !== dia) return false;
        const bIni = aMinutos(b.horaInicio);
        const bFin = aMinutos(b.horaFin);
        return mIni < bFin && mFin > bIni;
      });
    }

    function colocarEn(dia: DiaSemana, inicio: string): Bloque | null {
      const fin = aMinutos(inicio) + duracion;
      if (fin > 22 * 60) return null;
      if (celdaOcupada(dia, inicio)) return null;
      const nuevo: Bloque = {
        id: generarId(),
        materiaCodigo: bloque.materiaCodigo,
        dia,
        horaInicio: inicio,
        horaFin: fmt(fin),
        nombrePersonalizado: bloque.nombrePersonalizado,
        profesor: bloque.profesor,
        salon: bloque.salon,
      };
      const result = addBloqueLocal(nuevo, materiasTodas);
      return result.ok ? nuevo : null;
    }

    const diaActual = bloque.dia;
    const endM = aMinutos(bloque.horaFin);
    const startIdx = filas.findIndex((f) => aMinutos(f) >= endM);
    const idxHoy = DIAS_COMPLETO.indexOf(diaActual);

    if (startIdx >= 0) {
      for (let si = startIdx; si < filas.length; si++) {
        const c = colocarEn(diaActual, filas[si]);
        if (c) return;
      }
    }

    for (let d = 1; d < DIAS_COMPLETO.length; d++) {
      const dia = DIAS_COMPLETO[(idxHoy + d) % DIAS_COMPLETO.length];
      for (let si = Math.max(0, startIdx); si < filas.length; si++) {
        const c = colocarEn(dia, filas[si]);
        if (c) return;
      }
    }

    for (const dia of DIAS_COMPLETO) {
      for (const inicio of filas) {
        const c = colocarEn(dia, inicio);
        if (c) return;
      }
    }

    setError("No hay espacio disponible para duplicar esta materia");
  }

  async function handleMarcarResultado(codigo: string, resultado: 'aprobada' | 'perdida' | null) {
    try { await marcarResultado(codigo, resultado); } catch {
      setError(`Error al marcar ${codigo}`);
    }
  }

  function descargarBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function diasParaExportar(): DiaSemana[] {
    return domingoVisible ? diasVisibles : diasVisibles.filter((d) => d !== "domingo");
  }

  function handleDescargarSvg() {
    const svg = generarSvgHorario(bloques, materiasTodas, diasParaExportar(), horario.unidadHoraMinutos, resultados);
    descargarBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `horario-${horario.semestreLabel}.svg`);
  }

  async function handleDescargarJpeg() {
    const svg = generarSvgHorario(bloques, materiasTodas, diasParaExportar(), horario.unidadHoraMinutos, resultados);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se pudo renderizar la imagen"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas no disponible");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const jpeg = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Error al convertir a JPEG"))), "image/jpeg", 0.92),
      );
      descargarBlob(jpeg, `horario-${horario.semestreLabel}.jpg`);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const leyenda = [
    { Icon: CheckCircle2, label: "Aprobada", color: "text-success" },
    { Icon: XCircle, label: "Perdida", color: "text-danger" },
  ];

  function renderGrid(conBotones?: boolean) {
    return (
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${minWidthGrid}px` }}>
          <Grid
            bloques={bloques} materias={materiasTodas} unidadHoraMinutos={horario.unidadHoraMinutos} modo={modo}
            dias={diasVisibles} domingoVisible={domingoVisible}
            onToggleDomingo={() => setDomingoVisible((p) => !p)}
            resultados={resultados}
            {...(conBotones ? {
              onRemoveBloque: handleRemoveBloque,
              onExpandBloqueDown: handleExpandDown,
              onExpandBloqueUp: handleExpandUp,
              onShrinkBloqueTop: handleShrinkTop,
              onShrinkBloqueBottom: handleShrinkBottom,
              onDuplicateBloque: handleDuplicateBloque,
              onEditBloque: setEditBloque,
            } : {})}
            onMarcarResultado={modo === "curso" ? handleMarcarResultado : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-sm text-xs font-semibold ${
            modo === "edicion" ? "bg-primary-muted text-primary" : modo === "curso" ? "bg-success-bg text-success" : "bg-muted-block text-muted"
          }`}>
            {modo === "edicion" ? "Modo edición" : modo === "curso" ? "En curso" : "Finalizado"}
          </span>
          <ContadorCreditos bloques={bloques} materias={materiasTodas} maxCreditos={horario.maxCreditos} />
        </div>

        {modo !== "edicion" && (
          <div className="flex gap-2">
            <button type="button" onClick={handleDescargarSvg} title="Descargar horario como SVG" className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-solid border-border rounded-md bg-surface text-text cursor-pointer">
              <Download className="w-4 h-4" /> SVG
            </button>
            <button type="button" onClick={() => void handleDescargarJpeg()} title="Descargar horario como JPEG" className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-solid border-border rounded-md bg-surface text-text cursor-pointer">
              <FileImage className="w-4 h-4" /> JPEG
            </button>
          </div>
        )}

        {modo === "curso" && (
          <div className="flex gap-2 text-xs text-muted">
            {leyenda.map(({ Icon, label, color }) => (
              <span key={label} className="flex items-center gap-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className={color}>{label}</span>
              </span>
            ))}
          </div>
        )}

        {modo === "curso" && (
          <button type="button" onClick={() => onModoChange("finalizado")}
            disabled={!todasResultadas}
            className={`btn-primary px-4 py-2 text-white border-none rounded-md text-sm ${
              todasResultadas ? "bg-primary cursor-pointer opacity-100" : "bg-muted-block cursor-not-allowed opacity-60"
            }`}
          >Finalizar semestre</button>
        )}
        {modo === "edicion" && onGuardar && onEliminar && (
          <div className="flex gap-2">
            <button type="button" onClick={onEliminar} disabled={guardarLoading || eliminando || eliminarDisabled} className={`px-3 py-1 text-sm bg-transparent border border-solid rounded-md font-medium ${
              guardarLoading || eliminando || eliminarDisabled ? "border-danger text-danger opacity-60 cursor-not-allowed" : "border-danger text-danger cursor-pointer"
            }`}>
              {eliminando ? "Eliminando..." : "Eliminar"}
            </button>
            <button type="button" onClick={onGuardar} disabled={guardarLoading} className={`btn-primary px-4 py-2 text-sm text-white border-none rounded-md font-medium ${
              guardarLoading ? "bg-muted-block cursor-not-allowed" : "bg-primary cursor-pointer"
            }`}>
              {guardarLoading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="px-3 py-2 bg-danger-bg border border-solid border-danger rounded-md text-danger text-sm">
          {error}
        </div>
      )}

      {modo === "edicion" ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
            {renderGrid(true)}
            <div className="bg-surface rounded-md border border-border p-3 lg:sticky lg:top-3">
              <h3 className="text-sm mb-2">Materias ({materiasEnPool.length})</h3>
              <p className="md:hidden flex items-center gap-1 text-[11px] text-muted mb-2">
                <Hand className="w-3 h-3 shrink-0" />
                Mantén presionado y arrastra para mover
              </p>
              <div className="flex flex-col gap-1 mb-2">
                <input type="text" placeholder="Buscar..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)}
                  className="px-2 py-1 border border-border rounded-sm text-xs bg-surface text-text" />
                <div className="flex gap-1">
                  <select value={filtroSemestre} onChange={(e) => setFiltroSemestre(e.target.value ? Number(e.target.value) : "")}
                    className="px-2 py-1 border border-border rounded-sm text-xs bg-surface text-text flex-1 min-w-0">
                    <option value="">Semestre</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="number" placeholder="Créd. máx" value={filtroCreditos} onChange={(e) => setFiltroCreditos(e.target.value ? Number(e.target.value) : "")}
                    className="px-2 py-1 border border-border rounded-sm text-xs bg-surface text-text w-20 shrink-0" />
                </div>
              </div>
              {materiasEnPool.length === 0 ? (
                <p className="text-sm text-muted text-center p-3">No hay materias disponibles</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[45vh] lg:max-h-[calc(100vh-400px)] overflow-y-auto">
                  {materiasEnPool.map((m) => <div key={m.codigo} className="text-sm"><MateriaBlock materia={m} draggable /></div>)}
                </div>
              )}
              <DropZone id="pool-drop" />
            </div>
          </div>
          <DragOverlay>
            {activeMateria ? <div className="rotate-3 opacity-90"><MateriaBlock materia={activeMateria} /></div> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bloques.length === 0 ? (
            <div className="text-center p-8 text-muted">No hay materias en el horario</div>
          ) : (
            renderGrid()
          )}
        </div>
      )}

      {editBloque && (
        <EditBloqueModal
          isOpen={true}
          bloque={editBloque}
          materiaNombre={materiasTodas.find((m) => m.codigo === editBloque.materiaCodigo)?.nombre ?? editBloque.materiaCodigo}
          onClose={() => setEditBloque(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
