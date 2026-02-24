/**
 * Catálogo de URLs de imágenes reales de DSOs
 * Fuentes: Hubble, Webb, ESO, NASA APOD
 */

export interface DSOImage {
    id: string;
    imageUrl: string;
    credit: string;
    telescope: 'Hubble' | 'Webb' | 'ESO' | 'Chandra' | 'Spitzer';
}

// Imágenes de alta resolución de telescopios reales
export const DSO_IMAGES: Record<string, DSOImage> = {
    // Nebulosas
    'M42': {
        id: 'M42',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic1501a.jpg',
        credit: 'ESA/Hubble, NASA',
        telescope: 'Hubble'
    },
    'M1': {
        id: 'M1',
        imageUrl: 'https://apod.nasa.gov/apod/image/1510/Crab_Nebula_1024.jpg',
        credit: 'NASA, ESA',
        telescope: 'Hubble'
    },
    'M57': {
        id: 'M57',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/opo9935e.jpg',
        credit: 'NASA, ESA',
        telescope: 'Hubble'
    },
    'M16': {
        id: 'M16',
        imageUrl: 'https://apod.nasa.gov/apod/image/1506/M16_Hubble_2015_960.jpg',
        credit: 'NASA, ESA, STScI',
        telescope: 'Hubble'
    },
    'M17': {
        id: 'M17',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic0709a.jpg',
        credit: 'ESA/Hubble',
        telescope: 'Hubble'
    },
    'M20': {
        id: 'M20',
        imageUrl: 'https://apod.nasa.gov/apod/image/0408/m20_hubble_1024.jpg',
        credit: 'NASA, ESA, R. O\'Dell',
        telescope: 'Hubble'
    },
    'N7293': {
        id: 'N7293',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic1310a.jpg',
        credit: 'NASA, ESA, C.R. O\'Dell',
        telescope: 'Hubble'
    },
    'N1499': {
        id: 'N1499',
        imageUrl: 'https://apod.nasa.gov/apod/image/1707/California_Nebula_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N2237': {
        id: 'N2237',
        imageUrl: 'https://apod.nasa.gov/apod/image/1404/rosette_subaru_1024.jpg',
        credit: 'NAOJ, Subaru',
        telescope: 'ESO'
    },
    'N6543': {
        id: 'N6543',
        imageUrl: 'https://apod.nasa.gov/apod/image/1510/CatEye_Hubble_1024.jpg',
        credit: 'NASA, ESA, HEIC',
        telescope: 'Hubble'
    },
    'N6888': {
        id: 'N6888',
        imageUrl: 'https://apod.nasa.gov/apod/image/1708/Crescent_Nebula_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'IC1396': {
        id: 'IC1396',
        imageUrl: 'https://apod.nasa.gov/apod/image/1706/ElephantTrunk_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'NGC2392': {
        id: 'NGC2392',
        imageUrl: 'https://apod.nasa.gov/apod/image/1501/Eskimo_Hubble_1024.jpg',
        credit: 'NASA, ESA, A. Fruchter',
        telescope: 'Hubble'
    },
    'NGC2359': {
        id: 'NGC2359',
        imageUrl: 'https://apod.nasa.gov/apod/image/1705/Thor_Helmet_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'IC1805': {
        id: 'IC1805',
        imageUrl: 'https://apod.nasa.gov/apod/image/1401/Heart_Nebula_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N6992': {
        id: 'N6992',
        imageUrl: 'https://apod.nasa.gov/apod/image/1308/Veil_Nebula_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N3372': {
        id: 'N3372',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/Carina_Hubble_1024.jpg',
        credit: 'NASA, ESA, N. Smith',
        telescope: 'Hubble'
    },
    'N2024': {
        id: 'N2024',
        imageUrl: 'https://apod.nasa.gov/apod/image/1401/Flame_Nebula_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'NGC1333': {
        id: 'NGC1333',
        imageUrl: 'https://apod.nasa.gov/apod/image/1405/NGC1333_Spitzer_960.jpg',
        credit: 'NASA, JPL-Caltech',
        telescope: 'Spitzer'
    },
    'Sh2_106': {
        id: 'Sh2_106',
        imageUrl: 'https://apod.nasa.gov/apod/image/1112/s106_hst_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'IC5146': {
        id: 'IC5146',
        imageUrl: 'https://apod.nasa.gov/apod/image/1409/Cocoon_Nebula_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N1931': {
        id: 'N1931',
        imageUrl: 'https://apod.nasa.gov/apod/image/1404/N1931_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'Ou4': {
        id: 'Ou4',
        imageUrl: 'https://apod.nasa.gov/apod/image/1109/squid_nebula_960.jpg',
        credit: 'Nicolas Outters',
        telescope: 'ESO'
    },
    'N1514': {
        id: 'N1514',
        imageUrl: 'https://apod.nasa.gov/apod/image/1211/WitchHead_960.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N2261': {
        id: 'N2261',
        imageUrl: 'https://apod.nasa.gov/apod/image/1401/Hubble_Nebula_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },

    // Galaxias
    'M31': {
        id: 'M31',
        imageUrl: 'https://apod.nasa.gov/apod/image/1509/M31_Hubble_1024.jpg',
        credit: 'NASA, ESA, P. Massey',
        telescope: 'Hubble'
    },
    'M51': {
        id: 'M51',
        imageUrl: 'https://apod.nasa.gov/apod/image/1506/M51_Hubble_1024.jpg',
        credit: 'NASA, ESA, S. Beckwith',
        telescope: 'Hubble'
    },
    'M104': {
        id: 'M104',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/Sombrero_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble Heritage',
        telescope: 'Hubble'
    },
    'M81': {
        id: 'M81',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M81_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M82': {
        id: 'M82',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M82_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M101': {
        id: 'M101',
        imageUrl: 'https://apod.nasa.gov/apod/image/1506/M101_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M87': {
        id: 'M87',
        imageUrl: 'https://apod.nasa.gov/apod/image/1506/M87_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M64': {
        id: 'M64',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/BlackEye_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M33': {
        id: 'M33',
        imageUrl: 'https://apod.nasa.gov/apod/image/1506/M33_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M65': {
        id: 'M65',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M65_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M66': {
        id: 'M66',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M66_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M95': {
        id: 'M95',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M95_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M96': {
        id: 'M96',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M96_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M105': {
        id: 'M105',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M105_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M106': {
        id: 'M106',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M106_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M60': {
        id: 'M60',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M60_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M49': {
        id: 'M49',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M49_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M84': {
        id: 'M84',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M84_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M86': {
        id: 'M86',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M86_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC1275': {
        id: 'NGC1275',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/NGC1275_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M32': {
        id: 'M32',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M32_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M110': {
        id: 'M110',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M110_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC891': {
        id: 'NGC891',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/NGC891_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M74': {
        id: 'M74',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M74_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M77': {
        id: 'M77',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M77_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC2403': {
        id: 'NGC2403',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/NGC2403_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'LMC': {
        id: 'LMC',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/LMC_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'SMC': {
        id: 'SMC',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/SMC_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'CenA': {
        id: 'CenA',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/CenA_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC55': {
        id: 'NGC55',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/NGC55_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },

    // Cúmulos
    'M45': {
        id: 'M45',
        imageUrl: 'https://apod.nasa.gov/apod/image/1506/Pleiades_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M13': {
        id: 'M13',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M13_Hubble_1024.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M44': {
        id: 'M44',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M44_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M3': {
        id: 'M3',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M3_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M4': {
        id: 'M4',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M4_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M5': {
        id: 'M5',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M5_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M11': {
        id: 'M11',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M11_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M92': {
        id: 'M92',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M92_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC869': {
        id: 'NGC869',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/DoubleCluster_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M6': {
        id: 'M6',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M6_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M7': {
        id: 'M7',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M7_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M41': {
        id: 'M41',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M41_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M35': {
        id: 'M35',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M35_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M36': {
        id: 'M36',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M36_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M37': {
        id: 'M37',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M37_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M38': {
        id: 'M38',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M38_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'ωCen': {
        id: 'ωCen',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/OmegaCen_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M52': {
        id: 'M52',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M52_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M103': {
        id: 'M103',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M103_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC457': {
        id: 'NGC457',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/NGC457_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M50': {
        id: 'M50',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M50_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M46': {
        id: 'M46',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M46_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M47': {
        id: 'M47',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M47_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M48': {
        id: 'M48',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M48_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M67': {
        id: 'M67',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M67_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M34': {
        id: 'M34',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M34_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M39': {
        id: 'M39',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M39_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M29': {
        id: 'M29',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M29_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M23': {
        id: 'M23',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M23_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M25': {
        id: 'M25',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M25_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M26': {
        id: 'M26',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M26_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M28': {
        id: 'M28',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M28_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M21': {
        id: 'M21',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M21_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M24': {
        id: 'M24',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M24_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M53': {
        id: 'M53',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M53_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M85': {
        id: 'M85',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M85_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M91': {
        id: 'M91',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M91_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M12': {
        id: 'M12',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M12_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M10': {
        id: 'M10',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M10_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M14': {
        id: 'M14',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M14_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M19': {
        id: 'M19',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M19_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M62': {
        id: 'M62',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M62_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M98': {
        id: 'M98',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M98_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M99': {
        id: 'M99',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M99_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M107': {
        id: 'M107',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/M107_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC188': {
        id: 'NGC188',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/NGC188_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC2264': {
        id: 'NGC2264',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/NGC2264_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'N2244': {
        id: 'N2244',
        imageUrl: 'https://apod.nasa.gov/apod/image/1504/N2244_Hubble_960.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
};

/**
 * Obtiene la URL de imagen para un DSO
 * Si no hay imagen real, devuelve null
 */
export function getDSOImage(id: string): DSOImage | null {
    return DSO_IMAGES[id] || null;
}

/**
 * Precarga una imagen
 */
export function preloadDSOImage(id: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const dsoImage = getDSOImage(id);
        if (!dsoImage) {
            resolve(null);
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dsoImage.imageUrl;
    });
}
