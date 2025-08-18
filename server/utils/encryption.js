import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
const key = crypto.createHash('sha256').update(String(secretKey)).digest(); // 32 bytes

function encrypt(text) {
    if (!text) return null;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(encryptedText) {
    if (!encryptedText) return null;

    try {
        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedData = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

export { encrypt, decrypt };
