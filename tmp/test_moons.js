const Astronomy = require('astronomy-engine');

const date = new Date();
const moons = Astronomy.JupiterMoons(date);

console.log('Io:', moons.io);
console.log('Europa:', moons.europa);
console.log('Ganymede:', moons.ganymede);
console.log('Callisto:', moons.callisto);
