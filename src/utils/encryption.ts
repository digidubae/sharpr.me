import CryptoJS from 'crypto-js';

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
  version: number;
}

// Key derivation function using PBKDF2
function deriveKey(password: string, salt: string): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32, // 256 bits
    iterations: 100000, // High iteration count for better security
    hasher: CryptoJS.algo.SHA256
  });
}

// Add a variable to track the current decryption promise
let currentDecryptionPromise: Promise<any> | null = null;

export async function encryptData(data: any, password: string): Promise<string> {
  try {
    // Generate random salt and IV
    const salt = CryptoJS.lib.WordArray.random(128 / 8); // 128 bits
    const iv = CryptoJS.lib.WordArray.random(128 / 8); // 128 bits for AES
    
    // Derive key from password and salt
    const key = deriveKey(password, salt.toString());
    
    // Convert data to string
    const jsonString = JSON.stringify(data);
    
    // Encrypt using AES-CBC with the derived key and IV
    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Create the final payload
    const payload: EncryptedPayload = {
      ciphertext: encrypted.toString(),
      iv: iv.toString(),
      salt: salt.toString(),
      version: 1 // For future versioning
    };
    
    // Return the stringified payload
    return JSON.stringify(payload);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
}

export async function decryptData(encryptedString: string, password: string): Promise<any> {
  // If there's already a decryption in progress, return that promise
  if (currentDecryptionPromise) {
    return currentDecryptionPromise;
  }

  try {
    // Create a new decryption promise
    currentDecryptionPromise = (async () => {
      try {
        console.log('decryptData called...');
        // Parse the encrypted payload
        const payload: EncryptedPayload = JSON.parse(encryptedString);
        
        // Verify version
        if (payload.version !== 1) {
          throw new Error('Unsupported encryption version');
        }
        
        // Derive the same key using the stored salt
        console.log('deriving key...')
        const key = deriveKey(password, payload.salt);
        
        // Decrypt using AES-CBC with the stored IV
        console.log('decrypting using key...')
        const decrypted = CryptoJS.AES.decrypt(payload.ciphertext, key, {
          iv: CryptoJS.enc.Hex.parse(payload.iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        
        // Convert to string and parse JSON
        console.log('converting to string...')
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
        if (!jsonString) {
          throw new Error('Invalid password or corrupted data');
        }
            
        return JSON.parse(jsonString);
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed - Invalid password or corrupted data');
      }
    })();

    return await currentDecryptionPromise;
  } finally {
    // Clear the current promise after it completes (whether success or failure)
    currentDecryptionPromise = null;
  }
} 