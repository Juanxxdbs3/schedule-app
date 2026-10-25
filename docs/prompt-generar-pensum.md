# Prompt para generar el JSON del pensum

> Fuente de verdad del texto: la constante `PROMPT_GENERAR_PENSUM` en
> `frontend/src/features/pensum/constants/promptGenerarPensum.ts` (es la que
> muestra el modal de "Cargar pensum"). Este archivo es la referencia
> documentada; si cambias uno, cambia el otro.

Uso: copia el texto entre las dos líneas `---` en un chat con una IA (ChatGPT,
Gemini, Claude...) y adjunta tu plan de estudios (imagen, captura, PDF, Word
o texto). La IA devolverá un JSON que se pega o se sube en la app.

---

Voy a compartirte mi plan de estudios (puede ser una imagen, captura, PDF, documento de Word o texto; puede traer un flujograma con flechas de prerrequisitos, una lista por semestres, o ambos). Necesito que lo conviertas en un JSON que cargaré en una aplicación. Sigue estos pasos EN ORDEN y no te saltes ninguno.

PASO 1 - Inventario
Identifica TODAS las materias del documento, semestre por semestre. Si el documento indica el total de materias o el total de créditos, anótalo: lo usarás en el paso 4. Nunca omitas una materia por parecer repetida o poco importante (electivas, inglés I, II, III..., prácticas, etc. son materias distintas y cada una va en su propia entrada).

PASO 2 - Forma del JSON
El resultado debe tener EXACTAMENTE esta forma (es solo un ejemplo de estructura y tipos; no copies sus datos):

{
  "nombre": "Ingeniería de Sistemas",
  "materias": [
    { "codigo": "CFBD002", "nombre": "Cálculo Diferencial", "creditos": 3, "semestre": 1, "requiere": [], "estado": "cursado" },
    { "codigo": "CFBD221", "nombre": "Cálculo Integral", "creditos": 3, "semestre": 2, "requiere": ["CFBD002"], "estado": "activo" }
  ]
}

Reglas por campo (obligatorias, sin excepciones):
- codigo: texto NO vacío y ÚNICO en todo el JSON. Si la materia tiene código oficial legible, úsalo tal cual. Si no lo tiene, genera uno con el mismo patrón de los códigos oficiales que sí existan; si ninguna materia tiene código, usa un prefijo de 2 o 3 letras de la carrera + número de semestre + consecutivo de 2 dígitos (ejemplo: FT101, FT102, FT201). Jamás dejes un código vacío, null, repetido, ni escribas "N/A" o "SIN CODIGO". La falta de códigos NUNCA es motivo para detenerte: genéralos.
- nombre: texto, tal como aparece en el documento.
- creditos: número entero (sin comillas). Si una materia no muestra créditos, no los inventes en silencio: usa 1 y menciónalo en las Notas.
- semestre: número entero mayor o igual a 1 (el semestre o columna donde aparece la materia).
- requiere: lista de textos. Cada elemento DEBE ser el "codigo" de OTRA materia que exista en este mismo JSON. Nunca pongas nombres de materias, nunca códigos que no estén en la lista, nunca la propia materia, y evita ciclos (A requiere B y B requiere A). Si el documento tiene flechas o líneas de prerrequisito, síguelas. Si los prerrequisitos aparecen escritos por nombre, conviértelos al código correspondiente. Si una materia no tiene prerrequisitos, o no puedes determinarlos con certeza, usa una lista vacía []. La clave "requiere" SIEMPRE debe existir.
- estado: SOLO uno de estos dos valores: "cursado" o "activo". Usa "cursado" únicamente si el documento marca esa materia como aprobada (color gris, check, nota aprobatoria...). En cualquier otro caso, o ante la duda, usa "activo".

PASO 3 - Qué hacer si el documento es poco claro
NO te detengas a pedir un archivo mejor. Genera siempre el JSON completo usando los valores seguros: requiere [] cuando no estés seguro de un prerrequisito y estado "activo" cuando no distingas si está aprobada. Solo si el documento es totalmente ilegible, dilo y pídeme otro archivo. Todo lo que hayas asumido debe quedar listado en las Notas del paso 5.

PASO 4 - Autoverificación (hazla de verdad antes de responder y corrige lo que falle)
a) La cantidad de materias del JSON es igual a la del documento (y coincide con el total declarado, si existe).
b) La suma de créditos coincide con el total declarado, si el documento lo indica.
c) TODOS los objetos tienen exactamente las 6 claves: codigo, nombre, creditos, semestre, requiere, estado.
d) No hay códigos vacíos ni repetidos.
e) Cada elemento de "requiere" existe como "codigo" en el JSON, no es la propia materia, y no hay ciclos.
f) creditos y semestre son números, no textos.
g) El JSON es válido: comillas dobles, sin comas finales, sin comentarios.

PASO 5 - Formato de la respuesta
1. Primero, UN solo bloque de código de tipo JSON con el JSON completo y con TODAS las materias (nunca lo abrevies con "..." ni con "etcétera"). Dentro del JSON no puede haber texto ni comentarios.
2. Debajo del bloque, una sección "Notas" con viñetas cortas: cuántas materias generaste, suma total de créditos, qué códigos fueron inventados (cuáles), qué prerrequisitos no pudiste determinar, qué estados dejaste por defecto, y qué créditos o semestres asumiste.

---

Cuando la IA responda: copia SOLO el bloque JSON (no las Notas), revisa las Notas
para saber qué conviene corregir a mano, y pégalo o súbelo en la app. Si la app
marca un error, dice qué materia falla: pídele a la IA que corrija exactamente eso.
