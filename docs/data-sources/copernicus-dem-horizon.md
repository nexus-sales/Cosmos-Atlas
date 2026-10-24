# Horizonte local con Copernicus DEM

- Proveedor de consulta: Open-Meteo Elevation API.
- Modelo: Copernicus DEM 2021 GLO-90.
- Resolución nominal: 90 metros.
- Licencia de la API/datos declarada por el proveedor: CC BY 4.0.
- Atribución requerida: Open-Meteo y programa Copernicus.

Cosmos Atlas consulta elevaciones en radios de 0,5 a 64 km cada 10° de azimut. El perfil toma el mayor ángulo aparente y corrige la curvatura terrestre con un radio efectivo de 7/6, una aproximación atmosférica habitual. El resultado se guarda temporalmente y se emplea como máscara de profundidad; por tanto, el relieve sí oculta los objetos de la bóveda.

Limitaciones: GLO-90 no representa edificios, árboles ni accidentes menores de 90 m. Si el servicio remoto falla se conserva el horizonte plano existente y no se inventa un perfil.
