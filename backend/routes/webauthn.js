const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const jwt = require('jsonwebtoken');

const rpName = 'KatrixPOS';

const getExpectedOrigin = (req) => {
    return req.headers.origin || 'http://localhost:8080';
};
const getRpID = (req) => {
    try {
        const origin = getExpectedOrigin(req);
        return new URL(origin).hostname;
    } catch {
        return 'localhost';
    }
};

// 1. Generate Registration Options
router.post('/generate-registration-options', (req, res) => {
    const { username } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Usuario no encontrado' });

        try {
            db.all('SELECT * FROM webauthn_credentials WHERE user_id = ?', [user.id], async (err, credentials = []) => {
                const options = await generateRegistrationOptions({
                    rpName,
                    rpID: getRpID(req),
                    userID: new Uint8Array(Buffer.from(user.id)),
                    userName: user.username,
                    attestationType: 'none',
                    excludeCredentials: credentials.map(cred => ({
                        id: Buffer.from(cred.id, 'base64url'),
                        type: 'public-key',
                        transports: JSON.parse(cred.transports || '["internal"]'),
                    })),
                    authenticatorSelection: {
                        residentKey: 'preferred',
                        userVerification: 'preferred',
                    },
                });

                db.run('UPDATE users SET current_challenge = ? WHERE id = ?', [options.challenge, user.id], (err) => {
                    if (err) return res.status(500).json({ error: 'Error al iniciar registro' });
                    res.json(options);
                });
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    });
});

// 2. Verify Registration
router.post('/verify-registration', (req, res) => {
    const { username, response } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Usuario no encontrado' });

        try {
            const verification = await verifyRegistrationResponse({
                response,
                expectedChallenge: user.current_challenge,
                expectedOrigin: getExpectedOrigin(req),
                expectedRPID: getRpID(req),
            });

            if (verification.verified && verification.registrationInfo) {
                const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
                const credIdBase64 = Buffer.from(credentialID).toString('base64url');
                const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64url');

                db.run(`INSERT INTO webauthn_credentials (id, user_id, public_key, counter) VALUES (?, ?, ?, ?)`,
                    [credIdBase64, user.id, publicKeyBase64, counter],
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: 'Error al guardar credencial' });
                        }
                        
                        // Clear challenge
                        db.run('UPDATE users SET current_challenge = NULL WHERE id = ?', [user.id]);
                        
                        res.json({ verified: true });
                    }
                );
            } else {
                res.status(400).json({ error: 'Registro biométrico fallido' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    });
});

// 3. Generate Auth Options
router.post('/generate-auth-options', (req, res) => {
    const { username } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Usuario no encontrado' });

        db.all('SELECT * FROM webauthn_credentials WHERE user_id = ?', [user.id], async (err, credentials = []) => {
            if (!credentials.length) return res.status(400).json({ error: 'No hay credenciales biométricas registradas para este usuario' });

            try {
                const options = await generateAuthenticationOptions({
                    rpID: getRpID(req),
                    allowCredentials: credentials.map(cred => ({
                        id: Buffer.from(cred.id, 'base64url'),
                        type: 'public-key',
                        transports: JSON.parse(cred.transports || '["internal"]'),
                    })),
                    userVerification: 'preferred',
                });

                db.run('UPDATE users SET current_challenge = ? WHERE id = ?', [options.challenge, user.id], (err) => {
                    if (err) return res.status(500).json({ error: 'Error al iniciar autenticación' });
                    res.json(options);
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: error.message });
            }
        });
    });
});

// 4. Verify Auth
router.post('/verify-auth', (req, res) => {
    const { username, response } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const credIdParam = response.id; // comes as base64url usually in simplewebauthn
        
        db.get('SELECT * FROM webauthn_credentials WHERE id = ? AND user_id = ?', [credIdParam, user.id], async (err, credential) => {
            if (err || !credential) return res.status(400).json({ error: 'Credencial no encontrada' });

            try {
                const verification = await verifyAuthenticationResponse({
                    response,
                    expectedChallenge: user.current_challenge,
                    expectedOrigin: getExpectedOrigin(req),
                    expectedRPID: getRpID(req),
                    authenticator: {
                        credentialPublicKey: Buffer.from(credential.public_key, 'base64url'),
                        credentialID: Buffer.from(credential.id, 'base64url'),
                        counter: credential.counter,
                    },
                });

                if (verification.verified) {
                    const newCounter = verification.authenticationInfo.newCounter;
                    db.run('UPDATE webauthn_credentials SET counter = ? WHERE id = ?', [newCounter, credential.id]);
                    db.run('UPDATE users SET current_challenge = NULL WHERE id = ?', [user.id]);
                    
                    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });
                    res.json({ verified: true, token, user: { id: user.id, username: user.username } });
                } else {
                    res.status(400).json({ error: 'Verificación biométrica fallida' });
                }
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: error.message });
            }
        });
    });
});

module.exports = router;
