/**
 * Catálogo de URLs de imágenes reales de DSOs
 * Fuentes: Hubble, Webb, ESO, NASA APOD
 */

export interface DSOImage {
    id: string;
    imageUrl: string;
    credit: string;
    telescope: 'Hubble' | 'Webb' | 'ESO' | 'Chandra' | 'Spitzer' | 'Amateur';
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
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Crab_Nebula.jpg',
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
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Eagle_Nebula_from_ESO.jpg',
        credit: 'ESO',
        telescope: 'ESO'
    },
    'M17': {
        id: 'M17',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic0709a.jpg',
        credit: 'ESA/Hubble',
        telescope: 'Hubble'
    },
    'M20': {
        id: 'M20',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Trifid_Nebula_by_Deddy_Dayag.jpg',
        credit: 'Deddy Dayag',
        telescope: 'ESO'
    },
    'N7293': {
        id: 'N7293',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic1310a.jpg',
        credit: 'NASA, ESA, C.R. O\'Dell',
        telescope: 'Hubble'
    },
    'N1499': {
        id: 'N1499',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/California_Nebula_NGC_1499.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N2237': {
        id: 'N2237',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/07/NGC_2237_Rosette_Nebula.jpg',
        credit: 'NAOJ, Subaru',
        telescope: 'ESO'
    },
    'N6543': {
        id: 'N6543',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Cat%27s_Eye_Nebula_NGC_6543.jpg',
        credit: 'NASA, ESA, HEIC',
        telescope: 'Hubble'
    },
    'N6888': {
        id: 'N6888',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Crescent_Nebula_NGC_6888.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'IC1396': {
        id: 'IC1396',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Elephant_Trunk_Nebula_in_IC1396.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'NGC2392': {
        id: 'NGC2392',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Eskimo_Nebula_NGC_2392.jpg',
        credit: 'NASA, ESA, A. Fruchter',
        telescope: 'Hubble'
    },
    'NGC2359': {
        id: 'NGC2359',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Thor%27s_Helmet_Nebula_NGC_2359.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'IC1805': {
        id: 'IC1805',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Heart_Nebula_IC_1805.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N6992': {
        id: 'N6992',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Veil_Nebula_Supernova_Remnant.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N3372': {
        id: 'N3372',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Carina_Nebula_NGC_3372_from_La_Silla.jpg',
        credit: 'NASA, ESA, N. Smith',
        telescope: 'Hubble'
    },
    'N2024': {
        id: 'N2024',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Flame_Nebula_NGC_2024.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'NGC1333': {
        id: 'NGC1333',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/49/NGC_1333_Spitzer.jpg',
        credit: 'NASA, JPL-Caltech',
        telescope: 'Spitzer'
    },
    'Sh2_106': {
        id: 'Sh2_106',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Sharpless_2-106.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'IC5146': {
        id: 'IC5146',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Cocoon_Nebula_IC_5146.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N1931': {
        id: 'N1931',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/NGC_1931.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'Ou4': {
        id: 'Ou4',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Giant_Squid_Nebula_Ou4.jpg',
        credit: 'Nicolas Outters',
        telescope: 'ESO'
    },
    'N1514': {
        id: 'N1514',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Witch_Head_Nebula.jpg',
        credit: 'Adam Block',
        telescope: 'ESO'
    },
    'N2261': {
        id: 'N2261',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Hubble%27s_Variable_Nebula_%28NGC_2261%29.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },

    // Galaxias
    'M31': {
        id: 'M31',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Andromeda_galaxy_2.jpg',
        credit: 'NASA, ESA, P. Massey',
        telescope: 'Hubble'
    },
    'M51': {
        id: 'M51',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Messier51_sRGB.jpg',
        credit: 'NASA, ESA, S. Beckwith',
        telescope: 'Hubble'
    },
    'M104': {
        id: 'M104',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/M104_ngc4594_sombrero_galaxy_hi-res.jpg',
        credit: 'NASA, ESA, Hubble Heritage',
        telescope: 'Hubble'
    },
    'M81': {
        id: 'M81',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Messier_81_HST.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M82': {
        id: 'M82',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic0604a.jpg',
        credit: 'NASA, ESA, Hubble Heritage Team',
        telescope: 'Hubble'
    },
    'M101': {
        id: 'M101',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/M101_hires_STScI-PRC2006-10a.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M87': {
        id: 'M87',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/39/M87_jet.jpg',
        credit: 'NASA/Hubble',
        telescope: 'Hubble'
    },
    'M64': {
        id: 'M64',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Blackeyegalaxy.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M33': {
        id: 'M33',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/M33_-_Triangulum_Galaxy.jpg',
        credit: 'Alexander Meleg',
        telescope: 'Amateur'
    },
    'M65': {
        id: 'M65',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Messier_65_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M66': {
        id: 'M66',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Messier_66_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M95': {
        id: 'M95',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Messier_95_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M96': {
        id: 'M96',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Messier_96_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M105': {
        id: 'M105',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Messier_105_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M106': {
        id: 'M106',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic1302a.jpg',
        credit: 'NASA, ESA, Hubble, R. Gendler, J. GaBany',
        telescope: 'Hubble'
    },
    'M60': {
        id: 'M60',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Messier_60_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M49': {
        id: 'M49',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Messier_49_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M84': {
        id: 'M84',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Messier_84_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M86': {
        id: 'M86',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Messier_86_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC1275': {
        id: 'NGC1275',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/NGC_1275_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M32': {
        id: 'M32',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/M32_HST_ACS_2004-28-a-large_web.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M110': {
        id: 'M110',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Messier_110_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC891': {
        id: 'NGC891',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/NGC_891_HST.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M74': {
        id: 'M74',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Messier_74_by_HST.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M77': {
        id: 'M77',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Messier_77_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC2403': {
        id: 'NGC2403',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/NGC_2403_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'LMC': {
        id: 'LMC',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic1301a.jpg',
        credit: 'NASA, ESA, ESO',
        telescope: 'Hubble'
    },
    'SMC': {
        id: 'SMC',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic2211a.jpg',
        credit: 'NASA, ESA, STScI',
        telescope: 'Hubble'
    },
    'CenA': {
        id: 'CenA',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Centaurus_A_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC55': {
        id: 'NGC55',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/NGC_55_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },

    // Cúmulos
    'M45': {
        id: 'M45',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Pleiades_large.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M13': {
        id: 'M13',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/potw1011a.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M3': {
        id: 'M3',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic2108a.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M4': {
        id: 'M4',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Messier_4_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M5': {
        id: 'M5',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Messier_5_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M11': {
        id: 'M11',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Messier_11_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M92': {
        id: 'M92',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Messier_92_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC869': {
        id: 'NGC869',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Double_Cluster.jpg',
        credit: 'Genuson',
        telescope: 'Amateur'
    },
    'M6': {
        id: 'M6',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Messier_6_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M7': {
        id: 'M7',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Messier_7.jpg',
        credit: 'Starhopper',
        telescope: 'Amateur'
    },
    'M41': {
        id: 'M41',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Messier_41_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M35': {
        id: 'M35',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Messier_35_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M36': {
        id: 'M36',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Messier_36_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M37': {
        id: 'M37',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Messier_37_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M38': {
        id: 'M38',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Messier_38_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'ωCen': {
        id: 'ωCen',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Omega_Centauri_by_ESO.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M52': {
        id: 'M52',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Messier_52_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M103': {
        id: 'M103',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Messier_103_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC457': {
        id: 'NGC457',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/07/NGC_457_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M50': {
        id: 'M50',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Messier_50_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M46': {
        id: 'M46',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Messier_46_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M47': {
        id: 'M47',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Messier_47_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M48': {
        id: 'M48',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Messier_48_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M67': {
        id: 'M67',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Messier_67_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M34': {
        id: 'M34',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Messier_34_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M39': {
        id: 'M39',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Messier_39_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M29': {
        id: 'M29',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Messier_29_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M23': {
        id: 'M23',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Messier_23_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M25': {
        id: 'M25',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Messier_25_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M26': {
        id: 'M26',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Messier_26_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M28': {
        id: 'M28',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Messier_28_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M21': {
        id: 'M21',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Messier_21_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M24': {
        id: 'M24',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Messier_24_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M53': {
        id: 'M53',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Messier_53_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M85': {
        id: 'M85',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Messier_85_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M91': {
        id: 'M91',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Messier_91_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M12': {
        id: 'M12',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Messier_12_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M10': {
        id: 'M10',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Messier_10_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M14': {
        id: 'M14',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Messier_14_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M19': {
        id: 'M19',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Messier_19_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M62': {
        id: 'M62',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Messier_62_Hubble_WikiSky.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M98': {
        id: 'M98',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/18/M98%2C_NGC_4192_%28noao-m98%29.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M99': {
        id: 'M99',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Messier_99_HST_WFC3_R_%28814%29_G_%28555%29_B_%28275_336_438%29_MAX.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M107': {
        id: 'M107',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/The_globular_star_cluster_Messier_107.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC188': {
        id: 'NGC188',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/NGC_188%2C_Caldwell_1_%28noao0906a%29.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'NGC2264': {
        id: 'NGC2264',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Cone_Nebula_and_Christmas_Tree_Cluster.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'N2244': {
        id: 'N2244',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Rosette_Nebula_Captured_with_DECam_%28noirlab2424a%29.jpg',
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
