---
name: designing-conciertos-latam
description: "Sistema de diseño de Conciertos Latam (Manual de Marca v2.0 — identidad de noche en vivo con degradado morado → violeta → fucsia → naranja) para desarrollo web y apps. Genera UI on-brand — landings, pantallas, componentes, mockups, artefactos HTML/React, emails, dashboards, prototipos — con tokens CSS, config de Tailwind y componentes listos para pegar. Úsese SIEMPRE que se diseñe o programe cualquier interfaz, componente o pieza visual de Conciertos Latam, se mencione su marca, sus colores, su web/app (conciertoslatam.app), o se pida una landing, una card, un botón o una pantalla para la plataforma, incluso si el usuario no dice explícitamente diseño ni marca. Reemplaza por completo la versión anterior azul-cobalto/verde; si algo en memoria o en código viejo usa #004AAD, #597CFF o #37C563, migrar a esta paleta."
---

# Diseño — Conciertos Latam (Manual de Marca v2.0)

## 1. Identidad

Conciertos Latam es un medio y plataforma de conciertos para fans de la música en vivo en toda Latinoamérica: fechas, entradas, setlists, noticias y las historias detrás de cada show. Se siente **eléctrica, cercana y nocturna** — como estar dentro del venue, no consultando una base de datos.

**La nueva identidad sube el voltaje.** Los arcos del estadio siguen siendo el activo central, pero ahora encendidos con el degradado **morado → violeta → fucsia → naranja**: las luces del venue en pleno show. La marca dejó atrás el azul corporativo y adoptó el color de la noche en vivo.

Personalidad: **cercana pero con energía de escenario. Nunca corporativa.**

> ⚠️ Cambio respecto a la identidad anterior: ya NO existen el azul cobalto `#004AAD`, el periwinkle `#597CFF` ni el verde `#37C563`. Y la regla vieja de "evitar violeta/morado" queda invertida — el morado ahora ES la marca. Si encuentras esos valores en código o memoria, migra usando la tabla de equivalencias al final de `references/tokens.css`.

## 2. Tokens

Copia `references/tokens.css` tal cual en cualquier proyecto (CSS vars + fuentes + reset base). Para Tailwind usa `references/tailwind.md`.

### Color

| Token | Hex | Uso |
|---|---|---|
| `--noche` | `#070D1F` | Fondo oficial. TODO vive sobre este azul-noche |
| `--superficie` | `#0E1830` | Cards y paneles |
| `--superficie-2` | `#131F3D` | Hover de cards/paneles, elevación |
| `--morado` | `#7516E2` | Color de marca. Arranque de gradientes, glows y fondos de énfasis. **Nunca plano como fondo de secciones enteras** |
| `--violeta` | `#AB0DC4` | Puente del degradado entre morado y fucsia |
| `--fucsia` | `#E70485` | **Interactivo:** links, iconos, hovers, focus, eyebrows |
| `--naranja` | `#FE670C` | **Solo acentos:** badge "en vivo", números de fecha, disponibilidad, remates. Nunca estructural |
| `--blanco` / `--texto` | `#FFFFFF` | Texto principal |
| `--texto-2` | `#94A0BD` | Texto secundario |
| `--linea` | `rgba(231,4,133,.2)` | Bordes de cards, inputs y divisores (fucsia al 20%) |

**Gradientes firma:**
- `--grad-primario`: `linear-gradient(95deg, #7516E2, #E70485)` → botones primarios y glows
- `--grad-arco`: `linear-gradient(92deg, #7516E2, #AB0DC4, #E70485, #FE670C)` → el "arco completo": titulares con `background-clip: text`, divisores de sección y el isotipo. **Muy puntual**
- Glow de hero: `radial-gradient` de morado al 40–50% de opacidad, `filter: blur(100–120px)`

**Reglas de color:**
- **Máximo un gradiente protagonista por pantalla.** Si el hero lleva glow + titular degradado, los botones del resto de la página se apoyan en superficie/fucsia, no en más gradientes
- **El orden del degradado es sagrado:** morado → violeta → fucsia → naranja, de arriba hacia abajo o de izquierda a derecha. Nunca invertirlo ni reordenarlo
- Naranja en texto pequeño sobre noche: solo desde **14px y peso 600** (por debajo pierde contraste)
- Texto sobre noche: `#FFFFFF` principal, `#94A0BD` secundario. No inventes grises intermedios

### Tipografía

