# Gaia DR3 progresivo

La capa de zoom consulta datos reales de `gaiadr3.gaia_source_lite` mediante el servicio TAP público del archivo de ESA. No genera estrellas sintéticas ni descarga Gaia completo.

## Datos utilizados

- `source_id`, preservado como texto para no perder precisión de 64 bits.
- posición ICRS (`ra`, `dec`) y época de referencia 2016.0;
- magnitud G (`phot_g_mean_mag`);
- color `bp_rp`;
- movimientos propios `pmra` y `pmdec`.

El píxel HEALPix anidado de orden 8 se deriva del `source_id` oficial mediante `source_id / 2^(59 - 2·8)`. La interfaz muestra el identificador Gaia y ese píxel en la ficha.

## Niveles de detalle

Gaia permanece desactivado en campo amplio, donde Hipparcos es suficiente. Al ampliar se solicitan conos centrados en la cámara:

1. FOV 8-18°, G hasta 10,5, máximo 650 fuentes.
2. FOV 3-8°, G hasta 13, máximo 1.400 fuentes.
3. FOV 1,5-3°, G hasta 17, máximo 6.000 fuentes en calidad alta, 1.400 en media y 700 en baja.

Estos son techos de consulta. Bortle reduce la magnitud en `(B-1)*0.55` y el cupo de fuentes. La cantidad devuelta también depende de la densidad del cono. El FOV mínimo compartido es 1,5°.

Las consultas se retrasan hasta que la cámara se estabiliza, tienen timeout, caché HTTP y caché temporal del servidor. Si ESA no responde, la aplicación declara el fallo y mantiene Hipparcos; no sustituye datos con puntos inventados.

## Atribución

This work has made use of data from the European Space Agency (ESA) mission Gaia, processed by the Gaia Data Processing and Analysis Consortium (DPAC). Funding for the DPAC has been provided by national institutions, in particular the institutions participating in the Gaia Multilateral Agreement.

- Archivo oficial: https://gea.esac.esa.int/archive/
- Documentación DR3: https://gea.esac.esa.int/archive/documentation/GDR3/
