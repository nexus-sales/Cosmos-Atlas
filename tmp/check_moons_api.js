const Astronomy = require('astronomy-engine');

try {
    const jup = Astronomy.JupiterMoons(new Date());
    console.log('Jupiter Moons available');
} catch (e) { console.log('Jupiter Moons NOT available'); }

try {
    const sat = Astronomy.SaturnMoons(new Date());
    console.log('Saturn Moons available');
} catch (e) { console.log('Saturn Moons NOT available'); }
