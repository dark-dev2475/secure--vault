// Cryptographic utilities (PBKDF2, AES-256-GCM, key derivation)

// Derive a key from a password using PBKDF2
export async function deriveKey(password, salt, iterations = 100000) {
	const enc = new TextEncoder();
	const keyMaterial = await window.crypto.subtle.importKey(
		'raw',
		enc.encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveKey']
	);
	return window.crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: iterations,
			hash: 'SHA-256',
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		true,
		['encrypt', 'decrypt']
	);
}

// Encrypt data with AES-256-GCM
export async function encryptData(key, data) {
	const enc = new TextEncoder();
	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await window.crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		key,
		enc.encode(data)
	);
	return {
		iv: Array.from(iv),
		ciphertext: Array.from(new Uint8Array(ciphertext))
	};
}

// Decrypt data with AES-256-GCM
export async function decryptData(key, iv, ciphertext) {
	const dec = new TextDecoder();
	const ctUint8 = new Uint8Array(ciphertext);
	const ivUint8 = new Uint8Array(iv);
	const plaintext = await window.crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: ivUint8
		},
		key,
		ctUint8
	);
	return dec.decode(plaintext);
}
