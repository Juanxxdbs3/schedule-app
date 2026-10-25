import type { EstadoMateria, Materia } from "../types.ts";

const CLAVES_MATERIA = ["codigo", "nombre", "creditos", "semestre", "requiere", "estado"] as const;

const ESTADOS: readonly EstadoMateria[] = ["activo", "matriculado", "cursado", "en_espera"];

export interface ResumenPensum {
  materias: number;
  creditosTotales: number;
  semestres: number;
  conPrerrequisitos: number;
}

export type ResultadoValidacionPensum =
  | { ok: true; data: { nombre: string; materias: Materia[] }; resumen: ResumenPensum }
  | { ok: false; errores: string[] };

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function canonizarCiclo(ciclo: string[]): string {
  let mejor = ciclo;
  for (let i = 1; i < ciclo.length; i++) {
    const rotado = [...ciclo.slice(i), ...ciclo.slice(0, i)];
    if (rotado.join("\u0000") < mejor.join("\u0000")) mejor = rotado;
  }
  return [...mejor, mejor[0]].join(" → ");
}

function detectarCiclos(grafo: Map<string, string[]>): string[] {
  const estado = new Map<string, 0 | 1 | 2>();
  const pila: string[] = [];
  const ciclos = new Set<string>();

  function visitar(codigo: string): void {
    estado.set(codigo, 1);
    pila.push(codigo);
    for (const vecino of grafo.get(codigo) ?? []) {
      const estadoVecino = estado.get(vecino) ?? 0;
      if (estadoVecino === 0) {
        visitar(vecino);
      } else if (estadoVecino === 1) {
        const inicio = pila.indexOf(vecino);
        if (inicio !== -1) ciclos.add(canonizarCiclo(pila.slice(inicio)));
      }
    }
    pila.pop();
    estado.set(codigo, 2);
  }

  for (const codigo of grafo.keys()) {
    if ((estado.get(codigo) ?? 0) === 0) visitar(codigo);
  }

  return [...ciclos].map((ciclo) => `Ciclo de prerrequisitos detectado: ${ciclo}.`);
}

/**
 * Valida el JSON de un pensum de forma pura y acumulando TODOS los errores.
 * Pensada para el feedback inmediato de la pantalla de carga: exige al menos
 * una materia. El backend vuelve a validar y es la autoridad final.
 */
