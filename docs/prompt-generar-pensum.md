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
1. Usa el PDF/imagen para el código, nombre y créditos exactos. Si una
   materia SÍ tiene código oficial legible, úsalo tal cual. Si NO tiene
   código oficial legible (o el archivo no lo incluye), genera uno tú mismo,
   coherente con el resto (mismo patrón de prefijo/longitud que los códigos
   oficiales que sí existan, o si ninguno tiene código oficial, inventa un
   prefijo corto basado en el área temática — ej. "PSI" para psicología
   general, "ELE" para electivas). Nunca dejes un código vacío o nulo.
2. Usa el flujograma para determinar `semestre` (la columna donde está el
   bloque) y `requiere` (sigue las líneas que entran a cada bloque).
3. Si una materia no tiene ninguna línea de entrada, `requiere` debe ser un
   array vacío `[]`.
4. Modo por defecto (estricto): si la calidad/resolución de la imagen no te
   permite determinar con certeza las líneas de prerrequisito o el color de
   "cursada" para una parte del pensum, detente y pide un archivo mejor antes
   de generar el JSON — no inventes esa información.
5. Modo borrador (solo si el usuario lo pide explícitamente, ej. "genéralo
   como borrador" o "trátalo como archivo de prueba"): en vez de detenerte,
   genera el JSON completo igualmente. Para cualquier prerrequisito que no
   puedas determinar con certeza, usa `requiere: []`. Para el estado, si no
   puedes distinguir el color de "cursada" con confianza, usa `estado: "activo"`
   para todas (nunca `"cursado"` como default, ya que asumir una materia como
   ya aprobada sin certeza es más riesgoso que asumirla disponible). Al final
   del JSON, agrega una nota breve indicando qué códigos son provisionales
   (inventados) y qué prerrequisitos/estados quedaron en su valor por defecto
   por falta de certeza — así el estudiante sabe exactamente qué revisar
   manualmente más adelante, sin que eso bloquee tener un archivo de prueba
   funcional ya mismo.
6. No agregues comentarios dentro del JSON — debe ser JSON válido y parseable.
7. Devuelve el JSON completo, con TODAS las materias del pensum, no solo un
   ejemplo.

---

Cuando lo generes, valida que el JSON parsea correctamente antes de cargarlo en
la app (por ejemplo pegándolo en un validador JSON online, o simplemente
abriéndolo con `JSON.parse` en la consola del navegador).