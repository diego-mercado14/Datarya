# DATARYA

Sitio web one-page de DATARYA, construido con React + TypeScript + Vite + Tailwind CSS + Motion.

## Estructura

```text
src/
  components/   # navegación, iconos, UI reutilizable
  sections/     # secciones de la página
  data/         # contenido editable y datos demostrativos
  styles/       # tokens visuales y estilos globales
public/
  images/       # recursos visuales locales
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

El resultado se genera en `dist/` y es compatible con despliegue estático en Cloudflare Pages.

## Personalización rápida

- Contenido y datos: `src/data/site.ts`
- Contacto: `src/data/site.ts`
- Tema y estilos: `src/styles/index.css`
- Imágenes: `public/images/`
- Fotografía del fundador: reemplazar `public/images/founder-placeholder.svg`
- Favicon/branding: `public/favicon.svg`

## Nota sobre demos

El dashboard, el chatbot y AUREA son ejemplos ficticios. Sus cifras, nombres e insights existen únicamente para demostrar capacidades visuales/interactivas.

## Proyectos experimentales

- **[DATARYA CAM-MUSIC](./projects/cam-music/)** — instrumento musical experimental basado en webcam, seguimiento de manos (MediaPipe) y síntesis Web Audio. Incluye código y guía de uso. [Ver concepto original publicado](https://datarya-cam-music.diegojuarez1417.chatgpt.site/). La versión alojada aquí es una reconstrucción para portafolio, no una exportación del código fuente original.
