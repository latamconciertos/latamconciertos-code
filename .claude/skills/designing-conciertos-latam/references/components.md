# Componentes — Conciertos Latam (Manual de Marca v2.0)

Todo el código asume `tokens.css` cargado. Copiar y adaptar el contenido, no los tokens.

## Botones

```html
<button class="btn btn-primario">Ver próximos conciertos</button>
<button class="btn btn-secundario">Leer historia</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border: 0;
  border-radius: var(--radio-pill);
  font: 600 16px/1 var(--font-ui);
  color: var(--blanco);
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
}

.btn-primario {
  background: var(--grad-primario);
  box-shadow: var(--sombra-boton);
}
.btn-primario:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(117, 22, 226, .6);
}

.btn-secundario {
  background: transparent;
  border: 1px solid var(--linea);
  font-weight: 500;
}
.btn-secundario:hover { background: var(--superficie); }
```

## Card de concierto

```html
<article class="card-concierto">
  <div class="card-media">
    <img src="…" alt="Shakira en vivo">
    <div class="card-overlay"></div>
    <div class="chip-fecha">
      <span class="chip-dia">14</span>
      <span class="chip-mes">Mar</span>
    </div>
  </div>
  <div class="card-body">
    <p class="card-artista">Shakira</p>
    <h3 class="card-titulo">Estadio El Campín</h3>
    <p class="card-meta">Bogotá, Colombia</p>
  </div>
</article>
```

```css
.card-concierto {
  background: var(--superficie);
  border: 1px solid var(--linea);
  border-radius: var(--radio-card);
  overflow: hidden;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}
.card-concierto:hover {
  transform: translateY(-4px);
  border-color: rgba(231, 4, 133, .35);
  box-shadow: var(--sombra-card-hover);
}

.card-media { position: relative; aspect-ratio: 16 / 10; }
.card-media img { width: 100%; height: 100%; object-fit: cover; }
.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(7, 13, 31, .85));
}

.chip-fecha {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(7, 13, 31, .9);
  line-height: 1;
}
.chip-dia { font: 800 26px var(--font-display); color: var(--naranja); }
.chip-mes {
  margin-top: 2px;
  font: 600 11px var(--font-ui);
  color: var(--blanco);
  text-transform: uppercase;
  letter-spacing: .08em;
}

.card-body { padding: 20px; }
.card-artista {
  font: 600 12px var(--font-ui);
  color: var(--fucsia);
  text-transform: uppercase;
  letter-spacing: .14em;
  margin-bottom: 8px;
}
.card-titulo { font-size: 28px; }
.card-meta { color: var(--texto-2); font-size: 14px; margin-top: 6px; }
```

## Badge "en vivo"

```html
<span class="badge-vivo">En vivo</span>
```

```css
.badge-vivo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font: 700 11px var(--font-ui);
  color: var(--naranja);
  text-transform: uppercase;
  letter-spacing: .12em;
}
.badge-vivo::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--naranja);
  animation: pulso-vivo 1.6s ease-out infinite;
}
@keyframes pulso-vivo {
  0%   { box-shadow: 0 0 0 0 rgba(254, 103, 12, .5); }
  100% { box-shadow: 0 0 0 10px rgba(254, 103, 12, 0); }
}
```

## Eyebrow de sección

```html
<p class="eyebrow">Las giras del momento</p>
```

```css
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font: 600 13px var(--font-ui);
  color: var(--fucsia);
  text-transform: uppercase;
  letter-spacing: .12em;
}
.eyebrow::before {
  content: "";
  width: 24px;
  height: 2px;
  background: var(--grad-arco);
}
```

## Input

```html
<input class="input" type="email" placeholder="tucorreo@ejemplo.com">
```

```css
.input {
  width: 100%;
  padding: 12px 16px;
  background: var(--superficie);
  border: 1px solid var(--linea);
  border-radius: 12px;
  color: var(--blanco);
  font: 400 15px var(--font-ui);
}
.input::placeholder { color: var(--texto-2); }
.input:focus {
  outline: 2px solid var(--fucsia);
  outline-offset: 2px;
}
```

## Navbar

Única superficie con blur permitida en toda la página.

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(7, 13, 31, .75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--linea);
}
.navbar-inner {
  max-width: var(--contenedor);
  margin: 0 auto;
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.navbar-link { color: var(--blanco); font: 500 15px var(--font-ui); }
.navbar-link:hover { color: var(--fucsia); text-decoration: none; }
```

## Remate degradado en titular

Solo **una palabra o remate por pieza** (ej. "LATAM").

```html
<h1>Todos los conciertos de <span class="remate-grad">Latinoamérica</span></h1>
```

```css
.remate-grad {
  background: var(--grad-arco);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

## Glow de hero

Cuenta como el gradiente protagonista de la pantalla (junto con el botón primario del hero).

```css
.hero { position: relative; overflow: hidden; }
.hero-glow {
  position: absolute;
  top: -160px;
  left: 50%;
  transform: translateX(-50%);
  width: 720px;
  height: 720px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(117, 22, 226, .45), transparent 70%);
  filter: blur(110px);
  pointer-events: none;
}
```

## Arcos (elemento firma)

SVGs en `assets/arcos-hero.svg` (hero, 5 arcos) y `assets/arcos-mini.svg` (secundario, 2 arcos). Inline o como `<img>`, siempre con `aria-hidden="true"`.

```css
.arcos {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}
```

## Foto con texto encima

Toda foto con texto lleva overlay oscuro desde abajo.

```css
.foto-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(7, 13, 31, .85));
}
```