- **Big Shoulders Display** (700–900, uppercase) — titulares y displays. Vibra de cartel de gira; condensada, aguanta titulares largos en español sin romper línea
- **Fira Sans** (300–700) — todo el texto corrido, labels y componentes de interfaz

Carga: `https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400..900&family=Fira+Sans:wght@300;400;500;600;700&display=swap`

**Reglas duras:**
- Big Shoulders **solo de 24px hacia arriba**; debajo todo es Fira Sans. Nunca en párrafos, texto corrido ni labels de UI
- Tracking en displays ligeramente positivo (`letter-spacing: .005em`–`.01em`) — el negativo la empasta
- El contraste de escala es parte del diseño: hero `clamp(48px, 8.5vw, 116px)` contra cuerpo de 16px
- El degradado en texto (`background-clip: text`) se reserva para **una palabra o remate** por pieza, como "LATAM" en el logo. Nunca un titular completo en degradado

### Espaciado y forma

- Escala base **8px** (8/16/24/32/48/64/96). Secciones separadas por ~96px vertical
- Contenedor: `max-width: 1240px`, padding lateral 32px (24px en móvil)
- Cards: radio **20px**, borde `1px solid var(--linea)`, padding 20–24px
- Botones y badges: radio **100px** (pill)
- Sombras **solo** en hover de cards (`0 20px 50px rgba(0,0,0,.5)`) y en botones primarios (`0 8px 32px rgba(117,22,226,.45)`). Nada de sombras grises flotantes
- Iconografía: monocroma, stroke, en fucsia o blanco. Nunca multicolor, nunca emojis como iconos

## 3. Componentes

Código completo de cada uno en `references/components.md`. Reglas esenciales:

- **Botón primario:** fondo `--grad-primario`, pill, texto blanco 600, hover `translateY(-2px)` + sombra más intensa. Verbo directo: "Ver próximos conciertos", "Unirme gratis"
- **Botón secundario:** fondo transparente, borde `--linea`, texto blanco 500; hover fondo `--superficie`
- **Card de concierto:** media 16/10 con overlay `linear-gradient(180deg, transparent 40%, rgba(7,13,31,.85))` desde abajo; **chip de fecha** arriba-derecha (fondo noche al 90%, número grande en **naranja** Big Shoulders 800 ≥24px, mes en blanco 11px Fira 600 uppercase); **nombre de artista en fucsia** uppercase 12px tracking .14em; venue/título en Big Shoulders blanco; hover eleva 4px y borde pasa a fucsia al 35%
- **Badge "en vivo":** punto **naranja** pulsante (animación con box-shadow expansivo) + texto naranja 11px 700 uppercase tracking .12em
- **Eyebrow de sección:** barra de **24×2px con `--grad-arco`** + texto **fucsia** 13px 600 uppercase tracking .12em
- **Input:** fondo `--superficie`, borde `--linea`, texto blanco, placeholder `--texto-2`, focus `outline: 2px solid var(--fucsia)` con `outline-offset: 2px`
- **Navbar:** única superficie con `backdrop-filter: blur(16px)` permitida; fondo noche al 70–80% + borde inferior `--linea`
- **Fotos:** full-bleed con overlay de gradiente oscuro desde abajo para que el texto respire encima
- **Links en texto:** fucsia, sin subrayado por defecto, subrayado en hover

## 4. Elemento firma: los arcos

Los arcos del logo se despliegan como **luz de escenario**: líneas curvas gigantes (stroke 2px) que recorren el degradado de la marca — morado arriba, violeta y fucsia al centro, naranja tocando el horizonte — saliendo del borde inferior del hero, como la silueta del estadio encendido.

**Dosis:** hero + máximo 1–2 apariciones secundarias por página, en miniatura (2 arcos, ~400px) en esquinas de secciones destacadas (ej. el CTA de comunidad "No te pierdas ningún show"). Más que eso deja de ser firma y se vuelve textura.

SVGs listos en `assets/arcos-hero.svg` (5 arcos, hero) y `assets/arcos-mini.svg` (2 arcos, secundario). Ambos usan `currentColor`-free strokes con hex directos y `pointer-events: none`; colócalos con `position: absolute; bottom: 0; left: 50%; transform: translateX(-50%)` y `aria-hidden="true"`.

## 5. Logos

