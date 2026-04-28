# Cosmos App — Bóveda celeste y Vía Láctea

Prototipo visual en HTML, CSS y JavaScript para recrear una app tipo planetario.

## Archivos

- `index.html`: estructura de la interfaz.
- `styles.css`: diseño visual oscuro, paneles, botones y controles.
- `app.js`: render de estrellas, bóveda visual y Vía Láctea procedural en Canvas.

## Cómo usar

Abre `index.html` directamente en el navegador.

También puedes usar un servidor local:

```bash
python -m http.server 8000
```

Luego abre:

```text
http://localhost:8000
```

## Personalización rápida

En `app.js` puedes cambiar:

- `starCount`: densidad de estrellas.
- Cantidad de `nebula`: intensidad de la Vía Láctea.
- `zoomSlider`: zoom visual de la bóveda.
- Colores de nubes en `drawMilkyWay()`.

## Nota

Este prototipo no usa una textura astronómica real. La Vía Láctea está generada proceduralmente para parecerse al mockup. Para una app final, puedes reemplazarla con una textura panorámica/skybox real o usar Three.js.
