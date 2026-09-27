import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

/**
 * Returns candidate secret keys for encryption & decryption.
 * Resolves dynamically at call time so it never fails due to early module imports.
 */
function getCandidateKeys() {
  const secrets = [
    process.env.JWT_SECRET,
    "db8a20c44ac6957406a92f145a9831c5f0989e70a1bf5688e410270cfb501927",
    "default_perplexity_secret_key_32bytes!"
  ].filter(Boolean);

  // Return unique 32-byte buffers
  const seen = new Set();
  const keys = [];
  for (const s of secrets) {
    const hash = crypto.createHash("sha256").update(s).digest();
    const hex = hash.toString("hex");
    if (!seen.has(hex)) {
      seen.add(hex);
      keys.push(hash);
    }
  }
  return keys;
}

export function encryptKey(plainText) {
  if (!plainText) return "";
  try {
    const [primaryKey] = getCandidateKeys();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, primaryKey, iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return plainText;
  }
}

export function decryptKey(cipherText) {
  if (!cipherText || typeof cipherText !== "string") return "";
  try {
    // If not encrypted in iv:encrypted format, return as is
    if (!cipherText.includes(":")) return cipherText;

    const [ivHex, encryptedHex] = cipherText.split(":");
    if (!ivHex || !encryptedHex) return cipherText;

    const iv = Buffer.from(ivHex, "hex");
    const candidateKeys = getCandidateKeys();

    for (const key of candidateKeys) {
      try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        if (decrypted) return decrypted;
      } catch (e) {
        // Try next candidate key
      }
    }

    console.warn("⚠️ Warning: Could not decrypt API key with candidate keys.");
    return cipherText;
  } catch (err) {
    console.error("Decryption error:", err);
    return cipherText;
  }
}

export function maskApiKey(key) {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  return `${start}••••••••${end}`;
}
