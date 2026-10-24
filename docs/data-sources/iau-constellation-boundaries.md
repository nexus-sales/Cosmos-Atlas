# Límites oficiales de constelaciones IAU

- Fuente canónica: E. Delporte, *Délimitation scientifique des constellations* (IAU, 1930).
- Digitalización y transformación J2000: Pierre Barbier, basada directamente en las tablas de Delporte.
- Archivo de origen: `https://pbarbier.com/constellations/lines_in_20.txt`.
- Catálogo de contraste: CDS/VizieR VI/49, Davenhall & Leggett (1989), *Constellation Boundary Data*.
- Transformación local: `scripts/generate-iau-boundaries.mjs` convierte RA en horas a grados y empaqueta las polilíneas J2000 en `public/iau-boundaries.bin` sin alterar las coordenadas.

El archivo contiene límites compartidos, no polígonos artísticos ni textos de culturas celestes. Se renderiza como una capa científica independiente de las figuras mitológicas.
