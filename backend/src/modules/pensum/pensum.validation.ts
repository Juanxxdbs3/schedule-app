import { z } from "zod";

export const ESTADOS_MATERIA = ["activo", "matriculado", "cursado", "en_espera"] as const;

export interface MateriaValidable {
  codigo: string;
  requiere: string[];
}

interface Issue {
  path: (string | number)[];
  message: string;
}

export const materiaSchema = z.object({
  codigo: z.string().trim().min(1, "el código no puede estar vacío"),
  nombre: z.string().trim().min(1, "el nombre no puede estar vacío"),
  creditos: z
    .number({ invalid_type_error: "los créditos deben ser un número (sin comillas)" })
    .finite("los créditos deben ser un número finito")
    .positive("los créditos deben ser mayores que 0"),
  semestre: z
    .number({ invalid_type_error: "el semestre debe ser un número entero (sin comillas)" })
    .int("el semestre debe ser un número entero")
    .min(1, "el semestre debe ser 1 o mayor"),
  requiere: z
    .array(z.string(), { invalid_type_error: "requiere debe ser una lista de códigos" })
    .transform((lista) => lista.map((codigo) => codigo.trim())),
  estado: z.enum(ESTADOS_MATERIA, {
    errorMap: () => ({ message: "estado debe ser activo, matriculado, cursado o en_espera" }),
  }),
});

function canonizarCiclo(ciclo: string[]): string {
  let mejor = ciclo;
  for (let i = 1; i < ciclo.length; i++) {
    const rotado = [...ciclo.slice(i), ...ciclo.slice(0, i)];
    if (rotado.join("\u0000") < mejor.join("\u0000")) mejor = rotado;
  }
  return [...mejor, mejor[0]].join(" → ");
}

function detectarCiclos(materias: MateriaValidable[], codigos: Set<string>): string[] {
  const grafo = new Map<string, string[]>();
  for (const codigo of codigos) grafo.set(codigo, []);

  const agregados = new Set<string>();
  for (const materia of materias) {
    const codigo = materia.codigo.trim();
    if (!codigo || agregados.has(codigo)) continue;
    agregados.add(codigo);
    const vecinos = materia.requiere
      .map((r) => r.trim())
      .filter((r) => r.length > 0 && r !== codigo && codigos.has(r));
    grafo.set(codigo, [...new Set(vecinos)]);
  }

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

  return [...ciclos].map((ciclo) => `Ciclo de prerrequisitos detectado: ${ciclo}`);
}

/**
 * Reglas que solo se pueden evaluar con el conjunto completo de materias:
 * códigos únicos, prerrequisitos existentes, auto-referencia y ciclos.
 */
export function validarReglasPensum(materias: MateriaValidable[]): string[] {
  const errores: string[] = [];
  const primeroPorCodigo = new Map<string, number>();

  materias.forEach((materia, i) => {
    const codigo = materia.codigo.trim();
    if (!codigo) return;
    const previo = primeroPorCodigo.get(codigo);
    if (previo !== undefined) {
      errores.push(
        `Materia ${i + 1} (${codigo}): el código está repetido, ya aparece en la materia ${previo + 1}`,
      );
    } else {
      primeroPorCodigo.set(codigo, i);
    }
  });

  const codigos = new Set(primeroPorCodigo.keys());

  materias.forEach((materia, i) => {
    const codigo = materia.codigo.trim();
    for (const requisito of materia.requiere) {
      const req = requisito.trim();
      if (!req) {
        errores.push(`Materia ${i + 1} (${codigo}): 'requiere' contiene un código vacío`);
        continue;
      }
      if (req === codigo) {
        errores.push(`Materia ${i + 1} (${codigo}): 'requiere' no puede incluir su propio código`);
      } else if (!codigos.has(req)) {
        errores.push(
          `Materia ${i + 1} (${codigo}): 'requiere' incluye '${req}', que no existe en el pensum`,
        );
      }
    }
  });

  errores.push(...detectarCiclos(materias, codigos));
  return errores;
}

/** Extrae codigo/requiere de un valor desconocido sin lanzar, para poder evaluar las reglas cruzadas. */
function aMateriaValidable(raw: unknown): MateriaValidable {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    codigo: typeof obj.codigo === "string" ? obj.codigo : "",
    requiere: Array.isArray(obj.requiere)
      ? obj.requiere.filter((r): r is string => typeof r === "string")
      : [],
  };
}

/**
 * Valida un pensum completo acumulando TODOS los errores (de campo y cruzados).
 * Se implementa como transform porque `superRefine` de zod se salta si falla la
 * forma base: así los errores cruzados (duplicados, ciclos) también se reportan
 * junto a los errores de campo.
 */
export const createPensumSchema = z.unknown().transform((data, ctx) => {
  const issues: Issue[] = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: "el cuerpo debe ser un objeto JSON con 'nombre' y 'materias'",
    });
    return z.NEVER;
  }

  const obj = data as Record<string, unknown>;
  const nombre = typeof obj.nombre === "string" ? obj.nombre.trim() : "";
  if (!nombre) {
    issues.push({
      path: ["nombre"],
      message: "el nombre del pensum no puede estar vacío",
    });
  }

  let materiasRaw: unknown[] = [];
  if (obj.materias === undefined) {
    materiasRaw = [];
  } else if (Array.isArray(obj.materias)) {
    materiasRaw = obj.materias;
  } else {
    issues.push({ path: ["materias"], message: "materias debe ser una lista" });
  }

  const materiasValidas: z.infer<typeof materiaSchema>[] = [];
  materiasRaw.forEach((raw, i) => {
    const parsed = materiaSchema.safeParse(raw);
    if (parsed.success) {
      materiasValidas.push(parsed.data);
      return;
    }
    for (const issue of parsed.error.issues) {
      issues.push({ path: ["materias", i, ...issue.path], message: issue.message });
    }
  });

  for (const mensaje of validarReglasPensum(materiasRaw.map(aMateriaValidable))) {
    issues.push({ path: [], message: mensaje });
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: issue.path, message: issue.message });
    }
    return z.NEVER;
  }

  return { nombre, materias: materiasValidas };
});

export const addMateriaSchema = materiaSchema.partial({ estado: true });

/** Convierte los issues de zod en mensajes legibles y con contexto de materia. */
export function formatearErroresZod(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    if (issue.path.length === 0) return issue.message;
    if (issue.path[0] === "materias" && typeof issue.path[1] === "number") {
      const numero = issue.path[1] + 1;
      const campo = issue.path.slice(2).join(".");
      return campo
        ? `Materia ${numero} (${campo}): ${issue.message}`
        : `Materia ${numero}: ${issue.message}`;
    }
    return `${issue.path.join(".")}: ${issue.message}`;
  });
}
