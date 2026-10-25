import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PROMPT_GENERAR_PENSUM } from "../constants/promptGenerarPensum.ts";

function cuerpoDelPrompt(): string {
  const url = new URL("../../../../../docs/prompt-generar-pensum.md", import.meta.url);
  const lineas = readFileSync(url, "utf8").split(/\r?\n/);
  const indices = lineas
    .map((linea, i) => (linea.trim() === "---" ? i : -1))
    .filter((i) => i >= 0);

  expect(indices.length).toBeGreaterThanOrEqual(2);

  const cuerpo = lineas.slice(indices[0] + 1, indices[1]);
  while (cuerpo.length > 0 && cuerpo[0].trim() === "") cuerpo.shift();
  while (cuerpo.length > 0 && cuerpo[cuerpo.length - 1].trim() === "") cuerpo.pop();
  return cuerpo.join("\n");
}

describe("PROMPT_GENERAR_PENSUM", () => {
  it("coincide exactamente con el cuerpo entre las líneas --- de docs/prompt-generar-pensum.md", () => {
    expect(PROMPT_GENERAR_PENSUM).toBe(cuerpoDelPrompt());
  });

  it("incluye los cinco pasos y el formato JSON esperado", () => {
    for (const paso of ["PASO 1", "PASO 2", "PASO 3", "PASO 4", "PASO 5"]) {
      expect(PROMPT_GENERAR_PENSUM).toContain(paso);
    }
    expect(PROMPT_GENERAR_PENSUM).toContain('"codigo"');
    expect(PROMPT_GENERAR_PENSUM).toContain('"requiere"');
    expect(PROMPT_GENERAR_PENSUM).toContain('"estado"');
  });
});
