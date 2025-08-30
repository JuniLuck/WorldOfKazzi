import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import forge from 'node-forge';

// Generate self-signed certificate
function generateCertificate() {
    const pki = forge.pki;
    const keys = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    const attrs = [{
        name: 'commonName',
        value: 'localhost'
    }, {
        name: 'countryName',
        value: 'US'
    }, {
        shortName: 'ST',
        value: 'Virginia'
    }, {
        name: 'localityName',
        value: 'Blacksburg'
    }, {
        name: 'organizationName',
        value: 'Test'
    }, {
        shortName: 'OU',
        value: 'Test'
    }];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'subjectAltName',
        altNames: [{
            type: 2, // DNS
            value: 'localhost'
        }, {
            type: 2,
            value: '192.168.178.42'
        }]
    }]);

    // Self-sign the certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Convert to PEM format
    const pemCert = pki.certificateToPem(cert);
    const pemKey = pki.privateKeyToPem(keys.privateKey);

    return { cert: pemCert, key: pemKey };
}

const { cert, key } = generateCertificate();

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        https: {
            key: key,
            cert: cert,
        },
        host: '192.168.178.42',
        port: 5173,
        strictPort: true,
    }
});
