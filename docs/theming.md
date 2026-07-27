# Theming — horario-app

## Filosofía

Todos los colores y valores visuales que puedan cambiar (tema claro/oscuro,
estados de materia) viven en **variables CSS custom properties** en un único
archivo global. Los componentes nunca hardcodean colores — siempre consumen
la variable. Esto permite cambiar el tema completo sin tocar componentes.

## Archivo global: `frontend/src/styles/globals.css`

```css
:root {
  /* Superficie y texto — paleta "Dashboard Light / Acentos Morados" */
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-surface-alt: #f1eefc;
  --color-text: #2b2b36;
  --color-text-muted: #8f92a1;
  --color-border: #e4e4e4;

  /* Marca */
  --color-primary: #6c5dd3;
  --color-primary-hover: #5b4dc0;
  --color-secondary: #ffa2c0;

  /* Estados semánticos (materias / bloques) */
  --color-success: #16a34a;      /* materia aprobada */
  --color-danger: #dc2626;       /* choque de horario / materia perdida */
  --color-warning: #d97706;      /* cerca del límite de créditos */
  --color-muted-block: #cbd5e1;  /* materia cursada, ya no arrastrable */

  /* Espaciado y forma */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 16px;
  --spacing-4: 24px;
  --spacing-5: 32px;
  --spacing-6: 48px;

  /* Tipografía */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;

  /* Variantes suaves de los estados (para fondos, sin saturar) */
  --color-primary-muted: #ede9fe;
  --color-success-bg: #dcfce7;
  --color-danger-bg: #fef2f2;
}

.dark {
  /* Paleta "Mindful — Dark Mode", misma familia de morados */
  --color-bg: #1e1b38;
  --color-surface: #2a2746;
  --color-surface-alt: #362f5c;
  --color-text: #ffffff;
  --color-text-muted: #a19db5;
  --color-border: #3d3768;

  --color-primary: #8c84e2;
  --color-primary-hover: #a79cf0;
  --color-secondary: #ff8c6b;

  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-muted-block: #475569;

  --color-primary-muted: #362f5c;
  --color-success-bg: #14532d;
  --color-danger-bg: #450a0a;
}
```

## Uso con Tailwind

Mapea estas variables en `tailwind.config.js` para poder usar clases normales
de Tailwind (`bg-surface`, `text-muted`, `border-border`, etc.) en vez de
valores arbitrarios:

```js
// tailwind.config.js
export default {
  darkMode: 'class', // toggle con la clase .dark en <html>
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        text: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        'muted-block': 'var(--color-muted-block)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
      },
    },
  },
};
```

## Reglas para el agente de frontend

1. **Nunca** usar `bg-[#hexcode]` (valores arbitrarios de Tailwind) para
   colores de tema — siempre la clase mapeada (`bg-primary`, `bg-danger`, etc.).
2. **Nunca** `style={{ color: '...' }}` inline para colores temáticos.
3. Si falta un token, agrégalo en `globals.css` (ambos bloques, `:root` y
   `.dark`) antes de usarlo, nunca improvises un color suelto en el componente.
4. Uso semántico esperado en la grilla de horario:
   - Bloque normal recién arrastrado → `bg-primary` / borde `border-primary`
   - Bloque con choque detectado → `border-danger`, fondo con opacidad de `danger`
   - Materia ya cursada (gris, no arrastrable) → `bg-muted-block`, `text-muted`
   - Contador de créditos cerca del máximo (ej. > 90%) → `text-warning`
   - Confirmación de materia aprobada → ícono/acento en `text-success`
5. Toggle de dark mode: agregar/quitar la clase `.dark` en `<html>`, guardado
   en `localStorage` bajo una key propia (ej. `theme-preference`), no depende
   del backend.
