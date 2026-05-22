# Mitigacion de riesgos de dependencias (Aurek)

Fecha: 2026-05-22

## Resumen

- Se elimino la dependencia directa no usada `@tsparticles/react`.
- Se reviso `sharp` y su familia `@img/*` reportada por Aurek.
- No hay version mas nueva disponible para `sharp` (`0.34.5`) ni para los paquetes `@img/*` asociados en el registro npm al momento de la revision.

## Findings tratados

### 1) @tsparticles/react (LOW)

Estado: Resuelto

Accion aplicada:

- Dependencia eliminada con `npm uninstall @tsparticles/react`.
- `package.json` y `package-lock.json` actualizados.

Resultado:

- Se reduce superficie de supply chain al retirar una dependencia directa sin uso.

### 2) @img/sharp-libvips (MEDIUM)

Estado: Mitigado y documentado

Contexto tecnico:

- Es una dependencia transitoria opcional introducida por `sharp`, consumida por `next`.
- No existe version superior a la actualmente resuelta en npm para corregir por upgrade.

Mitigacion aplicada:

- Se mantiene control de riesgo por version pinneada via lockfile.
- Se documenta aceptacion de riesgo legal/operativo para revision de compliance.
- Se mantiene la politica de actualizar `next`/`sharp` en cuanto exista release posterior.

### 3) @img/sharp-wasm32 (MEDIUM)

Estado: Mitigado y documentado

Contexto tecnico:

- Dependencia transitoria opcional de `sharp`.
- Sin version superior disponible al momento de la revision.

Mitigacion aplicada:

- Mismas medidas de control y seguimiento descritas arriba.

### 4) @img/sharp (MEDIUM)

Estado: Mitigado y documentado

Contexto tecnico:

- Variantes de plataforma de `sharp` que llegan de forma transitoria por `next`.
- No hay upgrade disponible que elimine la condicion reportada.

Mitigacion aplicada:

- Seguimiento de releases para aplicar upgrade en cuanto exista version nueva.
- Riesgo legal/compliance registrado para evaluacion del equipo legal.

## Verificacion

- Dependencias reinstaladas y lockfile regenerado.
- Proyecto compilable con la configuracion actual de dependencias.
