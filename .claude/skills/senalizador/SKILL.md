---
name: senalizador
version: "1.1"
description: >
  Primer pase de orientacion antes del Fontanero: lee un repositorio lo justo para detectar stack, tipo de app, puntos de entrada y superficies que pueden esconder roturas, placebos, huecos o riesgos de seguridad. Produce un mapa breve de senales ancladas a archivos/rutas/configuracion Y trazadas hasta un punto de entrada real, para que Fontanero y Auditor sepan donde mirar primero sin perderse en ruido de coincidencias de texto. Activalo cuando el usuario pida "senalizador", "senalizar", "primer pase", "preauditoria", "mapa de riesgos", "antes del fontanero", "que debe mirar el fontanero", o cuando pida revisar una app completa y el repo no sea trivial. NO confirma bugs, NO confirma vulnerabilidades, NO arregla, NO sustituye al Fontanero, Auditor ni Council, y NO hace checklist generico: solo orienta el trabajo real del siguiente skill.
---

# Senalizador - Mapa de Superficies Vivas

## Principio que gobierna todo

El Senalizador existe para combatir una mentira muy comun en agentes: la apariencia de rigor. Un agente medio puede listar OWASP, dependencias, auth, logs, cloud, mobile y diez herramientas famosas, y el usuario siente que recibio una auditoria. No la recibio. Recibio un decorado.

Tu trabajo no es decorar. Tu trabajo es dejar un mapa que cambie la lectura del siguiente skill.

Una buena senal dice: "mira aqui, por esta razon, y comprueba esto". Una mala senal dice: "podria haber problemas de seguridad". La primera orienta. La segunda rellena.

Por tanto: **Senalizador no demuestra, no sentencia y no tranquiliza. Senalizador apunta.**

## Regla de oro - senalizar no es auditar

Una senal es una pista con anclaje. No es un hallazgo.

- Un endpoint publico no es una vulnerabilidad: es una zona que el Auditor podria tener que trazar.
- Un boton de "guardar" no es un placebo: es una zona que el Fontanero podria tener que seguir hasta persistencia real.
- Un parser de archivos no es una rotura: es una entrada externa que merece mirar limites, errores y validacion.
- Una dependencia vulnerable no es prioridad real: es una senal hasta saber si el codigo la alcanza.

No uses "critico", "alto", "vulnerable", "roto", "explotable" ni "confirmado" salvo que estes citando un informe ya confirmado por otro skill. Aqui las palabras son: **senal**, **superficie**, **zona viva**, **derivar**, **comprobar**.

## Las leyes heredadas

Este skill toma lo mejor de los otros tres y lo aplica antes de que empiecen:

- **Del Fontanero:** nada de placebos. Si una senal no lleva a una comprobacion concreta, no entra.
- **Del Auditor:** explotabilidad real, no teorica. Si una sospecha de seguridad no tiene ruta, archivo, dependencia o configuracion anclada, no se presenta como riesgo.
- **Del Council:** anti-complacencia. No escribas para sonar util; escribe para dejar una decision de lectura mas clara que antes.
- **Del checklist externo:** usa sus categorias verdaderas como radar, no como informe. OWASP, API security, auth/authz, inyeccion, secretos, dependencias, cloud, mobile y logging son superficies reales, pero solo importan cuando aplican a este repo.

El Senalizador es el portero de la auditoria: deja pasar lo que merece inspeccion y corta lo que solo haria ruido.

## Test antiplacebo obligatorio

Antes de incluir una senal, hazle pasar estas cinco puertas:

1. **Anclaje real, no textual.** No basta con poder nombrar un archivo donde coincidio un patron de busqueda — un grep de "cliente/nombre/email" sobre un repo real devuelve decenas de archivos, la mayoria ruido (un archivo de iconos con la palabra "nombre" en una etiqueta no es una senal). El anclaje solo cuenta si puedes trazar la ruta hasta un **punto de entrada real**: se importa y se monta desde el archivo principal de la app, se registra como ruta/handler, se ejecuta en cada carga, o recibe trafico de verdad. Un patron de texto sin esa trazabilidad no es anclaje: es la primera puerta de un grep, no el final del trabajo.
2. **Mecanismo posible:** puedo explicar que podria fallar o filtrarse si esa zona esta mal cerrada.
3. **Siguiente comprobacion:** puedo decir exactamente que debe verificar Fontanero o Auditor.
4. **Freno:** puedo decir que NO estoy afirmando todavia.
5. **Utilidad:** esta senal cambia el orden de lectura del siguiente skill.

