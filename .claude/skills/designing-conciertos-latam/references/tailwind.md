# Tailwind — Conciertos Latam (Manual de Marca v2.0)

Extiende el `theme` con estos tokens. No inventes valores fuera de esta paleta.

## Config (Tailwind 3)

```ts
// tailwind.config.ts — dentro de theme.extend
{
  colors: {
    noche: '#070D1F',
    superficie: {
      DEFAULT: '#0E1830',
      2: '#131F3D',
    },
    morado: '#7516E2',
    violeta: '#AB0DC4',
    fucsia: '#E70485',
    naranja: '#FE670C',
    texto: {
      DEFAULT: '#FFFFFF',
      2: '#94A0BD',
    },
    linea: 'rgba(231, 4, 133, 0.2)',
  },
  fontFamily: {
    display: ['"Big Shoulders Display"', 'sans-serif'],
    sans: ['"Fira Sans"', 'sans-serif'],
  },
  backgroundImage: {
    'grad-primario': 'linear-gradient(95deg, #7516E2, #E70485)',
    'grad-arco': 'linear-gradient(92deg, #7516E2, #AB0DC4, #E70485, #FE670C)',
  },
  borderRadius: {
    card: '20px',
    pill: '100px',
  },
  boxShadow: {
    'card-hover': '0 20px 50px rgba(0, 0, 0, 0.5)',
    boton: '0 8px 32px rgba(117, 22, 226, 0.45)',
  },
  maxWidth: {
    contenedor: '1240px',
  },
}
```

Carga de fuentes (en `index.html` o CSS global):

```html
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400..900&family=Fira+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

## Recetas de clases

| Pieza | Clases |
|---|---|
| Fondo de página | `bg-noche text-texto font-sans` |
| Titular hero | `font-display font-black uppercase tracking-[.01em] text-[clamp(48px,8.5vw,116px)] leading-[1.05]` |
| Remate degradado (una palabra) | `bg-grad-arco bg-clip-text text-transparent` |
| Botón primario | `bg-grad-primario text-white font-semibold rounded-pill px-7 py-3.5 shadow-boton transition hover:-translate-y-0.5` |
| Botón secundario | `border border-linea text-white font-medium rounded-pill px-7 py-3.5 transition hover:bg-superficie` |
| Card | `bg-superficie border border-linea rounded-card transition hover:-translate-y-1 hover:border-fucsia/35 hover:shadow-card-hover` |
| Eyebrow | `text-fucsia text-[13px] font-semibold uppercase tracking-[.12em]` (con barra `h-0.5 w-6 bg-grad-arco`) |
| Badge en vivo | `text-naranja text-[11px] font-bold uppercase tracking-[.12em]` + punto naranja pulsante |
| Texto secundario | `text-texto-2` |
| Link | `text-fucsia hover:underline` |
| Input | `bg-superficie border border-linea text-white placeholder:text-texto-2 rounded-xl px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fucsia focus-visible:outline-offset-2` |
| Navbar | `sticky top-0 z-50 bg-noche/75 backdrop-blur-lg border-b border-linea` |
| Contenedor | `max-w-contenedor mx-auto px-8 max-sm:px-6` |

## Migración desde la identidad vieja en este repo

El proyecto todavía tiene `bg-brand-blue` (`#004aad`) en su config. Al tocar UI con la nueva identidad:

- `brand-blue` / `#004AAD` → `morado` (solo en gradientes/glows, nunca plano)
- `#597CFF` → `fucsia` (interactivo)
- `#37C563` → `naranja` (acentos)

Nunca uses `bg-morado` o `bg-violeta` plano en secciones enteras: viven en `bg-grad-primario`, `bg-grad-arco` y glows.
