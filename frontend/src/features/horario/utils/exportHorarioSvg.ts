import type { Bloque, DiaSemana } from "../types.ts";
import type { Materia } from "../../pensum/types.ts";
import { generarFilasHora } from "./generarFilasHora.ts";
import { DIAS_LABEL, rowIndexFor, spanFor } from "./gridMath.ts";

export type ResultadoMateria = "aprobada" | "perdida";

const HEADER_H = 40;
const ROW_H = 52;
const TIME_W = 60;
const COL_W = 140;
const PAD = 8;

const COLOR_BY_ESTADO: Record<string, { bg: string; border: string; text: string }> = {
  activo: { bg: "#dcfce7", border: "#16a34a", text: "#166534" },
  matriculado: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  cursado: { bg: "#e5e7eb", border: "#9ca3af", text: "#4b5563" },
  en_espera: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncar(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function lineaTexto(x: number, y: number, texto: string, color: string): string {
  return `<text x="${x + PAD}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="10.5" fill="${color}">${esc(texto)}</text>`;
}

export function generarSvgHorario(
  bloques: Bloque[],
  materias: Materia[],
  dias: DiaSemana[],
  unidadHoraMinutos: number,
  resultados: Record<string, ResultadoMateria> = {},
): string {
  const filas = generarFilasHora(unidadHoraMinutos);
  const materiaMap = new Map(materias.map((m) => [m.codigo, m]));

  const ancho = TIME_W + dias.length * COL_W;
  const alto = HEADER_H + filas.length * ROW_H;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">`);
  parts.push(`<rect width="${ancho}" height="${alto}" fill="#ffffff"/>`);

  parts.push(`<rect x="0" y="0" width="${TIME_W}" height="${HEADER_H}" fill="#f1f5f9" stroke="#cbd5e1"/>`);
  parts.push(
    `<text x="${TIME_W / 2}" y="${HEADER_H / 2 + 4}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600" fill="#64748b">Hora</text>`,
  );

  dias.forEach((dia, i) => {
    const x = TIME_W + i * COL_W;
    parts.push(`<rect x="${x}" y="0" width="${COL_W}" height="${HEADER_H}" fill="#f8fafc" stroke="#cbd5e1"/>`);
    parts.push(
      `<text x="${x + COL_W / 2}" y="${HEADER_H / 2 + 4}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="600" fill="#0f172a">${DIAS_LABEL[dia]}</text>`,
    );
  });

  filas.forEach((hora, i) => {
    const y = HEADER_H + i * ROW_H;
    parts.push(
      `<text x="${TIME_W / 2}" y="${y + ROW_H / 2 + 4}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" fill="#64748b">${hora}</text>`,
    );
    parts.push(`<line x1="0" y1="${y}" x2="${ancho}" y2="${y}" stroke="#e2e8f0"/>`);
  });

  parts.push(`<line x1="0" y1="${alto}" x2="${ancho}" y2="${alto}" stroke="#cbd5e1"/>`);
  for (let i = 0; i <= dias.length; i++) {
    const x = TIME_W + i * COL_W;
    parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${alto}" stroke="#e2e8f0"/>`);
  }

  for (const b of bloques) {
    const col = dias.indexOf(b.dia);
    if (col === -1) continue;
    const row = rowIndexFor(b.horaInicio, filas);
    if (row === -1) continue;
    const span = spanFor(b.horaInicio, b.horaFin, filas);

    const materia = materiaMap.get(b.materiaCodigo);
    const color = COLOR_BY_ESTADO[materia?.estado ?? "activo"] ?? COLOR_BY_ESTADO.activo;

    const x = TIME_W + col * COL_W + 2;
    const y = HEADER_H + row * ROW_H + 2;
    const w = COL_W - 4;
    const h = span * ROW_H - 4;

    const resultado = resultados[b.materiaCodigo];
    const tieneResultado = resultado === "aprobada" || resultado === "perdida";

    parts.push(`<rect class="bloque" x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${color.bg}" stroke="${color.border}" stroke-width="1.5"/>`);

    const nombre = truncar(b.nombrePersonalizado || materia?.nombre || b.materiaCodigo, 18);
    parts.push(
      `<text x="${x + PAD}" y="${y + 16}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600" fill="${color.text}">${esc(nombre)}</text>`,
    );

    if (span >= 2) {
      let linea = y + 32;
      if (b.profesor) {
        parts.push(lineaTexto(x, linea, truncar(b.profesor, 20), "#475569"));
        linea += 15;
      }
      if (b.salon) {
        parts.push(lineaTexto(x, linea, truncar(b.salon, 20), "#475569"));
        linea += 15;
      }
      parts.push(lineaTexto(x, linea, `${b.horaInicio}–${b.horaFin}`, "#475569"));
    }

    if (tieneResultado) {
      const label = resultado === "aprobada" ? "✓ Aprobada" : "✗ Perdida";
      const colorRes = resultado === "aprobada" ? "#15803d" : "#b91c1c";
      const bgRes = resultado === "aprobada" ? "#dcfce7" : "#fee2e2";
      const bw = label.length * 5.5 + 14;
      const bx = x + (w - bw) / 2;
      const by = span >= 2 ? y + h - 20 : y + 30;
      parts.push(`<rect x="${bx}" y="${by}" width="${bw}" height="16" rx="8" fill="${bgRes}" stroke="${colorRes}" stroke-width="1"/>`);
      parts.push(
        `<text x="${bx + bw / 2}" y="${by + 11}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="600" fill="${colorRes}">${label}</text>`,
      );
    }
  }

  parts.push("</svg>");
  return parts.join("\n");
}