
const query = 'M31#test';
const url = `https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-oIJ/A?${query}`; // Intentional: no encodeURIComponent here to see raw behavior if possible, or use one with it

async function test() {
    console.log(`Testing query: ${query}`);
    try {
        const response = await fetch(url);
        const text = await response.text();
        console.log('--- Status ---');
        console.log(response.status);
        console.log('--- Response Body ---');
        console.log(text);
    } catch (e) {
        console.error(e);
    }
}

test();
