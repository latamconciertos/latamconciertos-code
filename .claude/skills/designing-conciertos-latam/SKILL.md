---
name: designing-conciertos-latam
description: Genera UI on-brand (landings, componentes, pantallas, mockups, emails, artefactos HTML) para Conciertos Latam siguiendo la dirección "Evolución Nocturna". Úsese siempre que se diseñe cualquier interfaz o pieza visual de Conciertos Latam, se mencione su marca, sus colores, su web (conciertoslatam.app) o se pida contenido visual para la plataforma, incluso si el usuario no menciona explícitamente "diseño" o "marca".
---

# Diseño — Conciertos Latam ("Evolución Nocturna")

## 1. Identidad

Conciertos Latam es un medio y plataforma de conciertos para fans de la música en vivo en toda Latinoamérica: fechas, entradas, setlists, noticias y las historias detrás de cada show. Se siente **eléctrica, cercana y nocturna** — como estar dentro del venue, no consultando una base de datos.

**Concepto rector:** no es un rebrand. Se conservan el logo, el isotipo (arcos de estadio) y la esencia azul del manual de marca, pero reinterpretados para el mundo digital oscuro. El sitio pasa de verse corporativo a sentirse como un venue de noche.

Personalidad: cercana pero con energía de escenario. Nunca corporativa, nunca fría.

## 2. Tokens

### Color

| Token | Hex | Uso |
|---|---|---|
| `--noche` (fondo base) | `#070D1F` | Azul-noche casi negro. TODO vive sobre este fondo |
| `--superficie` | `#0E1830` | Cards y paneles |
| `--superficie-2` | `#131F3D` | Elevación, estados hover |
| `--cobalto` (marca) | `#004AAD` | Solo en gradientes, glows y botones primarios — NUNCA plano sobre fondo oscuro |
| `--periwinkle` (interactivo) | `#597CFF` | Links, iconos, hovers, focus — brilla donde el cobalto se apaga |
| `--azul-claro` (apoyo) | `#83B4FF` | Eyebrows, texto secundario azulado |
| `--verde` (energía) | `#37C563` | SOLO acentos: badges "en vivo", chips de fecha, categorías, indicadores de disponibilidad |
| `--texto` | `#F2F5FC` | Texto principal |
| `--texto-2` | `#94A0BD` | Texto secundario |
| `--linea` | `rgba(131,180,255,.12)` | Bordes de cards y divisores |

**Gradientes firma (máximo uno protagonista por pantalla):**
- Botones primarios: `linear-gradient(95deg, #004AAD, #597CFF)`
- Remate de titular (muy puntual): `linear-gradient(92deg, #597CFF, #37C563)` con background-clip: text
- Glows de hero: `radial-gradient` de cobalto al 40-50% de opacidad, blur 100-120px

### Tipografía

- **Big Shoulders Display** (weights 700-900, uppercase) — titulares y displays. Vibra de cartel de gira; condensada, permite titulares largos en español sin romper línea
- **Fira Sans** (300-700) — UI y cuerpo de texto (igual que el manual de marca)

Reglas duras:
- Big Shoulders SOLO de 24px hacia arriba; debajo de 24px todo es Fira Sans (la condensada pierde legibilidad en pequeño)
- Big Shoulders NUNCA en texto corrido, párrafos o labels de UI
- Tracking en displays: ligeramente positivo (`letter-spacing: .005em` a `.01em`) — el tracking negativo la empasta
- El contraste de escala es parte del diseño: titulares hero 48-116px (`clamp(48px, 8.5vw, 116px)`) contra cuerpo de 16px
- Carga: Google Fonts `Big+Shoulders+Display:wght@400..900` y `Fira+Sans:wght@300;400;500;600;700`

### Espaciado, radios y sombras

- Escala base **8px** (8/16/24/32/48/64/96)
- Secciones separadas por ~96px vertical
- Cards: radio **20px**, borde `1px solid rgba(131,180,255,.12)`, padding interno 20-24px
- Botones y badges: radio **100px** (pill)
- Contenedor: max-width 1240px, padding lateral 32px
- Sombras: solo en hover de cards (`0 20px 50px rgba(0,0,0,.5)`) y en botones primarios (`0 8px 32px rgba(0,74,173,.4)`). Nada de sombras grises flotantes