| Versión | Uso |
|---|---|
| **Principal (vertical)** | Preferida: arcos en degradado, "Conciertos" en blanco, "LATAM" en degradado. Piezas centradas, portadas, splash |
| **Horizontal** | Headers/navbar, firmas de email, espacios anchos de poca altura |
| **Sello circular** | Avatares de redes, favicon, stickers, app icon |
| **Isotipo blanco** | Monocromo para casos extremos: sobre fotografía muy cargada o impresión a una tinta |

En web usa siempre el archivo oficial del logo (pídelo al usuario si no está en el proyecto); no lo reconstruyas con CSS salvo que se pida explícitamente un placeholder. Si lo reconstruyes, respeta el orden del degradado y "LATAM" con `background-clip: text` sobre `--grad-arco`.

## 6. Do's & Don'ts

✅ **Hacer:**
- Contenido real de la plataforma: artistas, venues y fechas reales de LATAM (Movistar Arena, Estéreo Picnic, Vive Latino, Lollapalooza Chile/Argentina, Estadio El Campín, Foro Sol…)
- Todo en español, dirigido a fans
- Un solo gradiente protagonista por pantalla
- Respetar el orden del degradado: morado → violeta → fucsia → naranja
- Naranja como chispa puntual de energía
- Overlay oscuro sobre toda foto que lleve texto encima
- Responsive hasta móvil (breakpoints 640/900/1240), focus visible (outline fucsia), respetar `prefers-reduced-motion`
- Alternar layouts: no todo centrado y simétrico — usar asimetría intencional (ej. destacada en grid 1.1fr/.9fr)

❌ **Evitar:**
- **El azul cobalto de la identidad anterior** (`#004AAD`, `#597CFF`, `#83B4FF`) y el verde `#37C563` en piezas nuevas
- Morado o violeta **plano** como fondo de secciones enteras — viven en gradientes y glows
- Naranja como color estructural: botones grandes, fondos, secciones
- Invertir o reordenar el degradado de marca
- Big Shoulders en tamaños pequeños o texto corrido
- Fondos claros o grises en producto — todo vive en la noche
- Más de un gradiente protagonista por pantalla
- Iconos multicolor, emojis como bullets o iconos
- Glassmorphism generalizado (máximo: navbar con blur)
- Inter, Poppins o Montserrat como defaults (ni system-ui como fallback principal — el fallback de Fira Sans es `sans-serif`)

## 7. Voz del copy

Tono: directo, cercano y con emoción de fan — nunca corporativo. **"Tus artistas favoritos", nunca "los usuarios".** Sentence case en UI; uppercase solo en displays.

| Pieza | Ejemplo |
|---|---|
| Título hero | "TODOS LOS CONCIERTOS DE LATINOAMÉRICA" |
| Subtítulo | "Fechas, entradas, setlists y las historias detrás de cada show." |
| Botones | "Ver próximos conciertos" · "Leer historia" · "Unirme gratis" |
| Secciones | "Las giras del momento" · "Los mejores momentos" |
| CTA comunidad | "No te pierdas ningún show" |
| Footer | "Hecho con amor por la música en vivo" |

Microcopy de estados: vacío → "Todavía no hay fechas por acá. Vuelve pronto." · error → "Algo se desconectó. Inténtalo de nuevo." · carga → "Encendiendo las luces…"

## 8. Flujo de trabajo al construir

1. Empieza pegando `references/tokens.css` (o el config de `references/tailwind.md`). No redefinas colores a mano.
2. Estructura la pantalla y decide **cuál es el único gradiente protagonista** (normalmente el hero: glow + botón primario cuentan como uno).
3. Arma con los componentes de `references/components.md`; adapta el contenido, no los tokens.
4. Coloca los arcos: hero sí, y como máximo 1–2 mini en secciones destacadas.
5. Pasa el checklist antes de entregar:
   - [ ] Sin `#004AAD`, `#597CFF`, `#37C563` ni azul/verde de la identidad vieja
   - [ ] Sin morado/violeta plano de fondo en secciones; sin naranja en botones grandes o fondos
   - [ ] Degradado siempre morado → violeta → fucsia → naranja
   - [ ] Big Shoulders solo ≥24px y solo en displays
   - [ ] Un gradiente protagonista; texto degradado solo en un remate
   - [ ] Overlay sobre fotos con texto; contraste AA en texto secundario
   - [ ] Focus visible fucsia; `prefers-reduced-motion` respetado
   - [ ] Copy en español, para fans, sentence case en UI
