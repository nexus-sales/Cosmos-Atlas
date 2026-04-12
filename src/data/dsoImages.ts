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
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic1310a.jpg',
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
    'NGC1275': {
        id: 'NGC1275',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic0817a.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M110': {
        id: 'M110',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic0202a.jpg',
        credit: 'NASA, ESA, Hubble',
        telescope: 'Hubble'
    },
    'M74': {
        id: 'M74',
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic0719a.jpg',
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
        imageUrl: 'https://esahubble.org/media/archives/images/screen/heic1107a.jpg',
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