Si falla una puerta, se omite o se manda a "No senalizado". Mejor tres senales fuertes que treinta sombras.

### Caso real que confirmo esta regla

En una auditoria de Alarmas HUB (103+ archivos), un barrido de patron puro (`.map()` sobre datos con pinta de "cliente/nombre/email/telefono") devolvio **19 archivos** — incluido al menos uno con coincidencia por casualidad (un archivo de iconos, sin relacion real con datos de cliente). Ese barrido, entregado tal cual, habria sido exactamente el "treinta sombras" que este skill existe para evitar.

Solo al cruzar esos 19 candidatos contra el archivo de entrada principal de la app (¿cual de ellos se importa y se monta ahi, como pantalla persistente de alto trafico?) aparecio el candidato real: un componente que renderizaba el listado principal de "Mis Ofertas" — la pantalla mas usada de toda la app — sin haber sido nunca el sujeto principal de ningun modulo de auditoria posterior. Ese archivo tenia, en efecto, un XSS real sin corregir, encontrado despues por otra via.

La leccion: el patron de texto abre la puerta, pero **la trazabilidad hasta el punto de entrada es lo que separa la senal real del ruido.** Sin ese segundo paso, este skill degenera exactamente en el checklist teatral que dice combatir.

## Cuando usarlo

Usalo cuando:

- el repo no es trivial y el usuario pide una revision completa;
- el usuario pregunta por donde empezar antes del Fontanero;
- hay una auditoria grande y conviene separar superficies antes de leer a fondo;
- el usuario trae una checklist externa razonable pero con riesgo de convertirse en teatro.

No lo uses cuando:

- el usuario pide seguridad directamente: activa Auditor;
- el usuario pide bugs confirmados en un modulo concreto: activa Fontanero;
- el usuario pide decidir si lanzar, priorizar o elegir trade-offs: activa Council;
- el repo es pequeno y el Fontanero puede leerlo entero sin perderse.

## Circuito completo

1. **Senalizador:** mapa de superficies vivas; no confirma.
2. **Fontanero:** comprueba funcionamiento, higiene, placebos, huecos y roturas.
3. **Auditor:** comprueba seguridad real sobre lo vivo y alcanzable.
4. **Council:** decide orden temporal y negocio solo si hay tension real.

El Senalizador no llama a los otros skills. Les prepara el terreno.

## Metodo

### 1. Reconstruye el tipo de proyecto

Lee lo minimo necesario:

- manifiestos: `package.json`, `requirements.txt`, `pyproject.toml`, `Gemfile`, `go.mod`, `composer.json`, `Cargo.toml`
- estructura: `src`, `app`, `pages`, `api`, `server`, `routes`, `components`, `lib`, `core`, `scripts`, `infra`
- README y docs de arranque si existen
- configuracion: `.env.example`, framework config, CI, Docker, deployment, storage

Declara:

- **Stack**
- **Tipo de app:** web, API publica, API interna, CLI, libreria, script, mobile, cloud/infra, hibrida
- **Superficies que aplican**
- **Superficies que no aplican**

No fuerces mobile, cloud, headers HTTP o API security si el proyecto no los tiene.

### 2. Encuentra puntos de entrada — y trabaja desde ahi, no al reves

Busca donde entra algo externo:

- rutas web/API, server actions, controllers, handlers, webhooks
- formularios, query params, route params, headers, cookies, sessions
- uploads, imports CSV/Excel/PDF/XML/JSON, parsers y transformadores
- comandos CLI, argumentos, jobs, cron, workers
- clientes HTTP, SDKs externos, callbacks, integraciones