## 3. Componentes

- **Botones primarios:** gradiente cobalto→periwinkle, pill, texto blanco 600, hover con `translateY(-2px)` y sombra más intensa. Verbo directo: "Ver próximos conciertos", "Unirme gratis"
- **Botones secundarios:** fondo transparente, borde `--linea`, hover con fondo `--superficie`
- **Cards de concierto:** media 16/10 con overlay `linear-gradient(180deg, transparent 40%, rgba(7,13,31,.85))` desde abajo; chip de fecha arriba-derecha con número grande en verde (Big Shoulders 800) y mes pequeño; nombre de artista en periwinkle uppercase 12px tracking .14em; hover eleva 4px y borde pasa a `rgba(89,124,255,.35)`
- **Badge "en vivo":** punto verde pulsante (animation con box-shadow expansivo) + texto verde 11px 700 uppercase
- **Eyebrows de sección:** 13px 600 uppercase tracking .12em en `--azul-claro`, precedidos por una barra de 24×2px en verde
- **Fotos:** full-bleed con overlay de gradiente oscuro desde abajo para que el texto respire encima
- **Inputs:** fondo `--superficie`, borde `--linea`, focus con `outline: 2px solid #597CFF`
- **Iconografía:** monocroma, stroke, en periwinkle o blanco. Nunca multicolor, nunca emojis como iconos

## 4. Elemento firma

**Los arcos del isotipo convertidos en luz de escenario:** líneas curvas SVG gigantes (stroke 2px, opacidades .1-.25 en periwinkle/azul-claro, una en verde .16) saliendo del horizonte inferior del hero, como la silueta del estadio iluminado. Reaparecen en miniatura (2 arcos, ~400px) en esquinas de secciones destacadas. Es el motivo gráfico propio que ninguna referencia violeta tiene y conecta directo con el logo. Usarlo en hero + máximo 1-2 apariciones secundarias por página.

## 5. Do's & Don'ts

✅ **Hacer:**
- Contenido real de la plataforma (artistas, venues y fechas reales de LATAM: Movistar Arena, Estéreo Picnic, etc.)
- Todo en español, dirigido a fans ("tus artistas favoritos", nunca "los usuarios")
- Un solo gradiente protagonista por pantalla
- Verde exclusivamente como chispa de energía puntual
- Overlay oscuro sobre toda foto que lleve texto encima
- Responsive hasta móvil, focus visible (`outline #597CFF`), `prefers-reduced-motion` respetado

❌ **Evitar:**
- Azul cobalto `#004AAD` plano sobre fondo oscuro (se apaga — siempre en gradiente o glow)
- Verde como color estructural: botones grandes, fondos, secciones enteras
- Big Shoulders en tamaños pequeños o texto corrido
- Fondos claros o grises — todo vive en la noche
- **Violeta/morado en cualquier forma** (es el mar genérico de las apps de música con IA; la diferencia de esta marca es el azul-verde)
- Más de un gradiente protagonista por pantalla
- Iconos multicolor, emojis como bullets
- Glassmorphism generalizado (máximo: navbar con `backdrop-filter: blur`)
- Layouts 100% centrados y simétricos en todas las secciones — alternar con asimetría intencional (ej. destacada en grid 1.1fr/.9fr)
- Inter, Poppins o Montserrat como defaults

## 6. Voz del copy

Tono: directo, cercano y con emoción de fan — nunca corporativo. Sentence case en UI, uppercase solo en displays.

- Botón: "Ver próximos conciertos" · "Leer historia" · "Unirme gratis"
- Título hero: "TODOS LOS CONCIERTOS DE LATINOAMÉRICA"
- Título de sección: "Las giras del momento" · "Los mejores momentos"
- Subtítulo: "Fechas, entradas, setlists y las historias detrás de cada show."
- CTA comunidad: "No te pierdas ningún show"
- Footer: "Hecho con amor por la música en vivo"