export function validarPensumJson(data: unknown): ResultadoValidacionPensum {
  const errores: string[] = [];

  if (!esObjeto(data)) {
    return {
      ok: false,
      errores: ["El JSON debe ser un objeto con las claves 'nombre' y 'materias'."],
    };
  }

  const nombre = typeof data.nombre === "string" ? data.nombre.trim() : "";
  if (!("nombre" in data)) {
    errores.push("Falta la clave 'nombre' en la raíz del JSON.");
  } else if (typeof data.nombre !== "string") {
    errores.push("'nombre' debe ser un texto.");
  } else if (!nombre) {
    errores.push("'nombre' no puede estar vacío.");
  }

  if (!("materias" in data)) {
    errores.push("Falta la clave 'materias' en la raíz del JSON.");
    return { ok: false, errores };
  }

  if (!Array.isArray(data.materias)) {
    errores.push("'materias' debe ser una lista.");
    return { ok: false, errores };
  }

  if (data.materias.length === 0) {
    errores.push("El pensum no tiene materias: agrega al menos una para cargarlo desde aquí.");
    return { ok: false, errores };
  }

  const materiasCrudas = data.materias;
  const primerIndicePorCodigo = new Map<string, number>();
  const codigosConRequiere = new Map<string, string[]>();
  let creditosTotales = 0;
  const semestres = new Set<number>();
  let conPrerrequisitos = 0;

  materiasCrudas.forEach((cruda, i) => {
    const numero = i + 1;

    if (!esObjeto(cruda)) {
      errores.push(
        `Materia ${numero}: debe ser un objeto con codigo, nombre, creditos, semestre, requiere y estado.`,
      );
      return;
    }

    const codigo = typeof cruda.codigo === "string" ? cruda.codigo.trim() : "";
    const prefijo = codigo ? `Materia ${numero} (${codigo})` : `Materia ${numero}`;

    const faltantes = CLAVES_MATERIA.filter((clave) => !(clave in cruda));
    if (faltantes.length > 0) {
      errores.push(`${prefijo}: faltan las claves ${faltantes.join(", ")}.`);
    }

    if ("codigo" in cruda) {
      if (typeof cruda.codigo !== "string") {
        errores.push(`${prefijo}: 'codigo' debe ser un texto.`);
      } else if (!codigo) {
        errores.push(`Materia ${numero}: 'codigo' no puede estar vacío.`);
      } else {
        const previo = primerIndicePorCodigo.get(codigo);
        if (previo !== undefined) {
          errores.push(
            `${prefijo}: el código '${codigo}' está repetido (ya aparece en la materia ${previo + 1}).`,
          );
        } else {
          primerIndicePorCodigo.set(codigo, i);
        }
      }
    }

    if ("nombre" in cruda) {
      if (typeof cruda.nombre !== "string") {
        errores.push(`${prefijo}: 'nombre' debe ser un texto.`);
      } else if (!cruda.nombre.trim()) {
        errores.push(`${prefijo}: 'nombre' no puede estar vacío.`);
      }
    }

    if ("creditos" in cruda) {
      if (typeof cruda.creditos !== "number" || !Number.isFinite(cruda.creditos)) {
        errores.push(`${prefijo}: 'creditos' debe ser un número (sin comillas).`);
      } else if (cruda.creditos <= 0) {
        errores.push(`${prefijo}: 'creditos' debe ser mayor que 0.`);
      } else {
        creditosTotales += cruda.creditos;
      }
    }

    if ("semestre" in cruda) {
      if (typeof cruda.semestre !== "number" || !Number.isInteger(cruda.semestre)) {
        errores.push(`${prefijo}: 'semestre' debe ser un número entero (sin comillas).`);
      } else if (cruda.semestre < 1) {
        errores.push(`${prefijo}: 'semestre' debe ser 1 o mayor.`);
      } else {
        semestres.add(cruda.semestre);
      }
    }

    if ("estado" in cruda) {
      if (typeof cruda.estado !== "string" || !ESTADOS.includes(cruda.estado as EstadoMateria)) {
        errores.push(`${prefijo}: 'estado' debe ser activo, matriculado, cursado o en_espera.`);
      }
    }

    if ("requiere" in cruda) {
      if (!Array.isArray(cruda.requiere)) {
        errores.push(`${prefijo}: 'requiere' debe ser una lista de códigos.`);
      } else {
        const invalidos = cruda.requiere.filter((r) => typeof r !== "string");
        if (invalidos.length > 0) {
          errores.push(`${prefijo}: 'requiere' solo puede contener textos.`);
        }
        const codigos = cruda.requiere
          .filter((r): r is string => typeof r === "string")
          .map((r) => r.trim())
          .filter(Boolean);
        if (codigos.length > 0) conPrerrequisitos += 1;
        if (codigo) codigosConRequiere.set(codigo, codigos);
      }
    }
  });

  const codigosExistentes = new Set(primerIndicePorCodigo.keys());

  codigosConRequiere.forEach((requiere, codigo) => {
    const indice = primerIndicePorCodigo.get(codigo);
    const numero = indice === undefined ? 0 : indice + 1;
    for (const requisito of requiere) {
      if (requisito === codigo) {
        errores.push(`Materia ${numero} (${codigo}): 'requiere' no puede incluir su propio código.`);
      } else if (!codigosExistentes.has(requisito)) {
        errores.push(
          `Materia ${numero} (${codigo}): 'requiere' incluye '${requisito}', que no existe en este pensum.`,
        );
      }
    }
  });

  const grafo = new Map<string, string[]>();
  for (const codigo of codigosExistentes) grafo.set(codigo, []);
  codigosConRequiere.forEach((requiere, codigo) => {
    const vecinos = requiere.filter(
      (r) => r !== codigo && codigosExistentes.has(r),
    );
    grafo.set(codigo, [...new Set(vecinos)]);
  });
  errores.push(...detectarCiclos(grafo));

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  const materias: Materia[] = materiasCrudas.map((cruda) => {
    const m = cruda as Record<string, unknown>;
    return {
      codigo: (m.codigo as string).trim(),
      nombre: (m.nombre as string).trim(),
      creditos: m.creditos as number,
      semestre: m.semestre as number,
      requiere: (m.requiere as string[]).map((r) => r.trim()),
      estado: m.estado as EstadoMateria,
    };
  });

  return {
    ok: true,
    data: { nombre, materias },
    resumen: {
      materias: materias.length,
      creditosTotales,
      semestres: semestres.size,
      conPrerrequisitos,
    },
  };
}