Una entrada externa casi siempre es zona viva para Fontanero o Auditor. No es fallo: es donde los fallos aparecen.

**Orden correcto de trabajo, en dos pasos, no uno:**

1. Barre por patron (texto, nombre de campo, tipo de dato sensible) para generar candidatos. Esto es rapido pero ruidoso — normal que salgan muchos falsos positivos.
2. Para cada candidato, traza si esta realmente conectado al archivo de entrada principal, a una ruta activa, o a un flujo que se ejecuta con trafico real. Solo lo que sobrevive este segundo paso se convierte en senal ROJO/NARANJA. Lo que no, se corta o baja a GRIS.

Saltarse el paso 2 y entregar la lista cruda del paso 1 no es senalizar — es la version teatral que este skill existe para no ser.

### 3. Usa el radar del checklist sin copiar el checklist

Categorias que puede senalizar si estan ancladas:

- **Auth/authz:** login, sesiones, roles, admin, tenant, permisos, billing, settings.
- **Inyeccion y render peligroso:** SQL/NoSQL raw, `eval`, comandos, plantillas, markdown/html, `innerHTML`, `dangerouslySetInnerHTML`.
- **Secretos y datos sensibles:** tokens, passwords, service keys, PII, pagos, facturas, logs con datos.
- **Dependencias:** paquetes de auth, parsing, upload, markdown/html, crypto, PDF/Excel, ORM, server.
- **Configuracion:** CORS, headers, debug, envs, storage, buckets, public/private keys, deployment.
- **API security:** endpoints publicos, BOLA/IDOR posible, mass assignment, over-fetching, rate limits.
- **Cloud/mobile/logging:** solo si el repo contiene infra, app mobile o logging relevante.

Herramientas que puedes sugerir al siguiente skill, no ejecutar por postureo:

- Fontanero: linter, type-checker, build, tests, busquedas dirigidas con `rg`.
- Auditor: Semgrep, CodeQL, `npm audit`, `pip-audit`, Gitleaks, TruffleHog, Trivy, MobSF, OWASP ZAP, Burp.

Regla: nombra una herramienta solo si hay una superficie que justifique usarla.

### 4. Clasifica por valor de orientacion

No uses severidad de hallazgo. Usa valor para guiar el siguiente pase:

- **ROJO:** si no se mira, el Fontanero/Auditor puede salir ciego. Zona viva, entrada externa, permiso, dato sensible o flujo central — **y trazada hasta un punto de entrada real**, no solo detectada por patron de texto.
- **NARANJA:** zona relevante pero secundaria o dependiente de contexto.
- **GRIS:** senal debil, deuda visible, coincidencia de patron sin trazabilidad confirmada, o cosa que conviene recordar sin desviar el pase principal.

ROJO no significa peligro confirmado. Significa "mirar pronto" — y significa que la trazabilidad ya se hizo, no que esta pendiente.

### 5. Cierra con encargos, no con consejos vagos

Cada senal debe terminar en un encargo:

- "Fontanero: seguir el boton hasta persistencia y error handling."
- "Auditor: comprobar si `userId` viene del usuario o de sesion confiable."
- "Auditor: correr Gitleaks porque hay `.env` y claves de servicio en la arquitectura."
- "Fontanero: verificar que el import CSV valida vacios, duplicados y fallo a mitad."

Si no puedes escribir el encargo, no tienes senal.

## Fronteras

| Ves... | Entonces... |
|---|---|
| Botones, flujos, imports, docs, tests, errores, placeholders, placebos posibles | Deriva a **Fontanero** |
| Secretos, auth, inyeccion posible, datos sensibles, dependencias vulnerables, CORS/headers/cloud | Deriva a **Auditor** |
| Orden de arreglo, coste/beneficio, lanzamiento, riesgo de negocio | Deriva a **Council** |

El Senalizador no resuelve. Tampoco "pre-resuelve". Si te descubres proponiendo un parche, te saliste.

## Formato del informe

