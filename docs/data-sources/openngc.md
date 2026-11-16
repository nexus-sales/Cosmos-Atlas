# Catálogo OpenNGC

La copia de `scripts/data/OpenNGC.csv.gz` procede de `database_files/NGC.csv` del repositorio público de Mattia Verga, descargada el 15 de noviembre de 2026.

- Fuente https://github.com/mattiaverga/OpenNGC
- Copyright 2023 Mattia Verga y colaboradores indicados en `scripts/data/OpenNGC-AUTHORS`.
- Licencia CC BY-SA 4.0, incluida en `scripts/data/OpenNGC-LICENSE.txt`. El binario derivado conserva esta licencia.
- SHA-256 del CSV descomprimido `54abea0b57b0a103831bfc7a8e3a99a23acfbf4bb581fcf3d8af539cbb826c84`.

## Regeneración

Ejecutar `node scripts/generate-ngc.mjs` desde la raíz. Usa la copia comprimida incluida, sin descargar dependencias ni datos. Admite otro CSV OpenNGC como primer argumento.

El binario contiene 3.987 objetos con identificador NGC/IC numérico canónico, coordenadas y magnitud V publicada. Se excluyen duplicados, entradas inexistentes, sufijos de componentes, tipos estelares y objetos sin magnitud V. Las magnitudes B y los valores ausentes se excluyen del catálogo fotométrico. Un tamaño ausente se almacena como cero y la ficha deja el tamaño sin especificar.

Cada registro conserva los 20 bytes originales. Los tres bytes antes reservados codifican el identificador como uint24LE, con el bit 23 para IC y el resto para el número. Cero identifica registros del formato antiguo, que se muestran como filas anónimas. La URL incluye `?v=2` para renovar datos almacenados en caché.

## Exploración

La búsqueda local incluye objetos con V ≤ 10. La capa de puntos permite seleccionar los objetos dibujados y muestra hasta ocho etiquetas separadas en el cono visible cuando FOV < 5°. El límite fotométrico crece con el zoom hasta V 14 en Bortle 1 y calidad alta. El cupo de 2.000 puntos se reparte después de aplicar el frustum de cámara. Las coincidencias a menos de 0,03° con objetos curados se omiten de esta capa para reducir duplicados. Esta coincidencia posicional es aproximada.
