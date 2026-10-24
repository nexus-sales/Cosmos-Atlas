# 2MASS Color HiPS

- Servicio: `https://alasky.cds.unistra.fr/2MASS/Color`
- Identificador Aladin: `P/2MASS/color`
- Cobertura: cielo completo
- Marco: ecuatorial, servido como jerarquía HEALPix/HiPS
- Resolución máxima publicada: orden HiPS 9, teselas JPEG de 512 px
- Bandas: J, H y K del infrarrojo cercano, compuestas en color
- Licencia de los datos: ODbL 1.0
- Créditos: CDS/CNRS/Université de Strasbourg y 2MASS (UMass/IPAC-Caltech)

## Uso en Cosmos Atlas

La vista se carga únicamente cuando el usuario pulsa **HiPS**. Utiliza Aladin Lite 3.8.1 desde el servidor oficial de CDS y solicita las teselas 2MASS directamente al servicio HiPS; por tanto, necesita conexión a Internet. No se presenta como color visible ni se usa como sustituto silencioso de la bóveda local.

Aladin Lite no se incorpora como dependencia distribuida por npm. La versión consultada del paquete declara GPL-3.0, por lo que se mantiene como recurso remoto opcional y se conservan su logotipo, enlaces y créditos.