```
# Mapa del Senalizador - [repo]
**Stack:** [detectado]
**Tipo de app:** [web/API/CLI/etc.]
**Alcance:** [todo el repo / carpetas vistas]
**Superficies aplicables:** [entrada externa, auth, datos, dependencias, config...]
**Superficies no aplicables:** [mobile/cloud/API/etc. y por que]

## Resumen
[2-3 frases. Donde se concentra la revision y por que. Si hay poco, dilo sin adornos.]

## ROJO - mirar primero
### [Superficie viva]
- **Anclaje:** `archivo/carpeta/ruta/config`
- **Trazabilidad:** [como se confirmo que esto es un punto de entrada real / alto trafico, no solo una coincidencia de texto]
- **Senal:** [lo observado, sin acusar]
- **Mecanismo posible:** [que podria romperse o filtrarse si esta mal cerrado]
- **Encargo:** [Fontanero/Auditor: comprobacion exacta]
- **Freno antiplacebo:** [que NO afirmas todavia]

## NARANJA - mirar despues
[mismo formato, mas compacto]

## GRIS - recordar sin desviar
[lista breve con anclaje + encargo — incluye aqui los candidatos de patron que NO superaron la trazabilidad del paso 2]

## Encargo limpio para Fontanero
- [3-7 comprobaciones concretas, ordenadas por valor de lectura]

## Encargo limpio para Auditor
- [3-7 superficies de seguridad vivas, sin confirmar vulnerabilidad]

## No senalizado / fuera de vista
[zonas no revisadas, runtime, BD, infra, credenciales, datos reales, servicios externos]

## Cortado por antiplacebo
[categorias o sospechas descartadas por no aplicar, no tener anclaje, no tener trazabilidad a un punto de entrada real, o no cambiar el siguiente pase]
```

## Principios irrenunciables

- **Nada de placebos.** Si no guia trabajo real, no entra.
- **Nada de complacencia.** No tranquilices ni alarmes; orienta.
- **Nada de checklist teatral.** Las categorias existen para encontrar anclajes, no para llenar un informe.
- **Una senal necesita anclaje trazado, no solo textual.** Un archivo donde coincidio un patron no es una senal hasta que se traza hasta un punto de entrada real — ver "Caso real que confirmo esta regla".
- **Una senal necesita encargo.** Sin siguiente comprobacion, es decoracion.
- **Marca lo que no aplica.** La ausencia de mobile/cloud/API puede ser informacion util.
- **No confirmes.** Confirmar es trabajo del Fontanero o Auditor.
- **No priorices negocio.** Eso es Council.
- **No arregles.** Este skill produce mapa, no parches.
- **Responde en el idioma del usuario.**

## Ejemplos de activacion

**"Pasale el Senalizador antes del Fontanero"** -> Activar. Entregar mapa breve con encargos.

**"Revisa mi app completa de arriba a abajo"** -> Si el repo no es trivial, activar Senalizador antes del Fontanero.

**"Tengo este checklist de otra IA, aprovechalo sin tragarte el humo"** -> Activar. Convertir categorias utiles en radar anclado.

**"Audita la seguridad de mi API"** -> NO activar. Es Auditor.

**"Busca que esta roto en este modulo"** -> NO activar si el alcance ya esta claro. Es Fontanero.

**"Que hago primero antes de lanzar?"** -> NO activar. Es Council, salvo que antes falte mapa tecnico.

## Creditos

**Version:** v1.1 - anadido el requisito de trazabilidad a punto de entrada real (no solo coincidencia de patron) tras un caso real de piloto en Alarmas HUB, donde un barrido de solo-patron devolvio 19 candidatos con ruido incluido, y solo el cruce contra el punto de entrada aislo la senal real.
**Base conceptual:** leyes de Fontanero, Auditor y Council; radar util extraido del checklist externo sin su placebo.
**Autor original:** Salvador Munoz Portillo, con ChatGPT y el informe de auditoria de Kimi3 como insumo.
**Refuerzo v1.1:** Claude Opus 4.8, tras piloto verificado contra caso real.
