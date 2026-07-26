# Prompt para generar el JSON del pensum

Copia y pega esto en un LLM (Claude, ChatGPT, Gemini) junto con el archivo o
imagen de tu plan de estudios (el flujograma con los módulos y el PDF con
códigos/créditos).

---

Te voy a compartir el flujograma de mi plan de estudios (con módulos, materias,
créditos y notas) y/o el PDF oficial con los códigos de cada curso.

Necesito que generes un JSON con esta forma EXACTA (no agregues ni quites
campos, no cambies nombres de claves):

```json
{
  "nombre": "string — nombre de mi programa académico",
  "materias": [
    {
      "codigo": "string — código oficial de la materia, tal como aparece en el PDF",
      "nombre": "string — nombre de la materia",
      "creditos": "number — número de créditos",
      "semestre": "number — semestre en el que recomienda el pensum tomarla",
      "requiere": ["array de codigos — materias que son prerrequisito directo, según las líneas que las conectan en el flujograma"],
      "estado": "'cursado' si la materia aparece en color gris/aprobada en el flujograma, o 'activo' en cualquier otro caso"
    }
  ]
}
```

Reglas:
1. Usa el PDF para el código, nombre y créditos exactos (evita inventar códigos).
2. Usa el flujograma para determinar `semestre` (la columna donde está el bloque)
   y `requiere` (sigue las líneas que entran a cada bloque).
3. Si una materia no tiene ninguna línea de entrada, `requiere` debe ser un array vacío `[]`.
4. Si no estás seguro de un prerrequisito porque la línea es ambigua en la imagen,
   inclúyelo de todas formas con tu mejor estimación, pero al final del JSON
   agrega (fuera del bloque de código) una lista breve de qué materias
   conviene que yo revise manualmente.
5. No agregues comentarios dentro del JSON — debe ser JSON válido y parseable.
6. Devuelve el JSON completo, con TODAS las materias del pensum, no solo un ejemplo.

---

Cuando lo generes, valida que el JSON parsea correctamente antes de cargarlo en
la app (por ejemplo pegándolo en un validador JSON online, o simplemente
abriéndolo con `JSON.parse` en la consola del navegador).
