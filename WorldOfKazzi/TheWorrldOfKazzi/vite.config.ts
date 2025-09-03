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
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ['legacy-js-api']
            }
        },
    },
    build: {
        cssCodeSplit: true,
        assetsInlineLimit: 0,
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name?.split('.') || [];
                    let extType = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
                        extType = 'img';
                    } else if (/woff2?|eot|ttf|otf/i.test(extType || '')) {
                        extType = 'fonts';
                    }
                    return `${extType}/[name]-[hash][extname]`;
                },
                chunkFileNames: 'js/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js'
            }
        }
    },
    server: {
        https: {
            key: key,
            cert: cert,
        },
        host: true,
        port: 5173,
        strictPort: true,
    }
});
